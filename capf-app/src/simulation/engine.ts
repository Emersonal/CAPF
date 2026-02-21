/**
 * Simulation Engine for the Patell DSA Signaling Game
 * Implements the Date 1 → 2 → 3 sequence from Section 4.1
 */

import { sampleNormal } from './math';
import { computeEquilibrium, computeAttackCutoff } from './equilibrium';
import { resolveParams } from './investment';
import type {
  ModelParameters,
  GameState,
  ActorState,
  RoundOutcome,
  RoundOutcomeType,
  OutcomeReasoning,
  EquilibriumPrediction,
} from '../models/types';
import { DEFAULT_PARAMETERS } from '../models/types';

/**
 * Create initial actor state
 */
export function createInitialActor(
  id: 'state1' | 'state2',
  name: string,
  budget: number
): ActorState {
  return {
    id,
    name,
    budget,
    privateCapability: budget,
    minorConflictChoice: 0,
    revealedLowerBound: 0,
    majorAttackChoice: false,
    attackCutoff: 0,
    signalingCutoff: 0,
  };
}

/**
 * Create initial game state
 */
export function createInitialGameState(
  params: ModelParameters = DEFAULT_PARAMETERS
): GameState {
  const equilibrium = computeEquilibrium(params);
  const resolved = resolveParams(params);

  return {
    round: 1,
    date: 1,
    parameters: params,
    actors: [
      createInitialActor('state1', 'United States', resolved.w1),
      createInitialActor('state2', 'China', resolved.w2),
    ],
    history: [],
    equilibriumPrediction: equilibrium,
    isPlaying: false,
    currentPhase: 'idle',
    pendingOutcome: null,
  };
}

/**
 * Simulate Date 1: Nature draws capabilities
 * K_i = w_i + ε_i, where ε_i ~ N(0, σᵢ²)
 *
 * With asymmetric sigma, each state draws from its own distribution.
 * If investmentMode is on, w and σ are derived from investment levels.
 */
export function simulateDate1(
  state: GameState
): [ActorState, ActorState] {
  const resolved = resolveParams(state.parameters);
  const { w1, w2, sigma1, sigma2 } = resolved;

  // State 1 (US) uses w1 and σ1, State 2 (China) uses w2 and σ2
  const actors: [ActorState, ActorState] = [
    {
      ...state.actors[0],
      privateCapability: w1 + sampleNormal(0, sigma1),
    },
    {
      ...state.actors[1],
      privateCapability: w2 + sampleNormal(0, sigma2),
    },
  ];

  return actors;
}

/**
 * Simulate Date 2: Minor conflict decisions
 *
 * Equilibrium strategy:
 * y_i(K_i) =
 *   - 0,    if K_i < K̂_i        (too weak to signal)
 *   - K_i,  if K̂_i ≤ K_i < k*   (intermediate - reveal all)
 *   - 0,    if K_i ≥ k*_i(0)    (strong enough to attack anyway)
 */
export function simulateDate2(
  _state: GameState,
  actors: [ActorState, ActorState],
  equilibrium: EquilibriumPrediction
): [ActorState, ActorState] {
  // Use state-specific cutoffs
  const signalingCutoffs = [equilibrium.signalingCutoff1, equilibrium.signalingCutoff2];
  const attackCutoffs = [equilibrium.attackCutoff1NoSignal, equilibrium.attackCutoff2NoSignal];

  return actors.map((actor, index) => {
    const K = actor.privateCapability;
    const signalingCutoff = signalingCutoffs[index];
    const attackCutoff = attackCutoffs[index];

    // Determine if this actor should signal
    const shouldSignal = K >= signalingCutoff && K < attackCutoff;

    const minorConflictChoice = shouldSignal ? K : 0;
    const revealedLowerBound = minorConflictChoice; // Signal reveals K as lower bound

    return {
      ...actor,
      minorConflictChoice,
      revealedLowerBound,
      signalingCutoff,
    };
  }) as [ActorState, ActorState];
}

/**
 * Simulate Date 3: Major conflict decisions
 *
 * Equilibrium strategy:
 * Z_i = 1 iff K_i ≥ k*_i(y_j)
 *
 * With asymmetric sigma, each state's cutoff uses opponent's w and σ.
 */
