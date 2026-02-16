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
 * k*_i(y_j) = w_j + T + σ · Φ⁻¹(B_j + (1 - B_j)τ)
 *
 * State i attacks iff K_i ≥ k*_i(y_j)
 * Note: Uses opponent's w_j for B_j computation
 *
 * @param params - Model parameters
 * @param yj - Opponent's signal (0 if no signal)
 * @param tau - Attack threshold
 * @param opponentW - Opponent's base capability (REQUIRED for correct asymmetric computation)
 */
export function computeAttackCutoff(
  params: ModelParameters,
  yj: number,
  tau: number,
  opponentW: number
): number {
  const { sigma, T } = params;
  const Bj = computeB(yj, opponentW, sigma);

  // Argument to Φ⁻¹
  const arg = Bj + (1 - Bj) * tau;

  // Handle edge cases
  if (arg <= 0) return -Infinity;
  if (arg >= 1) return Infinity;

  return opponentW + T + sigma * normalCDFInverse(arg);
}

/**
 * Compute the probability that a state attacks given no signal
 * Pr(K_i ≥ k*(0)) = 1 - Φ((k*(0) - w)/σ)
 */
export function computeAttackProbabilityNoSignal(
  params: ModelParameters,
  kStarNoSignal: number,
  stateW?: number
): number {
  const { w1, w2, sigma } = params;
  const w = stateW ?? (w1 + w2) / 2;
  return 1 - normalCDF((kStarNoSignal - w) / sigma);
}

/**
 * Compute a single state's signaling cutoff K̂
 *
 * This is found by solving: ΔA(K̂) · V/2 = L(K̂)
 * where:
 *   ΔA(K) = A(0) - A(K) = reduction in opponent's attack probability
 *   L(K) = expected cost of minor conflict
 *
 * In the catastrophic regime (high θ), Harm ≈ V/2, simplifying the equation.
 *
 * Signaling strategy: signal iff K̂ ≤ K < k*(0)
 * - Below K̂: cost exceeds benefit, don't signal
 * - Above k*(0): will attack anyway, don't need to signal
 *
 * We solve this numerically using bisection.
 *
 * @param params - Model parameters
 * @param tau - Attack threshold
 * @param ownKStarNoSignal - This state's attack cutoff with no signal
 * @param ownW - This state's base capability
 * @param opponentW - Opponent's base capability (for computing opponent's attack probability)
 */
export function computeSignalingCutoffForState(
  params: ModelParameters,
  tau: number,
  ownKStarNoSignal: number,
  ownW: number,
  opponentW: number
): number {
  const { sigma, c_m, V } = params;

  // A(y) = Pr(K_opponent ≥ k*(y)) - opponent's attack probability given our signal y
  // When we signal y, opponent's attack cutoff k*(y) uses OUR w (ownW) since we're their opponent
  const A = (y: number): number => {
    const opponentKStar = computeAttackCutoff(params, y, tau, ownW);
    return 1 - normalCDF((opponentKStar - opponentW) / sigma);
  };

  // ΔA(K) = A(0) - A(K) - reduction in opponent attack probability from signaling K
  const deltaA = (K: number): number => A(0) - A(K);

  // Expected cost of minor conflict when revealing K
  // L(K) ≈ c_m + E[K·K_j/(K + K_j)]
  // Approximation: c_m + K·opponentW/(K+opponentW)
  const L = (K: number): number => c_m + (K * opponentW) / (K + opponentW + 0.01);

  // Benefit: ΔA(K) · V/2 (deterrence value in catastrophic regime)
  const benefit = (K: number): number => deltaA(K) * V / 2;

  // Search bounds
  let lo = 0;
  let hi = ownKStarNoSignal;

  // Check if signaling is ever beneficial
  // At K near k*(0), ΔA is maximized. If even then benefit < cost, no signaling region.
  const testPoint = ownKStarNoSignal * 0.99; // Just below attack cutoff
  if (benefit(testPoint) < L(testPoint)) {
    return ownKStarNoSignal; // No signaling region
  }

  // Check if signaling is beneficial even at very low K
  // If so, K̂ ≈ 0 (everyone signals)
  if (benefit(ownW * 0.5) >= L(ownW * 0.5)) {
    lo = 0;
  } else {
    lo = ownW * 0.5;
  }

  // Bisection to find K̂ where benefit(K̂) = L(K̂)
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const netBenefit = benefit(mid) - L(mid);

    if (Math.abs(netBenefit) < 1e-6) {
      return mid;
    }

    // benefit increases with K, L also increases with K
    // We want to find where they cross
    // If netBenefit > 0 at mid, signaling is beneficial there, so K̂ < mid
    // If netBenefit < 0 at mid, signaling not beneficial, so K̂ > mid
    if (netBenefit > 0) {
      hi = mid; // K̂ is below mid
    } else {
      lo = mid; // K̂ is above mid
    }
  }

  return (lo + hi) / 2;
}

