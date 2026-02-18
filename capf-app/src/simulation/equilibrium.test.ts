/**
 * Tests for Patell Model Equilibrium Calculations
 * Verifies the mathematical formulas from Section 4.2
 */

import { describe, it, expect } from 'vitest';
import { normalCDF, normalCDFInverse, sampleNormal } from './math';
import {
  computeTau,
  computeB,
  computeAttackCutoff,
  computeEquilibrium,
} from './equilibrium';
import { DEFAULT_PARAMETERS } from '../models/types';

describe('Mathematical Primitives', () => {
  describe('normalCDF', () => {
    it('should return 0.5 for x=0', () => {
      expect(normalCDF(0)).toBeCloseTo(0.5, 5);
    });

    it('should return ~0.8413 for x=1', () => {
      expect(normalCDF(1)).toBeCloseTo(0.8413, 3);
    });

    it('should return ~0.1587 for x=-1', () => {
      expect(normalCDF(-1)).toBeCloseTo(0.1587, 3);
    });

    it('should return ~0.9772 for x=2', () => {
      expect(normalCDF(2)).toBeCloseTo(0.9772, 3);
    });

    it('should be symmetric: Φ(x) + Φ(-x) = 1', () => {
      for (const x of [0.5, 1, 1.5, 2, 2.5]) {
        expect(normalCDF(x) + normalCDF(-x)).toBeCloseTo(1, 5);
      }
    });
  });

  describe('normalCDFInverse', () => {
    it('should return 0 for p=0.5', () => {
      expect(normalCDFInverse(0.5)).toBeCloseTo(0, 5);
    });

    it('should be inverse of normalCDF', () => {
      for (const x of [-2, -1, 0, 1, 2]) {
        const p = normalCDF(x);
        expect(normalCDFInverse(p)).toBeCloseTo(x, 3);
      }
    });

    it('should return -Infinity for p=0', () => {
      expect(normalCDFInverse(0)).toBe(-Infinity);
    });

    it('should return Infinity for p=1', () => {
      expect(normalCDFInverse(1)).toBe(Infinity);
    });
  });

  describe('sampleNormal', () => {
    it('should produce values with correct mean (approximately)', () => {
      const samples = Array.from({ length: 1000 }, () => sampleNormal(5, 1));
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(mean).toBeCloseTo(5, 0); // Within 0.5 of true mean
    });
  });
});

