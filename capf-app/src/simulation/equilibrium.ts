/**
 * Equilibrium Computation for the Patell DSA Signaling Game
 * Implements Section 4.2 of "On Decisive Strategic Advantage"
 */

import { normalCDF, normalCDFInverse } from './math';
import type { ModelParameters, EquilibriumPrediction } from '../models/types';

/**
 * Compute the attack threshold τ
 * τ = (V/2 + θ)/(V + θ) ∈ (1/2, 1)
 *
 * This is the probability threshold above which a state prefers war to peace.
 * A state attacks iff p_i(K_i | y_j) ≥ τ, where p_i is the probability of having DSA.
 */
export function computeTau(V: number, theta: number): number {
  return (V / 2 + theta) / (V + theta);
}

/**
 * Compute B_j - the probability mass cut off by observing signal y_j
 * B_j = Φ((y_j - w)/σ)
 *
 * When y_j = 0 (no signal), B_j = Φ(-w/σ)
 */
export function computeB(yj: number, w: number, sigma: number): number {
  return normalCDF((yj - w) / sigma);
}

/**
 * Compute the attack cutoff k*_i(y_j)
 * k*_i(y_j) = w + T + σ · Φ⁻¹(B_j + (1 - B_j)τ)
 *
 * State i attacks iff K_i ≥ k*_i(y_j)
 */
export function computeAttackCutoff(
  params: ModelParameters,
  yj: number,
  tau: number
): number {
  const { w, sigma, T } = params;
  const Bj = computeB(yj, w, sigma);

  // Argument to Φ⁻¹
  const arg = Bj + (1 - Bj) * tau;

  // Handle edge cases
  if (arg <= 0) return -Infinity;
  if (arg >= 1) return Infinity;

  return w + T + sigma * normalCDFInverse(arg);
}

/**
 * Compute the probability that a state attacks given no signal
 * Pr(K_i ≥ k*(0)) = 1 - Φ((k*(0) - w)/σ)
 */
export function computeAttackProbabilityNoSignal(
  params: ModelParameters,
  kStarNoSignal: number
): number {
  const { w, sigma } = params;
  return 1 - normalCDF((kStarNoSignal - w) / sigma);
}

/**
 * Compute the signaling cutoff K̂
 *
 * This is found by solving: ΔA(K̂) · V/2 = L(K̂)
 * where:
 *   ΔA(K) = A(0) - A(K) = reduction in opponent's attack probability
 *   L(K) = expected cost of minor conflict
 *
 * In the catastrophic regime (high θ), Harm ≈ V/2, simplifying the equation.
 *
 * We solve this numerically using bisection.
 */
export function computeSignalingCutoff(
  params: ModelParameters,
  tau: number,
  kStarNoSignal: number
): number {
  const { w, sigma, c_m, V } = params;

  // A(y) = Pr(K_j ≥ k*(y)) - opponent's attack probability given signal y
  const A = (y: number): number => {
    const kStar = computeAttackCutoff(params, y, tau);
    return 1 - normalCDF((kStar - w) / sigma);
  };

  // ΔA(K) = A(0) - A(K)
  const deltaA = (K: number): number => A(0) - A(K);

  // Expected cost of minor conflict when revealing K
  // L(K) ≈ c_m + E[K·K_j/(K + K_j)]
  // For simplicity, approximate as c_m + K/2 (rough approximation)
  // More accurate would require integration over K_j distribution
  const L = (K: number): number => c_m + K / 4;

  // Benefit: ΔA(K) · V/2
  const benefit = (K: number): number => deltaA(K) * V / 2;

  // Find K̂ where benefit(K̂) = L(K̂) using bisection
  let lo = 0;
  let hi = kStarNoSignal;

  // If benefit at 0 is less than cost, no one signals
  if (benefit(lo) < L(lo)) {
    return kStarNoSignal; // Signaling cutoff equals attack cutoff (no signaling region)
  }

  // Bisection search
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const netBenefit = benefit(mid) - L(mid);

    if (Math.abs(netBenefit) < 1e-6) {
      return mid;
    }

    if (netBenefit > 0) {
      lo = mid; // Signaling is still beneficial, raise cutoff
    } else {
      hi = mid; // Signaling not worth it, lower cutoff
    }
  }

  return (lo + hi) / 2;
}

