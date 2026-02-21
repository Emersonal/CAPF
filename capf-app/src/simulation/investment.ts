/**
 * Investment functions and GTO solver for the Patell DSA model
 *
 * Implements Patell Section 5's "endogenize capabilities" extension:
 * States choose investment I, which determines w and σ via power laws.
 * The GTO (Nash Equilibrium) investment can be found via best-response iteration.
 *
 * Power law calibration:
 *   w(I) = A · I^α  where α = log₁₀(2) ≈ 0.301  ("10x investment doubles w")
 *   σ(I) = B · I^β  where β = 0.4                  ("σ grows faster than w")
 *
 * Calibrated so I=10 gives w=5, σ=1 (matching manual defaults).
 */

import type { ModelParameters, InvestmentResult } from '../models/types';
import { computeEquilibrium, computeExpectedMinorCost } from './equilibrium';

// Power law exponents
const ALPHA = Math.log10(2);  // ≈ 0.301
const BETA = 0.4;

// Scale factors calibrated to match defaults at I=10
// A = 5 / 10^0.301 ≈ 2.5,  B = 1 / 10^0.4 ≈ 0.398
const A = 5 / Math.pow(10, ALPHA);
const B = 1 / Math.pow(10, BETA);

/**
 * Convert investment level to base capability w
 * w(I) = A · I^α  where "10x investment doubles capabilities"
 */
export function investmentToW(I: number): number {
  return A * Math.pow(Math.max(I, 0.1), ALPHA);
}

/**
 * Convert investment level to R&D noise σ
 * σ(I) = B · I^β  where β > α (frontier research is more unpredictable)
 */
export function investmentToSigma(I: number): number {
  return B * Math.pow(Math.max(I, 0.1), BETA);
}

/**
 * Resolve parameters: if investmentMode is on, derive w and σ from I values.
 * Otherwise return params unchanged.
 */
export function resolveParams(params: ModelParameters): ModelParameters {
  if (!params.investmentMode) return params;
  return {
    ...params,
    w1: investmentToW(params.I1),
    w2: investmentToW(params.I2),
    sigma1: investmentToSigma(params.I1),
    sigma2: investmentToSigma(params.I2),
    wLinked: false,
    sigmaLinked: false,
  };
}

/**
 * Compute expected utility for a state given investment levels.
 *
 * Per-outcome payoffs for state i:
 *   Peace:              W_i - I_i + V/2
 *   Own DSA victory:    W_i - I_i + V
 *   Enemy DSA victory:  0 (total wipeout)
 *   Catastrophe:        max(0, W_i - I_i - θ)
 *
 * EU_i = P(peace)·(W_i - I_i + V/2)
 *      + P(DSA_i ∧ war)·(W_i - I_i + V)
 *      + P(DSA_j ∧ war)·0
 *      + P(catastrophe)·max(0, W_i - I_i - θ)
 *      - P(minor)·c_m
 *
 * EU_i = max(0, EU_i)
 *
 * @param Ii - This state's investment
 * @param Ij - Opponent's investment
 * @param baseParams - Base parameters (non-investment fields)
 * @param isState1 - Whether computing for state 1 (US)
 */
export function computeExpectedUtility(
  Ii: number,
  Ij: number,
  baseParams: ModelParameters,
  isState1: boolean
): number {
  // Build resolved params from investment levels
  const params: ModelParameters = {
    ...baseParams,
    investmentMode: true,
    I1: isState1 ? Ii : Ij,
    I2: isState1 ? Ij : Ii,
  };
  const resolved = resolveParams(params);
  // Prevent redundant second resolveParams() inside computeEquilibrium
  resolved.investmentMode = false;
  const eq = computeEquilibrium(resolved);

  const { V, theta, w1, w2, sigma1, sigma2 } = resolved;
  const Wi = isState1 ? resolved.W1 : resolved.W2;
  const Ii_cost = Ii; // investment cost

  const peacePart = eq.peaceProbability * (Wi - Ii_cost + V / 2);
  const dsaWinPart = (isState1 ? eq.dsaVictory1Probability : eq.dsaVictory2Probability) * (Wi - Ii_cost + V);
  const dsaLosePart = (isState1 ? eq.dsaVictory2Probability : eq.dsaVictory1Probability) * 0;
  const catastrophePart = eq.catastropheProbability * Math.max(0, Wi - Ii_cost - theta);

  // Use E[L(K) | signal] with contest term instead of just c_m
  const ownW = isState1 ? w1 : w2;
  const ownSigma = isState1 ? sigma1 : sigma2;
  const oppW = isState1 ? w2 : w1;
  const oppSigma = isState1 ? sigma2 : sigma1;
  const sigCutoff = isState1 ? eq.signalingCutoff1 : eq.signalingCutoff2;
  const atkCutoff = isState1 ? eq.attackCutoff1NoSignal : eq.attackCutoff2NoSignal;
  const expectedMinorCost = computeExpectedMinorCost(
    resolved, sigCutoff, atkCutoff, ownW, ownSigma, oppW, oppSigma
  );
  const minorCostPart = eq.minorConflictProbability * expectedMinorCost;

  return Math.max(0, peacePart + dsaWinPart + dsaLosePart + catastrophePart - minorCostPart);
}

/**
 * Find best response: optimal I_i given opponent's I_j
 * Uses grid search then golden-section refinement.
 */
