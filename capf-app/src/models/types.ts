/**
 * Type definitions for the Patell DSA Signaling Game
 * Based on "On Decisive Strategic Advantage" Section 4.1
 */

/**
 * Core model parameters (Section 4.1)
 * Extended to support asymmetric capabilities (w1 != w2) and noise (sigma1 != sigma2)
 */
export interface ModelParameters {
  /** US base capability endowment (w_1) */
  w1: number;

  /** China base capability endowment (w_2) */
  w2: number;

  /** Whether w1 and w2 are linked (symmetric) in the UI */
  wLinked: boolean;

  /** US R&D noise std dev (σ_1) */
  sigma1: number;

  /** China R&D noise std dev (σ_2) */
  sigma2: number;

  /** Whether sigma1 and sigma2 are linked (symmetric) in the UI */
  sigmaLinked: boolean;

  /** DSA threshold - capability gap needed for decisive advantage (T) */
  T: number;

  /** Minor conflict baseline cost (c_m) */
  c_m: number;

  /** Prize value - value of controlling the future (V) */
  V: number;

  /** Catastrophe cost - cost if war without DSA (θ) */
  theta: number;

  /** Whether investment mode is enabled (w/σ derived from investment) */
  investmentMode: boolean;

  /** State 1 (US) investment level (1-100) */
  I1: number;

  /** State 2 (China) investment level (1-100) */
  I2: number;

  /** Whether I1 and I2 are linked (symmetric) in the UI */
  investmentLinked: boolean;

  /** State 1 (US) wealth endowment (W_1) */
  W1: number;

  /** State 2 (China) wealth endowment (W_2) */
  W2: number;

  /** Whether W1 and W2 are linked (symmetric) in the UI */
  wealthLinked: boolean;
}

/**
 * Default parameter values
 */
export const DEFAULT_PARAMETERS: ModelParameters = {
  w1: 5,            // US baseline capability budget
  w2: 5,            // China baseline capability budget
  wLinked: true,    // Start with symmetric w
  sigma1: 1,        // US R&D noise
  sigma2: 1,        // China R&D noise
  sigmaLinked: true, // Start with symmetric sigma
  T: 2,             // Moderate DSA threshold
  c_m: 1,           // Moderate minor conflict cost
  V: 50,            // Prize value
  theta: 100,       // High catastrophe cost
  investmentMode: false, // Manual w/σ by default
  I1: 10,           // US investment level
  I2: 10,           // China investment level
  investmentLinked: true, // Start symmetric
  W1: 50,           // US wealth endowment (default = V)
  W2: 50,           // China wealth endowment (default = V)
  wealthLinked: true, // Start with symmetric wealth
};

/**
 * State of a single actor in the game
 */
export interface ActorState {
  id: 'state1' | 'state2';
  name: string;

  // Date 1 outcomes
  budget: number;              // w_i
  privateCapability: number;   // K_i = w_i + ε_i (hidden from opponent)

  // Date 2 choices and outcomes
  minorConflictChoice: number; // y_i ∈ [0, K_i], 0 = no attack
  revealedLowerBound: number;  // Public knowledge after Date 2

  // Date 3 choice
  majorAttackChoice: boolean;  // Z_i ∈ {0, 1}

  // Computed thresholds (for display)
  attackCutoff: number;        // k*_i(y_j)
  signalingCutoff: number;     // K̂_i
}

/**
 * Possible outcomes of a round
 */
export type RoundOutcomeType =
  | 'peace'           // Z_1 = Z_2 = 0
  | 'dsa_victory_1'   // State 1 has DSA and war occurs
  | 'dsa_victory_2'   // State 2 has DSA and war occurs
  | 'catastrophe';    // War without DSA

/**
 * Full record of what happened in a round
 */
export interface RoundOutcome {
  round: number;

  // What actually happened
  capabilityDraws: [number, number];  // [K_1, K_2]
  minorConflictOccurred: boolean;
  signalsSent: [number, number];      // [y_1, y_2]
  majorWarOccurred: boolean;