/**
 * Compute probability of catastrophe (war without DSA)
 * This occurs when both states attack but neither has DSA
 */
export function computeCatastropheProbability(params: ModelParameters): number {
  const { sigma, T } = params;

  // Probability that |K_1 - K_2| < T (neither has DSA)
  // K_1 - K_2 ~ N(0, 2σ²)
  const combinedSigma = sigma * Math.sqrt(2);

  // P(|K_1 - K_2| < T) = P(-T < K_1 - K_2 < T) = Φ(T/√2σ) - Φ(-T/√2σ)
  const probNoDSA = normalCDF(T / combinedSigma) - normalCDF(-T / combinedSigma);

  // This is a rough approximation - actual calculation requires
  // integrating over the joint distribution of attack decisions
  return probNoDSA * 0.1; // Scale factor for rough estimate
}

/**
 * Compute probability of minor conflict
 * This is P(K̂ ≤ K < k*(0)) for each state
 */
export function computeMinorConflictProbability(
  params: ModelParameters,
  signalingCutoff: number,
  kStarNoSignal: number
): number {
  const { w, sigma } = params;

  // P(K̂ ≤ K < k*(0))
  const probSignalRegion =
    normalCDF((kStarNoSignal - w) / sigma) -
    normalCDF((signalingCutoff - w) / sigma);

  // Probability at least one state is in signaling region
  // P(at least one signals) = 1 - P(neither signals)
  return 1 - Math.pow(1 - probSignalRegion, 2);
}

/**
 * Compute full equilibrium prediction from parameters
 */
export function computeEquilibrium(params: ModelParameters): EquilibriumPrediction {
  const { V, theta } = params;

  // 1. Compute attack threshold
  const tau = computeTau(V, theta);

  // 2. Compute attack cutoff with no signal
  const attackCutoffNoSignal = computeAttackCutoff(params, 0, tau);

  // 3. Compute signaling cutoff
  const signalingCutoff = computeSignalingCutoff(params, tau, attackCutoffNoSignal);

  // 4. Compute probabilities
  const attackProbability = computeAttackProbabilityNoSignal(params, attackCutoffNoSignal);
  const minorConflictProbability = computeMinorConflictProbability(
    params,
    signalingCutoff,
    attackCutoffNoSignal
  );
  const catastropheProbability = computeCatastropheProbability(params);
  const peaceProbability = Math.max(0, 1 - attackProbability);

  return {
    tau,
    attackProbability,
    minorConflictProbability,
    peaceProbability,
    catastropheProbability,
    attackCutoffNoSignal,
    signalingCutoff,
  };
}

/**
 * Generate comparative statics explanation for parameter change
 */
export function explainParameterChange(
  param: keyof ModelParameters,
  oldValue: number,
  newValue: number,
  oldEq: EquilibriumPrediction,
  newEq: EquilibriumPrediction
): string {
  const direction = newValue > oldValue ? 'increased' : 'decreased';
  const attackChange = newEq.attackProbability > oldEq.attackProbability ? 'increased' : 'decreased';
  const peaceChange = newEq.peaceProbability > oldEq.peaceProbability ? 'increased' : 'decreased';

  const explanations: Record<keyof ModelParameters, string> = {
    T: `DSA Threshold ${direction}. When it's harder to achieve decisive advantage, ` +
      `states become more cautious. Attack probability ${attackChange}.`,
    V: `Prize Value ${direction}. Higher stakes make aggression more tempting. ` +
      `Attack probability ${attackChange}.`,
    theta: `Catastrophe Cost ${direction}. Fear of mutual destruction ${direction}. ` +
      `This paradoxically leads to more proxy wars as states signal to deter. ` +
      `Peace probability ${peaceChange}.`,
    sigma: `Uncertainty ${direction}. With ${direction} variance in outcomes, ` +
      `the value of information through signaling ${direction}.`,
    c_m: `Minor Conflict Cost ${direction}. Proxy wars are now ${newValue > oldValue ? 'more' : 'less'} expensive. ` +
      `States will ${newValue > oldValue ? 'skip signaling and attack directly more often' : 'engage in more proxy conflicts'}.`,
    w: `Base Capability ${direction}. Both states start with ${direction} resources. ` +
      `This shifts the baseline around which uncertainty operates.`,
  };

  return explanations[param];
}