export function simulateDate3(
  state: GameState,
  actors: [ActorState, ActorState],
  equilibrium: EquilibriumPrediction
): [ActorState, ActorState] {
  const resolved = resolveParams(state.parameters);
  const { w1, w2, sigma1, sigma2 } = resolved;
  const tau = equilibrium.tau;

  // Compute attack cutoffs based on opponent's revealed signal
  // k*(y_j) = w + T + σ·Φ⁻¹(B_j + (1-B_j)τ) — paper's one-sided lower truncation
  const kStar1 = computeAttackCutoff(resolved, actors[1].revealedLowerBound, tau, w2, sigma2);
  const kStar2 = computeAttackCutoff(resolved, actors[0].revealedLowerBound, tau, w1, sigma1);

  return [
    {
      ...actors[0],
      attackCutoff: kStar1,
      majorAttackChoice: actors[0].privateCapability >= kStar1,
    },
    {
      ...actors[1],
      attackCutoff: kStar2,
      majorAttackChoice: actors[1].privateCapability >= kStar2,
    },
  ];
}

/**
 * Determine the outcome of a round
 */
export function determineOutcome(
  actors: [ActorState, ActorState],
  parameters: ModelParameters
): { outcome: RoundOutcomeType; payoffs: [number, number] } {
  const { V, theta, T, c_m } = parameters;
  const [actor1, actor2] = actors;

  const K1 = actor1.privateCapability;
  const K2 = actor2.privateCapability;
  const Z1 = actor1.majorAttackChoice;
  const Z2 = actor2.majorAttackChoice;

  const W1 = parameters.W1;
  const W2 = parameters.W2;
  const I1_cost = parameters.investmentMode ? parameters.I1 : 0;
  const I2_cost = parameters.investmentMode ? parameters.I2 : 0;

  let outcome: RoundOutcomeType;
  let payoffs: [number, number];

  if (!Z1 && !Z2) {
    // Peace: both choose not to attack
    outcome = 'peace';
    payoffs = [W1 - I1_cost + V / 2, W2 - I2_cost + V / 2];
  } else {
    // War: at least one attacks
    const state1HasDSA = K1 >= K2 + T;
    const state2HasDSA = K2 >= K1 + T;

    if (state1HasDSA) {
      outcome = 'dsa_victory_1';
      payoffs = [W1 - I1_cost + V, 0]; // Loser gets 0, no deductions
    } else if (state2HasDSA) {
      outcome = 'dsa_victory_2';
      payoffs = [0, W2 - I2_cost + V]; // Loser gets 0, no deductions
    } else {
      // Neither has DSA - catastrophe!
      outcome = 'catastrophe';
      payoffs = [
        Math.max(0, W1 - I1_cost - theta),
        Math.max(0, W2 - I2_cost - theta),
      ];
    }
  }

  // Subtract minor conflict costs (paid at Date 2, before outcome)
  // but NOT from DSA losers (they've already lost everything)
  const y1 = actor1.minorConflictChoice;
  const y2 = actor2.minorConflictChoice;
  if (y1 > 0 || y2 > 0) {
    const minorCost = c_m + (y1 * y2) / (y1 + y2 || 1);
    if (outcome !== 'dsa_victory_2') payoffs[0] -= minorCost; // State 1 isn't wiped out
    if (outcome !== 'dsa_victory_1') payoffs[1] -= minorCost; // State 2 isn't wiped out
  }

  // Floor at 0 — can't have negative wealth
  payoffs[0] = Math.max(0, payoffs[0]);
  payoffs[1] = Math.max(0, payoffs[1]);

  return { outcome, payoffs };
}

/**
 * Generate natural language reasoning for the outcome
 */
