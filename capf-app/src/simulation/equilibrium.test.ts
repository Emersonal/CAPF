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
      const kStar = computeAttackCutoff(params, 0, tau);

      // k* should be positive and greater than w
      expect(kStar).toBeGreaterThan(params.w);
    });

    it('should increase with opponent signal (higher y_j = higher cutoff)', () => {
      const params = DEFAULT_PARAMETERS;
      const tau = computeTau(params.V, params.theta);

      const kStar0 = computeAttackCutoff(params, 0, tau);
      const kStar3 = computeAttackCutoff(params, 3, tau);
      const kStar5 = computeAttackCutoff(params, 5, tau);

      // Higher opponent signal should raise my attack threshold
      expect(kStar3).toBeGreaterThan(kStar0);
      expect(kStar5).toBeGreaterThan(kStar3);
    });

    it('should increase with T (comparative static)', () => {
      const params1 = { ...DEFAULT_PARAMETERS, T: 1 };
      const params2 = { ...DEFAULT_PARAMETERS, T: 2 };
      const params3 = { ...DEFAULT_PARAMETERS, T: 3 };

      const tau = computeTau(DEFAULT_PARAMETERS.V, DEFAULT_PARAMETERS.theta);

      expect(computeAttackCutoff(params2, 0, tau)).toBeGreaterThan(
        computeAttackCutoff(params1, 0, tau)
      );
      expect(computeAttackCutoff(params3, 0, tau)).toBeGreaterThan(
        computeAttackCutoff(params2, 0, tau)
      );
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
      expect(eq.attackCutoffNoSignal).toBeGreaterThan(DEFAULT_PARAMETERS.w);
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
  });
});