  // Result
  outcome: RoundOutcomeType;
  payoffs: [number, number];

  // Explanation for the UI
  reasoning: OutcomeReasoning;
}

/**
 * Natural language explanation of why the outcome occurred
 */
export interface OutcomeReasoning {
  state1Analysis: string;
  state2Analysis: string;
  equilibriumNote: string;
}

/**
 * Equilibrium predictions computed from parameters
 */
export interface EquilibriumPrediction {
  /** Attack threshold τ = (V/2 + θ)/(V + θ) */
  tau: number;

  /** Probability of major war */
  attackProbability: number;

  /** Probability of minor conflict (signaling) */
  minorConflictProbability: number;

  /** Probability of peace */
  peaceProbability: number;

  /** Probability of catastrophe (war without DSA) */
  catastropheProbability: number;

  /** State 1 (US) attack cutoff when no signal: k*₁(0) */
  attackCutoff1NoSignal: number;

  /** State 2 (China) attack cutoff when no signal: k*₂(0) */
  attackCutoff2NoSignal: number;

  /** State 1 (US) signaling cutoff K̂₁ */
  signalingCutoff1: number;

  /** State 2 (China) signaling cutoff K̂₂ */
  signalingCutoff2: number;

  /** @deprecated Use attackCutoff1NoSignal or attackCutoff2NoSignal */
  attackCutoffNoSignal: number;

  /** @deprecated Use signalingCutoff1 or signalingCutoff2 */
  signalingCutoff: number;

  /** Probability that State 1 achieves DSA and war occurs */
  dsaVictory1Probability: number;

  /** Probability that State 2 achieves DSA and war occurs */
  dsaVictory2Probability: number;

  /** Expected payoff for State 1 (includes investment cost if applicable) */
  expectedPayoff1: number;

  /** Expected payoff for State 2 (includes investment cost if applicable) */
  expectedPayoff2: number;
}

/**
 * Current date/stage in the game
 */
export type GameDate = 1 | 2 | 3;

/**
 * Phase of the current round (for step-by-step visualization)
 */
export type RoundPhase = 'idle' | 'date0' | 'date1' | 'date2' | 'date3' | 'outcome';

/**
 * Full game state
 */
export interface GameState {
  /** Current round number */
  round: number;

  /** Current date within round (1, 2, or 3) */
  date: GameDate;

  /** Model parameters */
  parameters: ModelParameters;

  /** State of both actors */
  actors: [ActorState, ActorState];

  /** History of past rounds */
  history: RoundOutcome[];

  /** Current equilibrium prediction */
  equilibriumPrediction: EquilibriumPrediction;

  /** Is the simulation running automatically? */
  isPlaying: boolean;

  /** Current phase of step-by-step visualization */
  currentPhase: RoundPhase;

  /** Pending outcome during step-by-step animation */
  pendingOutcome: RoundOutcome | null;
}

/**
 * Result of GTO investment solver
 */
export interface InvestmentResult {
  I1: number;
  I2: number;
  w1: number;
  w2: number;
  sigma1: number;
  sigma2: number;
  eu1: number;
  eu2: number;
  converged: boolean;
  iterations: number;
}

/**
 * Result of comparing equilibria after parameter change
 */
export interface ComparativeStaticResult {
  tauChange: number;
  attackCutoffChange: number;
  attackProbChange: number;
  peaceProbChange: number;
  explanation: string;
}

/**
 * Parameter control metadata for UI (global parameters)
 */
export interface ParameterControlConfig {
  id: keyof ModelParameters;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  comparativeStatic: string;
}

/**
 * Splittable parameter config for state-specific parameters
 */
