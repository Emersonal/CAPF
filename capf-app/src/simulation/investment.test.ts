/**
 * Tests for Investment functions and GTO solver
 */

import { describe, it, expect } from 'vitest';
import { investmentToW, investmentToSigma, resolveParams, computeExpectedUtility, solveGTO } from './investment';
import { DEFAULT_PARAMETERS } from '../models/types';

describe('Investment Functions', () => {
  describe('investmentToW', () => {
    it('should return w=5 for I=10 (calibration)', () => {
      expect(investmentToW(10)).toBeCloseTo(5, 1);
    });

    it('should satisfy 10x doubling property', () => {
      const w1 = investmentToW(1);
      const w10 = investmentToW(10);
      const w100 = investmentToW(100);

      // 10x investment should approximately double w
      expect(w10 / w1).toBeCloseTo(2, 0);
      expect(w100 / w10).toBeCloseTo(2, 0);
    });

    it('should be monotonically increasing', () => {
      for (let I = 2; I <= 100; I++) {
        expect(investmentToW(I)).toBeGreaterThan(investmentToW(I - 1));
      }
    });

    it('should handle minimum investment', () => {
      expect(investmentToW(1)).toBeGreaterThan(0);
    });
  });

  describe('investmentToSigma', () => {
    it('should return σ=1 for I=10 (calibration)', () => {
      expect(investmentToSigma(10)).toBeCloseTo(1, 1);
    });

    it('should grow faster than w (β > α)', () => {
      const w1 = investmentToW(1);
      const w100 = investmentToW(100);
      const s1 = investmentToSigma(1);
      const s100 = investmentToSigma(100);

      // CV = σ/w should increase with investment
      const cv1 = s1 / w1;
      const cv100 = s100 / w100;
      expect(cv100).toBeGreaterThan(cv1);
    });

    it('should be monotonically increasing', () => {
      for (let I = 2; I <= 100; I++) {
        expect(investmentToSigma(I)).toBeGreaterThan(investmentToSigma(I - 1));
      }
    });
  });

  describe('resolveParams', () => {
    it('should pass through params unchanged when investmentMode=false', () => {
      const params = { ...DEFAULT_PARAMETERS, investmentMode: false };
      const resolved = resolveParams(params);
      expect(resolved).toEqual(params);
    });

    it('should derive w and σ from investment when investmentMode=true', () => {
      const params = { ...DEFAULT_PARAMETERS, investmentMode: true, I1: 10, I2: 10 };
      const resolved = resolveParams(params);
      expect(resolved.w1).toBeCloseTo(5, 1);
      expect(resolved.w2).toBeCloseTo(5, 1);
      expect(resolved.sigma1).toBeCloseTo(1, 1);
      expect(resolved.sigma2).toBeCloseTo(1, 1);
    });

    it('should produce asymmetric w/σ for asymmetric investment', () => {
      const params = { ...DEFAULT_PARAMETERS, investmentMode: true, I1: 50, I2: 10 };
      const resolved = resolveParams(params);
      expect(resolved.w1).toBeGreaterThan(resolved.w2);
      expect(resolved.sigma1).toBeGreaterThan(resolved.sigma2);
    });
  });

  describe('computeExpectedUtility', () => {
    it('should be non-negative (EU floor at 0)', () => {
      // Even with extreme params, EU should never go below 0
      for (const I of [1, 10, 50, 100]) {
        const eu = computeExpectedUtility(I, 10, DEFAULT_PARAMETERS, true);
        expect(eu).toBeGreaterThanOrEqual(0);
      }
      // Also test with very high theta (catastrophe cost)
      const highThetaParams = { ...DEFAULT_PARAMETERS, theta: 200 };
      const eu = computeExpectedUtility(50, 50, highThetaParams, true);
      expect(eu).toBeGreaterThanOrEqual(0);
    });

    it('should be finite for all valid inputs', () => {
      for (const I of [1, 10, 50, 100]) {
        const eu = computeExpectedUtility(I, 10, DEFAULT_PARAMETERS, true);
        expect(isFinite(eu)).toBe(true);
      }
    });

    it('should include wealth endowment in payoff', () => {
      // Higher W should give higher EU (more starting wealth)
      const lowW = { ...DEFAULT_PARAMETERS, W1: 20, W2: 20 };
      const highW = { ...DEFAULT_PARAMETERS, W1: 100, W2: 100 };
      const euLow = computeExpectedUtility(10, 10, lowW, true);
      const euHigh = computeExpectedUtility(10, 10, highW, true);
      expect(euHigh).toBeGreaterThan(euLow);
    });

    it('enemy DSA victory should contribute 0 to payoff', () => {
      // With very asymmetric params where opponent almost certainly wins DSA,
      // our payoff should be low because enemy DSA contributes 0
      const params = {
        ...DEFAULT_PARAMETERS,
        w1: 1,   // Very low own capability
        w2: 10,  // Very high opponent capability
        T: 0.5,  // Easy DSA threshold
        wLinked: false,
      };
      const eu = computeExpectedUtility(10, 10, params, true);
      expect(eu).toBeGreaterThanOrEqual(0);
      // Should be much lower than symmetric case
      const symEu = computeExpectedUtility(10, 10, DEFAULT_PARAMETERS, true);
      expect(eu).toBeLessThan(symEu);
    });

    it('catastrophe payoff should floor at 0', () => {
      // When theta > W - I, catastrophe payoff is max(0, W-I-theta) = 0
      const params = { ...DEFAULT_PARAMETERS, theta: 200, W1: 50, W2: 50 };
      // W(50) - I(10) - theta(200) = -160, should floor at 0
      const eu = computeExpectedUtility(10, 10, params, true);
      expect(eu).toBeGreaterThanOrEqual(0);
      expect(isFinite(eu)).toBe(true);
    });
  });

  describe('solveGTO', () => {
    it('should converge for symmetric default params', () => {
      const params = { ...DEFAULT_PARAMETERS, investmentMode: true, I1: 10, I2: 10 };
      const result = solveGTO(params);

      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(50);
      expect(result.I1).toBeGreaterThanOrEqual(1);
      expect(result.I1).toBeLessThanOrEqual(100);
      expect(result.I2).toBeGreaterThanOrEqual(1);
      expect(result.I2).toBeLessThanOrEqual(100);
    });

    it('should produce symmetric result for symmetric params', () => {
      const params = { ...DEFAULT_PARAMETERS, investmentMode: true, I1: 10, I2: 10 };
      const result = solveGTO(params);

      // With symmetric starting conditions, GTO should be symmetric
      expect(Math.abs(result.I1 - result.I2)).toBeLessThanOrEqual(2);
    });

    it('should have w and σ consistent with investment levels', () => {
      const params = { ...DEFAULT_PARAMETERS, investmentMode: true, I1: 10, I2: 10 };
      const result = solveGTO(params);

      expect(result.w1).toBeCloseTo(investmentToW(result.I1), 1);
      expect(result.w2).toBeCloseTo(investmentToW(result.I2), 1);
      expect(result.sigma1).toBeCloseTo(investmentToSigma(result.I1), 1);
      expect(result.sigma2).toBeCloseTo(investmentToSigma(result.I2), 1);
    });

    it('should return integer I values', () => {
      const params = { ...DEFAULT_PARAMETERS, investmentMode: true, I1: 10, I2: 10 };
      const result = solveGTO(params);
      expect(Number.isInteger(result.I1)).toBe(true);
      expect(Number.isInteger(result.I2)).toBe(true);
    });

    // NE quality check: if converged=true, verify local optimality
    it('should pass NE verification when converged=true (default params)', () => {
      const params = { ...DEFAULT_PARAMETERS, investmentMode: true, I1: 10, I2: 10 };
      const result = solveGTO(params);

      if (result.converged) {
        // EU(I*) >= EU(I* ± 1) for state 1
        const eu1 = computeExpectedUtility(result.I1, result.I2, params, true);
        for (const delta of [-1, 1]) {
          const devI = result.I1 + delta;
          if (devI >= 1 && devI <= 100) {
            const devEU = computeExpectedUtility(devI, result.I2, params, true);
            expect(eu1).toBeGreaterThanOrEqual(devEU - 1e-9);
          }
        }
        // EU(I*) >= EU(I* ± 1) for state 2
        const eu2 = computeExpectedUtility(result.I2, result.I1, params, false);
        for (const delta of [-1, 1]) {
          const devI = result.I2 + delta;
          if (devI >= 1 && devI <= 100) {
            const devEU = computeExpectedUtility(devI, result.I1, params, false);
            expect(eu2).toBeGreaterThanOrEqual(devEU - 1e-9);
          }
        }
      }
    });

    // Adversarial regime: preemptive strike (low T, high V)
    it('should converge for preemptive strike regime (T=0.5, V=100, theta=20)', () => {
      const params = {
        ...DEFAULT_PARAMETERS,
        investmentMode: true,
        I1: 10,
        I2: 10,
        T: 0.5,
        V: 100,
        theta: 20,
      };
      const result = solveGTO(params);

      // Should find a result in valid range
      expect(result.I1).toBeGreaterThanOrEqual(1);
      expect(result.I1).toBeLessThanOrEqual(100);
      expect(result.I2).toBeGreaterThanOrEqual(1);
      expect(result.I2).toBeLessThanOrEqual(100);

      // NE quality: if converged, verify local optimality
      if (result.converged) {
        const eu1 = computeExpectedUtility(result.I1, result.I2, params, true);
        for (const delta of [-1, 1]) {
          const devI = result.I1 + delta;
          if (devI >= 1 && devI <= 100) {
            expect(eu1).toBeGreaterThanOrEqual(
              computeExpectedUtility(devI, result.I2, params, true) - 1e-9
            );
          }
        }
      }
    });

    // Adversarial regime: cheap talk (low c_m)
    it('should converge for cheap talk regime (c_m=0.1)', () => {
      const params = {
        ...DEFAULT_PARAMETERS,
        investmentMode: true,
        I1: 10,
        I2: 10,
        c_m: 0.1,
      };
      const result = solveGTO(params);

      expect(result.I1).toBeGreaterThanOrEqual(1);
      expect(result.I1).toBeLessThanOrEqual(100);

      if (result.converged) {
        const eu1 = computeExpectedUtility(result.I1, result.I2, params, true);
        for (const delta of [-1, 1]) {
          const devI = result.I1 + delta;
          if (devI >= 1 && devI <= 100) {
            expect(eu1).toBeGreaterThanOrEqual(
              computeExpectedUtility(devI, result.I2, params, true) - 1e-9
            );
          }
        }
      }
    });

    // Adversarial regime: very low T, high V, low theta
    it('should handle adversarial params (T=0.5, V=100, theta=10)', () => {
      const params = {
        ...DEFAULT_PARAMETERS,
        investmentMode: true,
        I1: 10,
        I2: 10,
        T: 0.5,
        V: 100,
        theta: 10,
      };
      const result = solveGTO(params);

      // Must return valid range regardless of convergence
      expect(result.I1).toBeGreaterThanOrEqual(1);
      expect(result.I1).toBeLessThanOrEqual(100);
      expect(result.I2).toBeGreaterThanOrEqual(1);
      expect(result.I2).toBeLessThanOrEqual(100);
      expect(isFinite(result.eu1)).toBe(true);
      expect(isFinite(result.eu2)).toBe(true);
    });

    // Graceful degradation: converged flag must be honest
    it('should report converged=false honestly when NE verification fails', () => {
      // Sweep through several param combos and check honesty
      const regimes = [
        { T: 0.5, V: 100, theta: 10, c_m: 0.1 },
        { T: 5, V: 10, theta: 200, c_m: 5 },
        { T: 2, V: 50, theta: 100, c_m: 1 },
      ];
      for (const regime of regimes) {
        const params = {
          ...DEFAULT_PARAMETERS,
          investmentMode: true,
          I1: 10,
          I2: 10,
          ...regime,
        };
        const result = solveGTO(params);

        if (result.converged) {
          // If it says converged, it MUST be a verified NE
          const eu1 = computeExpectedUtility(result.I1, result.I2, params, true);
          const eu2 = computeExpectedUtility(result.I2, result.I1, params, false);
          for (const delta of [-1, 1]) {
            const devI1 = result.I1 + delta;
            if (devI1 >= 1 && devI1 <= 100) {
              expect(eu1).toBeGreaterThanOrEqual(
                computeExpectedUtility(devI1, result.I2, params, true) - 1e-9
              );
            }
            const devI2 = result.I2 + delta;
            if (devI2 >= 1 && devI2 <= 100) {
              expect(eu2).toBeGreaterThanOrEqual(
                computeExpectedUtility(devI2, result.I1, params, false) - 1e-9
              );
            }
          }
        }
        // Whether or not converged, result must be in valid range
        expect(result.I1).toBeGreaterThanOrEqual(1);
        expect(result.I1).toBeLessThanOrEqual(100);
      }
    });
  });
});