function bestResponse(
  Ij: number,
  baseParams: ModelParameters,
  isState1: boolean
): number {
  const minI = 1;
  const maxI = 100;

  // Grid search (step=1)
  let bestI = minI;
  let bestEU = -Infinity;
  for (let I = minI; I <= maxI; I++) {
    const eu = computeExpectedUtility(I, Ij, baseParams, isState1);
    if (eu > bestEU) {
      bestEU = eu;
      bestI = I;
    }
  }

  // Golden-section refinement around best grid point
  let lo = Math.max(minI, bestI - 1);
  let hi = Math.min(maxI, bestI + 1);
  const phi = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < 20; i++) {
    const x1 = hi - (hi - lo) / phi;
    const x2 = lo + (hi - lo) / phi;
    const eu1 = computeExpectedUtility(x1, Ij, baseParams, isState1);
    const eu2 = computeExpectedUtility(x2, Ij, baseParams, isState1);
    if (eu1 > eu2) {
      hi = x2;
    } else {
      lo = x1;
    }
  }

  return (lo + hi) / 2;
}

/**
 * Verify that (I1, I2) is a local Nash Equilibrium by checking
 * EU(I*) >= EU(I* ± 1) for both players.
 */
function verifyNE(
  I1: number,
  I2: number,
  baseParams: ModelParameters
): boolean {
  const eu1 = computeExpectedUtility(I1, I2, baseParams, true);
  const eu2 = computeExpectedUtility(I2, I1, baseParams, false);

  // Check state 1: no profitable deviation to I1 ± 1
  for (const delta of [-1, 1]) {
    const devI1 = I1 + delta;
    if (devI1 >= 1 && devI1 <= 100) {
      if (computeExpectedUtility(devI1, I2, baseParams, true) > eu1 + 1e-9) {
        return false;
      }
    }
  }

  // Check state 2: no profitable deviation to I2 ± 1
  for (const delta of [-1, 1]) {
    const devI2 = I2 + delta;
    if (devI2 >= 1 && devI2 <= 100) {
      if (computeExpectedUtility(devI2, I1, baseParams, false) > eu2 + 1e-9) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Solve for Game-Theory Optimal (Nash Equilibrium) investment levels
 * using damped best-response iteration (Mann iteration).
 *
 * Uses λ = 0.5 damping: I_new = λ * BR(I_old) + (1 - λ) * I_old
 * This contracts the map even when the best-response slope > 1.
 *
 * Tracks the best candidate across all iterations (smallest max deviation
 * from best response). Verifies NE at output — converged=true only if
 * the result passes local optimality checks.
 */
export function solveGTO(params: ModelParameters): InvestmentResult {
  let I1 = params.I1;
  let I2 = params.I2;
  const maxIter = 50;
  const tolerance = 0.1;
  const lambda = 0.5; // Damping factor

  let iterations = 0;
  let convergedIteration = false;

  // Track best candidate (smallest max BR deviation)
  let bestI1 = I1;
  let bestI2 = I2;
  let bestDeviation = Infinity;

  for (let i = 0; i < maxIter; i++) {
    iterations = i + 1;

    const br1 = bestResponse(I2, params, true);
    const br2 = bestResponse(I1, params, false);

    // Track best candidate by max deviation from BR
    const dev1 = Math.abs(br1 - I1);
    const dev2 = Math.abs(br2 - I2);
    const maxDev = Math.max(dev1, dev2);
    if (maxDev < bestDeviation) {
      bestDeviation = maxDev;
      bestI1 = I1;
      bestI2 = I2;
    }

    // Damped update (Mann iteration)
    const newI1 = lambda * br1 + (1 - lambda) * I1;
    const newI2 = lambda * br2 + (1 - lambda) * I2;

    if (Math.abs(newI1 - I1) <= tolerance && Math.abs(newI2 - I2) <= tolerance) {
      I1 = newI1;
      I2 = newI2;
      convergedIteration = true;
      break;
    }

    I1 = newI1;
    I2 = newI2;
  }

  // If iteration converged, use final values; otherwise use best candidate
  if (!convergedIteration) {
    I1 = bestI1;
    I2 = bestI2;
  }

  // Round to integers for final output, trying nearby integers for NE
  let roundedI1 = Math.round(Math.max(1, Math.min(100, I1)));
  let roundedI2 = Math.round(Math.max(1, Math.min(100, I2)));

  // If rounding doesn't pass NE, try adjacent integers (floor/ceil)
  let converged = verifyNE(roundedI1, roundedI2, params);
  if (!converged) {
    const candidates = [
      [Math.floor(Math.max(1, Math.min(100, I1))), Math.floor(Math.max(1, Math.min(100, I2)))],
      [Math.ceil(Math.max(1, Math.min(100, I1))), Math.ceil(Math.max(1, Math.min(100, I2)))],
      [Math.floor(Math.max(1, Math.min(100, I1))), Math.ceil(Math.max(1, Math.min(100, I2)))],
      [Math.ceil(Math.max(1, Math.min(100, I1))), Math.floor(Math.max(1, Math.min(100, I2)))],
    ];
    for (const [ci1, ci2] of candidates) {
      if (ci1 >= 1 && ci1 <= 100 && ci2 >= 1 && ci2 <= 100 && verifyNE(ci1, ci2, params)) {
        roundedI1 = ci1;
        roundedI2 = ci2;
        converged = true;
        break;
      }
    }
  }
  I1 = roundedI1;
  I2 = roundedI2;

  const w1 = investmentToW(I1);
  const w2 = investmentToW(I2);
  const sigma1 = investmentToSigma(I1);
  const sigma2 = investmentToSigma(I2);
  const eu1 = computeExpectedUtility(I1, I2, params, true);
  const eu2 = computeExpectedUtility(I2, I1, params, false);

  return { I1, I2, w1, w2, sigma1, sigma2, eu1, eu2, converged, iterations };
}
