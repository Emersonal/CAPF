/**
 * Type definitions for the Patell DSA Signaling Game
 * Based on "On Decisive Strategic Advantage" Section 4.1
 */

/**
 * Core model parameters (Section 4.1)
 * Extended to support asymmetric capabilities (w1 != w2)
 */
export interface ModelParameters {
  /** US base capability endowment (w_1) */
  w1: number;

  /** China base capability endowment (w_2) */
  w2: number;

  /** Uncertainty - std dev of capability draws (σ) */
  sigma: number;

  /** DSA threshold - capability gap needed for decisive advantage (T) */
  T: number;

  /** Minor conflict baseline cost (c_m) */
  c_m: number;

  /** Prize value - value of controlling the future (V) */
  V: number;

  /** Catastrophe cost - cost if war without DSA (θ) */
  theta: number;
}

/**
 * Default parameter values
 */
export const DEFAULT_PARAMETERS: ModelParameters = {
  w1: 5,       // US baseline capability budget
  w2: 5,       // China baseline capability budget
  sigma: 1,    // Moderate uncertainty
  T: 2,        // Moderate DSA threshold
  c_m: 1,      // Moderate minor conflict cost
  V: 50,       // Prize value
  theta: 100,  // High catastrophe cost
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
}

/**
 * Current date/stage in the game
 */
export type GameDate = 1 | 2 | 3;

/**
 * Phase of the current round (for step-by-step visualization)
 */
export type RoundPhase = 'idle' | 'date1' | 'date2' | 'date3' | 'outcome';

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
 * Parameter control metadata for UI
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
 * Parameter control configurations
 */
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
    max: 100,
    step: 5,
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
    id: 'sigma',
    label: 'Uncertainty (σ)',
    description: 'Variance in capability outcomes',
    min: 0.1,
    max: 3,
    step: 0.1,
    defaultValue: 1,
    comparativeStatic: 'Higher σ → less predictable outcomes',
  },
  {
    id: 'c_m',
    label: 'Minor Conflict Cost (c_m)',
    description: 'Cost of engaging in proxy conflicts',
    min: 0.1,
    max: 5,
    step: 0.1,
    defaultValue: 1,
    comparativeStatic: 'Higher c_m → less signaling, more direct attacks',
  },
  {
    id: 'w1',
    label: 'US Base Capability (w_US)',
    description: 'Starting capability budget for United States',
    min: 1,
    max: 10,
    step: 0.5,
    defaultValue: 5,
    comparativeStatic: 'Higher w_US → US more likely to achieve DSA',
  },
  {
    id: 'w2',
    label: 'China Base Capability (w_CN)',
    description: 'Starting capability budget for China',
    min: 1,
    max: 10,
    step: 0.5,
    defaultValue: 5,
    comparativeStatic: 'Higher w_CN → China more likely to achieve DSA',
  },
];