export interface SplittableParameterConfig {
  label: string;
  description: string;
  linkedLabel: string;        // e.g., "w"
  state1Label: string;        // e.g., "w_US"
  state2Label: string;        // e.g., "w_CN"
  id1: keyof ModelParameters; // e.g., 'w1'
  id2: keyof ModelParameters; // e.g., 'w2'
  linkedId: keyof ModelParameters; // e.g., 'wLinked'
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  comparativeStatic: string;
}

/**
 * Global parameter control configurations (non-splittable)
 */
/**
 * Investment parameter control configuration
 */
export interface InvestmentParameterConfig {
  label: string;
  description: string;
  linkedLabel: string;
  state1Label: string;
  state2Label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  comparativeStatic: string;
}

export const INVESTMENT_PARAMETER: InvestmentParameterConfig = {
  label: 'R&D Investment (I)',
  description: 'Investment in AI R&D capabilities',
  linkedLabel: 'I',
  state1Label: 'I_US',
  state2Label: 'I_CN',
  min: 1,
  max: 100,
  step: 1,
  defaultValue: 10,
  comparativeStatic: 'Higher I → higher w and σ (diminishing returns)',
};

export const PARAMETER_CONTROLS: ParameterControlConfig[] = [
  {
    id: 'T',
    label: 'DSA Threshold (T)',
    description: 'Capability gap needed for decisive strategic advantage',
    min: 0.5,
    max: 5,
    step: 0.1,
    defaultValue: 2,
    comparativeStatic: 'Higher T → fewer attacks, more minor conflicts',
  },
  {
    id: 'V',
    label: 'Prize Value (V)',
    description: 'Value of controlling the future',
    min: 10,
    max: 1000,
    step: 10,
    defaultValue: 50,
    comparativeStatic: 'Higher V → more aggressive behavior',
  },
  {
    id: 'theta',
    label: 'Catastrophe Cost (θ)',
    description: 'Cost if war occurs without DSA',
    min: 10,
    max: 200,
    step: 10,
    defaultValue: 100,
    comparativeStatic: 'Higher θ → stronger deterrence, more signaling',
  },
  {
    id: 'c_m',
    label: 'Minor Conflict Cost (c_m)',
    description: 'Cost of engaging in proxy conflicts',
    min: 0.1,
    max: 20,
    step: 0.5,
    defaultValue: 1,
    comparativeStatic: 'Higher c_m → less signaling, more direct attacks',
  },
];

/**
 * Splittable parameter configurations (state-specific)
 */
export const SPLITTABLE_PARAMETERS: SplittableParameterConfig[] = [
  {
    label: 'Base Capability (w)',
    description: 'Starting capability budget',
    linkedLabel: 'w',
    state1Label: 'w_US',
    state2Label: 'w_CN',
    id1: 'w1',
    id2: 'w2',
    linkedId: 'wLinked',
    min: 1,
    max: 10,
    step: 0.5,
    defaultValue: 5,
    comparativeStatic: 'Higher w → state more likely to achieve DSA',
  },
  {
    label: 'R&D Uncertainty (σ)',
    description: 'Variance in capability outcomes',
    linkedLabel: 'σ',
    state1Label: 'σ_US',
    state2Label: 'σ_CN',
    id1: 'sigma1',
    id2: 'sigma2',
    linkedId: 'sigmaLinked',
    min: 0.1,
    max: 3,
    step: 0.1,
    defaultValue: 1,
    comparativeStatic: 'Higher σ → more variable outcomes',
  },
];

/**
 * Wealth endowment parameter config (always visible, not gated by investment mode)
 */
export const WEALTH_PARAMETER: SplittableParameterConfig = {
  label: 'Wealth Endowment (W)',
  description: 'Starting wealth/GDP of each state',
  linkedLabel: 'W',
  state1Label: 'W_US',
  state2Label: 'W_CN',
  id1: 'W1',
  id2: 'W2',
  linkedId: 'wealthLinked',
  min: 10,
  max: 200,
  step: 5,
  defaultValue: 50,
  comparativeStatic: 'Higher W → more to lose, shifts risk calculus',
};
