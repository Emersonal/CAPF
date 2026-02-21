/**
 * Mathematical primitives for the Patell DSA Signaling Model
 *
 * These implement the standard normal distribution functions needed
 * for equilibrium calculations in Section 4.2 of the paper.
 */

/**
 * Standard normal CDF (Φ)
 * Uses the Abramowitz and Stegun approximation (error < 1.5e-7)
 */
export function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Standard normal PDF (φ)
 */
export function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Inverse standard normal CDF (Φ⁻¹)
 * Uses the Acklam rational approximation
 * Accurate to about 1.15e-9 in absolute value
 */
export function normalCDFInverse(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Coefficients for rational approximation
  const a = [
    -3.969683028665376e+01,
    2.209460984245205e+02,
    -2.759285104469687e+02,
    1.383577518672690e+02,
    -3.066479806614716e+01,
    2.506628277459239e+00
  ];

  const b = [
    -5.447609879822406e+01,
    1.615858368580409e+02,
    -1.556989798598866e+02,
    6.680131188771972e+01,
    -1.328068155288572e+01
  ];

  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
    4.374664141464968e+00,
    2.938163982698783e+00
  ];

  const d = [
    7.784695709041462e-03,
    3.224671290700398e-01,
    2.445134137142996e+00,
    3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    // Rational approximation for lower region
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    // Rational approximation for central region
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    // Rational approximation for upper region
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
}

/**
 * Sample from normal distribution N(mean, variance)
 * Uses Box-Muller transform
 */
export function sampleNormal(mean: number, stdDev: number): number {
  let u1: number, u2: number;
  do {
    u1 = Math.random();
    u2 = Math.random();
  } while (u1 === 0); // Avoid log(0)

  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdDev * z;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 15-point Gauss-Legendre quadrature nodes and weights on [-1, 1].
 * Exact for polynomials up to degree 29.
 */
const GL15_NODES: readonly number[] = [
  -0.9879925180204854, -0.9372733924007060, -0.8482065834104272,
  -0.7244177313601700, -0.5709721726085388, -0.3941513470775634,
  -0.2011940939974345,  0.0000000000000000,  0.2011940939974345,
   0.3941513470775634,  0.5709721726085388,  0.7244177313601700,
   0.8482065834104272,  0.9372733924007060,  0.9879925180204854,
];

const GL15_WEIGHTS: readonly number[] = [
  0.0307532419961173, 0.0703660474881081, 0.1071592204671719,
  0.1395706779261543, 0.1662692058169939, 0.1861610000155622,
  0.1984314853271116, 0.2025782419255613, 0.1984314853271116,
  0.1861610000155622, 0.1662692058169939, 0.1395706779261543,
  0.1071592204671719, 0.0703660474881081, 0.0307532419961173,
];

/**
 * Numerical integration via 15-point Gauss-Legendre quadrature.
 * Maps [a, b] → [-1, 1] and computes the weighted sum.
 *
 * Accurate for smooth integrands; exact for polynomials up to degree 29.
 */
export function integrate(f: (x: number) => number, a: number, b: number): number {
  const halfWidth = (b - a) / 2;
  const midpoint = (a + b) / 2;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += GL15_WEIGHTS[i] * f(midpoint + halfWidth * GL15_NODES[i]);
  }

  return halfWidth * sum;
}