describe('Equilibrium Computations', () => {
  describe('computeTau', () => {
    it('should compute τ = (V/2 + θ)/(V + θ)', () => {
      // τ = (50/2 + 100)/(50 + 100) = 125/150 = 0.8333...
      expect(computeTau(50, 100)).toBeCloseTo(0.8333, 3);
    });

    it('should always be between 0.5 and 1', () => {
      for (const V of [10, 50, 100]) {
        for (const theta of [10, 50, 100, 200]) {
          const tau = computeTau(V, theta);
          expect(tau).toBeGreaterThan(0.5);
          expect(tau).toBeLessThan(1);
        }
      }
    });

    it('should increase with θ (comparative static)', () => {
      const tau1 = computeTau(50, 50);
      const tau2 = computeTau(50, 100);
      const tau3 = computeTau(50, 200);
      expect(tau2).toBeGreaterThan(tau1);
      expect(tau3).toBeGreaterThan(tau2);
    });

    it('should decrease with V (comparative static)', () => {
      const tau1 = computeTau(20, 100);
      const tau2 = computeTau(50, 100);
      const tau3 = computeTau(100, 100);
      expect(tau2).toBeLessThan(tau1);
      expect(tau3).toBeLessThan(tau2);
    });
  });

  describe('computeB', () => {
    it('should return Φ(-w/σ) when y_j = 0', () => {
      const B = computeB(0, 5, 1);
      const expected = normalCDF(-5 / 1);
      expect(B).toBeCloseTo(expected, 5);
    });

    it('should increase with y_j (higher signal = more mass cut off)', () => {
      const B1 = computeB(0, 5, 1);
      const B2 = computeB(3, 5, 1);
      const B3 = computeB(5, 5, 1);
      expect(B2).toBeGreaterThan(B1);
      expect(B3).toBeGreaterThan(B2);
    });
  });

  describe('computeAttackCutoff', () => {
    it('should return k* = w + T + σ·Φ⁻¹(...) for no signal case', () => {
      const params = DEFAULT_PARAMETERS;
      const tau = computeTau(params.V, params.theta);
      const opponentW = params.w2; // State 1 attacking, opponent is State 2
      const kStar = computeAttackCutoff(params, 0, tau, opponentW);

      // k* should be positive and greater than opponent's w
      expect(kStar).toBeGreaterThan(opponentW);
    });

    it('should increase with opponent signal (higher y_j = higher cutoff)', () => {
      const params = DEFAULT_PARAMETERS;
      const tau = computeTau(params.V, params.theta);
      const opponentW = params.w2;

      const kStar0 = computeAttackCutoff(params, 0, tau, opponentW);
      const kStar3 = computeAttackCutoff(params, 3, tau, opponentW);
      const kStar5 = computeAttackCutoff(params, 5, tau, opponentW);

      // Higher opponent signal should raise my attack threshold
      expect(kStar3).toBeGreaterThan(kStar0);
      expect(kStar5).toBeGreaterThan(kStar3);
    });

    it('should increase with T (comparative static)', () => {
      const params1 = { ...DEFAULT_PARAMETERS, T: 1 };
      const params2 = { ...DEFAULT_PARAMETERS, T: 2 };
      const params3 = { ...DEFAULT_PARAMETERS, T: 3 };
      const opponentW = DEFAULT_PARAMETERS.w2;

      const tau = computeTau(DEFAULT_PARAMETERS.V, DEFAULT_PARAMETERS.theta);

      expect(computeAttackCutoff(params2, 0, tau, opponentW)).toBeGreaterThan(
        computeAttackCutoff(params1, 0, tau, opponentW)
      );
      expect(computeAttackCutoff(params3, 0, tau, opponentW)).toBeGreaterThan(
        computeAttackCutoff(params2, 0, tau, opponentW)
      );
    });

    it('should produce different cutoffs for asymmetric w1/w2', () => {
      const asymmetricParams = { ...DEFAULT_PARAMETERS, w1: 3, w2: 7 };
      const tau = computeTau(asymmetricParams.V, asymmetricParams.theta);

      // State 1's cutoff uses opponent's w2=7
      const kStar1 = computeAttackCutoff(asymmetricParams, 0, tau, asymmetricParams.w2);
      // State 2's cutoff uses opponent's w1=3
      const kStar2 = computeAttackCutoff(asymmetricParams, 0, tau, asymmetricParams.w1);

      // State 1 faces stronger opponent (w2=7), so higher cutoff
      expect(kStar1).toBeGreaterThan(kStar2);
    });
  });

  describe('computeEquilibrium', () => {
    it('should produce valid equilibrium prediction', () => {
      const eq = computeEquilibrium(DEFAULT_PARAMETERS);

      expect(eq.tau).toBeGreaterThan(0.5);
      expect(eq.tau).toBeLessThan(1);
      expect(eq.attackProbability).toBeGreaterThanOrEqual(0);
      expect(eq.attackProbability).toBeLessThanOrEqual(1);
      expect(eq.peaceProbability).toBeGreaterThanOrEqual(0);
      expect(eq.peaceProbability).toBeLessThanOrEqual(1);
      expect(eq.attackCutoffNoSignal).toBeGreaterThan((DEFAULT_PARAMETERS.w1 + DEFAULT_PARAMETERS.w2) / 2);
    });

    it('should have signaling cutoff <= attack cutoff', () => {
      const eq = computeEquilibrium(DEFAULT_PARAMETERS);
      expect(eq.signalingCutoff).toBeLessThanOrEqual(eq.attackCutoffNoSignal);
    });

    it('should show correct comparative statics for T', () => {
      const eq1 = computeEquilibrium({ ...DEFAULT_PARAMETERS, T: 1 });
      const eq2 = computeEquilibrium({ ...DEFAULT_PARAMETERS, T: 3 });

      // Higher T → higher attack cutoff → fewer attacks
      expect(eq2.attackCutoffNoSignal).toBeGreaterThan(eq1.attackCutoffNoSignal);
    });

    it('should show correct comparative statics for θ', () => {
      const eq1 = computeEquilibrium({ ...DEFAULT_PARAMETERS, theta: 50 });
      const eq2 = computeEquilibrium({ ...DEFAULT_PARAMETERS, theta: 150 });

      // Higher θ → higher τ → higher attack cutoff
      expect(eq2.tau).toBeGreaterThan(eq1.tau);
      expect(eq2.attackCutoffNoSignal).toBeGreaterThan(eq1.attackCutoffNoSignal);
    });

    it('should have state-specific cutoffs for asymmetric capabilities', () => {
      const asymmetricParams = { ...DEFAULT_PARAMETERS, w1: 3, w2: 8 };
      const eq = computeEquilibrium(asymmetricParams);

      // State 1 faces stronger opponent (w2=8), State 2 faces weaker (w1=3)
      // So State 1's cutoff should be higher (harder to attack strong opponent)
      expect(eq.attackCutoff1NoSignal).toBeGreaterThan(eq.attackCutoff2NoSignal);
    });

    it('should have near-zero catastrophe probability when one state dominates', () => {
      // w_US=1, w_CN=10 with T=2: China almost always has DSA
      const dominantParams = { ...DEFAULT_PARAMETERS, w1: 1, w2: 10, T: 2 };
      const eq = computeEquilibrium(dominantParams);

      // Gap is ~9, much larger than T=2, so neither-has-DSA is very rare
      // Catastrophe should be very low
      expect(eq.catastropheProbability).toBeLessThan(0.05);
    });

    it('should have high catastrophe probability when capabilities are close', () => {
      // w1=w2=5 with T=2: gap is often within T, catastrophe more likely
      const symmetricParams = { ...DEFAULT_PARAMETERS, w1: 5, w2: 5, T: 2 };
      const eq = computeEquilibrium(symmetricParams);

      // With symmetric capabilities, gaps are often < T, so catastrophe is meaningful
      // Should be higher than the dominant case
      const dominantParams = { ...DEFAULT_PARAMETERS, w1: 1, w2: 10, T: 2 };
      const eqDominant = computeEquilibrium(dominantParams);

      expect(eq.catastropheProbability).toBeGreaterThan(eqDominant.catastropheProbability);
    });

    it('should handle asymmetric sigma correctly', () => {
      // High US sigma, low China sigma
      const asymSigmaParams = { ...DEFAULT_PARAMETERS, sigma1: 2, sigma2: 0.5 };
      const eq = computeEquilibrium(asymSigmaParams);

      // Basic validity checks
      expect(eq.tau).toBeGreaterThan(0.5);
      expect(eq.tau).toBeLessThan(1);
      expect(eq.attackProbability).toBeGreaterThanOrEqual(0);
      expect(eq.attackProbability).toBeLessThanOrEqual(1);

      // State 1 (US) faces low-variance opponent (σ2=0.5)
      // State 2 (China) faces high-variance opponent (σ1=2)
      // Attack cutoff depends on opponent's sigma
      // The cutoffs should be different
      expect(eq.attackCutoff1NoSignal).not.toBeCloseTo(eq.attackCutoff2NoSignal, 1);
    });

    it('should use combined variance for catastrophe probability with asymmetric sigma', () => {
      // σ1=2, σ2=1: combined variance is sqrt(4+1) = sqrt(5) ≈ 2.24
      const asymParams = { ...DEFAULT_PARAMETERS, sigma1: 2, sigma2: 1 };
      const eq = computeEquilibrium(asymParams);

      // Compare to symmetric sigma with same combined variance
      const symParams = { ...DEFAULT_PARAMETERS, sigma1: 1.58, sigma2: 1.58 }; // sqrt(5)/sqrt(2) ≈ 1.58
      const eqSym = computeEquilibrium(symParams);

      // Catastrophe probabilities should be similar (same combined variance)
      // Allow 10% difference due to other formula differences
      expect(Math.abs(eq.catastropheProbability - eqSym.catastropheProbability)).toBeLessThan(0.1);
    });
  });
});