export function generateReasoning(
  actors: [ActorState, ActorState],
  equilibrium: EquilibriumPrediction,
  outcome: RoundOutcomeType
): OutcomeReasoning {
  const [actor1, actor2] = actors;
  const K1 = actor1.privateCapability.toFixed(2);
  const K2 = actor2.privateCapability.toFixed(2);
  const kStar1 = actor1.attackCutoff.toFixed(2);
  const kStar2 = actor2.attackCutoff.toFixed(2);
  const signalingCutoff = equilibrium.signalingCutoff.toFixed(2);

  const kStarNoSignal = equilibrium.attackCutoffNoSignal.toFixed(2);

  // State 1 analysis: distinguish between weak (K < K̂), intermediate (signaled), and strong (K ≥ k*(0))
  const state1Analysis = actor1.majorAttackChoice
    ? `${actor1.name} attacked: K=${K1} ≥ k*=${kStar1}`
    : actor1.minorConflictChoice > 0
      ? `${actor1.name} signaled (K=${K1}), but K < k*=${kStar1}`
      : actor1.privateCapability >= equilibrium.attackCutoffNoSignal
        ? `${actor1.name} didn't signal: K=${K1} ≥ k*(0)=${kStarNoSignal}, attacking anyway`
        : `${actor1.name} stayed quiet: K=${K1} < K̂=${signalingCutoff}`;

  // State 2 analysis: same three-way distinction
  const state2Analysis = actor2.majorAttackChoice
    ? `${actor2.name} attacked: K=${K2} ≥ k*=${kStar2}`
    : actor2.minorConflictChoice > 0
      ? `${actor2.name} signaled (K=${K2}), but K < k*=${kStar2}`
      : actor2.privateCapability >= equilibrium.attackCutoffNoSignal
        ? `${actor2.name} didn't signal: K=${K2} ≥ k*(0)=${kStarNoSignal}, attacking anyway`
        : `${actor2.name} stayed quiet: K=${K2} < K̂=${signalingCutoff}`;

  const outcomeNotes: Record<RoundOutcomeType, string> = {
    peace: 'Neither state had sufficient capability to justify the risk of war.',
    dsa_victory_1: `${actor1.name} achieved Decisive Strategic Advantage and won control.`,
    dsa_victory_2: `${actor2.name} achieved Decisive Strategic Advantage and won control.`,
    catastrophe: 'Both states went to war without DSA - mutual destruction ensued.',
  };

  return {
    state1Analysis,
    state2Analysis,
    equilibriumNote: outcomeNotes[outcome],
  };
}

/**
 * Simulate a complete round (Date 1 → 2 → 3)
 */
export function simulateRound(state: GameState): RoundOutcome {
  const { parameters, round } = state;
  const equilibrium = computeEquilibrium(parameters);

  // Date 1: Draw capabilities
  let actors = simulateDate1(state);

  // Date 2: Minor conflict decisions
  actors = simulateDate2(state, actors, equilibrium);

  // Date 3: Major conflict decisions
  actors = simulateDate3(state, actors, equilibrium);

  // Determine outcome
  const { outcome, payoffs } = determineOutcome(actors, parameters);

  // Generate explanation
  const reasoning = generateReasoning(actors, equilibrium, outcome);

  return {
    round,
    capabilityDraws: [actors[0].privateCapability, actors[1].privateCapability],
    minorConflictOccurred: actors[0].minorConflictChoice > 0 || actors[1].minorConflictChoice > 0,
    signalsSent: [actors[0].minorConflictChoice, actors[1].minorConflictChoice],
    majorWarOccurred: actors[0].majorAttackChoice || actors[1].majorAttackChoice,
    outcome,
    payoffs,
    reasoning,
  };
}

/**
 * Advance the game by one round
 */
export function advanceRound(state: GameState): GameState {
  const roundOutcome = simulateRound(state);

  return {
    ...state,
    round: state.round + 1,
    history: [...state.history, roundOutcome],
    equilibriumPrediction: computeEquilibrium(state.parameters),
  };
}

/**
 * Update parameters and recompute equilibrium
 */
export function updateParameters(
  state: GameState,
  newParams: Partial<ModelParameters>
): GameState {
  const parameters = { ...state.parameters, ...newParams };
  const equilibriumPrediction = computeEquilibrium(parameters);

  return {
    ...state,
    parameters,
    equilibriumPrediction,
  };
}

/**
 * Reset the game to initial state
 */
export function resetGame(params?: ModelParameters): GameState {
  return createInitialGameState(params);
}