/**
 * @deprecated Use computeSignalingCutoffForState for asymmetric case
 * Legacy wrapper for backwards compatibility
 */
export function computeSignalingCutoff(
  params: ModelParameters,
  tau: number,
  kStarNoSignal: number
): number {
  const { w1, w2 } = params;
  const avgW = (w1 + w2) / 2;
  return computeSignalingCutoffForState(params, tau, kStarNoSignal, avgW, avgW);
}

/**
 * Compute probability of catastrophe (war without DSA)
 * Catastrophe = at least one state attacks AND neither has DSA
 *
 * P(Catastrophe) = P(War) × P(|K₁ - K₂| < T | War)
 *
 * We approximate by: P(War) × P(|K₁ - K₂| < T)
 * This slightly overestimates since war is more likely when gaps are large.
 */
export function computeCatastropheProbability(
  params: ModelParameters,
  warProbability: number
): number {
  const { w1, w2, sigma, T } = params;

  // Probability that neither has DSA: |K_1 - K_2| < T
  // K_1 - K_2 ~ N(w_1 - w_2, 2σ²) since K_i = w_i + ε_i with ε_i ~ N(0, σ²) i.i.d.
  const meanDiff = w1 - w2;
  const combinedSigma = sigma * Math.sqrt(2);

  // P(-T < K_1 - K_2 < T) = Φ((T - meanDiff)/σ√2) - Φ((-T - meanDiff)/σ√2)
  const probNoDSA = normalCDF((T - meanDiff) / combinedSigma) -
                    normalCDF((-T - meanDiff) / combinedSigma);

  // P(Catastrophe) ≈ P(War) × P(neither has DSA)
  return warProbability * probNoDSA;
}

/**
 * Compute probability of minor conflict with state-specific cutoffs
 * This is P(K̂ᵢ ≤ Kᵢ < k*ᵢ(0)) for each state
 *
 * @param params - Model parameters
 * @param signalingCutoff1 - State 1's signaling cutoff K̂₁
 * @param signalingCutoff2 - State 2's signaling cutoff K̂₂
 * @param attackCutoff1 - State 1's attack cutoff k*₁(0)
 * @param attackCutoff2 - State 2's attack cutoff k*₂(0)
 */
export function computeMinorConflictProbabilityAsymmetric(
  params: ModelParameters,
  signalingCutoff1: number,
  signalingCutoff2: number,
  attackCutoff1: number,
  attackCutoff2: number
): number {
  const { w1, w2, sigma } = params;

  // P(K̂₁ ≤ K₁ < k*₁(0)) for State 1
  const probSignalRegion1 =
    normalCDF((attackCutoff1 - w1) / sigma) -
    normalCDF((signalingCutoff1 - w1) / sigma);

  // P(K̂₂ ≤ K₂ < k*₂(0)) for State 2
  const probSignalRegion2 =
    normalCDF((attackCutoff2 - w2) / sigma) -
    normalCDF((signalingCutoff2 - w2) / sigma);

  // Probability at least one state is in signaling region
  // P(at least one signals) = 1 - P(neither signals)
  return 1 - (1 - Math.max(0, probSignalRegion1)) * (1 - Math.max(0, probSignalRegion2));
}

/**
 * @deprecated Use computeMinorConflictProbabilityAsymmetric for asymmetric case
 * Legacy wrapper for backwards compatibility
 */
export function computeMinorConflictProbability(
  params: ModelParameters,
  signalingCutoff: number,
  kStarNoSignal: number
): number {
  return computeMinorConflictProbabilityAsymmetric(
    params,
    signalingCutoff,
    signalingCutoff,
    kStarNoSignal,
    kStarNoSignal
  );
}

/**
 * Compute full equilibrium prediction from parameters
 */
export function computeEquilibrium(params: ModelParameters): EquilibriumPrediction {
  const { V, theta, w1, w2, sigma } = params;

  // 1. Compute attack threshold τ = (V/2 + θ)/(V + θ)
  const tau = computeTau(V, theta);

  // 2. Compute state-specific attack cutoffs with no signal
  // State 1's cutoff k*₁(0) uses opponent's w2
  const attackCutoff1NoSignal = computeAttackCutoff(params, 0, tau, w2);
  // State 2's cutoff k*₂(0) uses opponent's w1
  const attackCutoff2NoSignal = computeAttackCutoff(params, 0, tau, w1);

  // 3. Compute state-specific signaling cutoffs
  // State 1's K̂₁: own w is w1, opponent w is w2
  const signalingCutoff1 = computeSignalingCutoffForState(params, tau, attackCutoff1NoSignal, w1, w2);
  // State 2's K̂₂: own w is w2, opponent w is w1
  const signalingCutoff2 = computeSignalingCutoffForState(params, tau, attackCutoff2NoSignal, w2, w1);

  // 4. Compute probabilities for each state using their own cutoffs
  // P(state 1 doesn't attack) = Φ((k*₁(0) - w₁)/σ)
  const state1NoAttackProb = normalCDF((attackCutoff1NoSignal - w1) / sigma);
  // P(state 2 doesn't attack) = Φ((k*₂(0) - w₂)/σ)
  const state2NoAttackProb = normalCDF((attackCutoff2NoSignal - w2) / sigma);

  // P(Peace) = P(neither attacks) = P(state1 doesn't attack) × P(state2 doesn't attack)
  const peaceProbability = state1NoAttackProb * state2NoAttackProb;

  // P(War) = P(at least one attacks) = 1 - P(Peace)
  const warProbability = 1 - peaceProbability;

  // Minor conflict probability with state-specific cutoffs
  const minorConflictProbability = computeMinorConflictProbabilityAsymmetric(
    params,
    signalingCutoff1,
    signalingCutoff2,
    attackCutoff1NoSignal,
    attackCutoff2NoSignal
  );

  // Catastrophe = war AND neither has DSA
  const catastropheProbability = computeCatastropheProbability(params, warProbability);

  // Legacy values for backward compatibility (use averages)
  const attackCutoffNoSignal = (attackCutoff1NoSignal + attackCutoff2NoSignal) / 2;
  const signalingCutoff = (signalingCutoff1 + signalingCutoff2) / 2;

  return {
    tau,
    attackProbability: warProbability, // P(at least one attacks)
    minorConflictProbability,
    peaceProbability,
    catastropheProbability,
    // State-specific values
    attackCutoff1NoSignal,
    attackCutoff2NoSignal,
    signalingCutoff1,
    signalingCutoff2,
    // Legacy values (averages)
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
    w1: `US Base Capability ${direction}. US starts with ${direction} resources, ` +
      `making US ${newValue > oldValue ? 'more' : 'less'} likely to achieve DSA.`,
    w2: `China Base Capability ${direction}. China starts with ${direction} resources, ` +
      `making China ${newValue > oldValue ? 'more' : 'less'} likely to achieve DSA.`,
  };

  return explanations[param];
}
