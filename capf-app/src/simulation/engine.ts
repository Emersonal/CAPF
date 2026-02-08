/**
 * Simulation Engine for the Patell DSA Signaling Game
 * Implements the Date 1 → 2 → 3 sequence from Section 4.1
 */

import { sampleNormal } from './math';
import { computeEquilibrium, computeAttackCutoff } from './equilibrium';
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

  return {
    round: 1,
    date: 1,
    parameters: params,
    actors: [
      createInitialActor('state1', 'United States', params.w),
      createInitialActor('state2', 'China', params.w),
    ],
    history: [],
    equilibriumPrediction: equilibrium,
    isPlaying: false,
  };
}

/**
 * Simulate Date 1: Nature draws capabilities
 * K_i = w_i + ε_i, where ε_i ~ N(0, σ²)
 */
export function simulateDate1(
  state: GameState
): [ActorState, ActorState] {
  const { parameters } = state;
  const { w, sigma } = parameters;

  const actors = state.actors.map((actor) => ({
    ...actor,
    privateCapability: w + sampleNormal(0, sigma),
  })) as [ActorState, ActorState];

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
  const { signalingCutoff, attackCutoffNoSignal } = equilibrium;

  return actors.map((actor) => {
    const K = actor.privateCapability;

    // Determine if this actor should signal
    const shouldSignal = K >= signalingCutoff && K < attackCutoffNoSignal;

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
 */
export function simulateDate3(
  state: GameState,
  actors: [ActorState, ActorState],
  equilibrium: EquilibriumPrediction
): [ActorState, ActorState] {
  const { parameters } = state;
  const tau = equilibrium.tau;

  // Compute attack cutoffs based on opponent's revealed signal
  const kStar1 = computeAttackCutoff(parameters, actors[1].revealedLowerBound, tau);
  const kStar2 = computeAttackCutoff(parameters, actors[0].revealedLowerBound, tau);

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

  let outcome: RoundOutcomeType;
  let payoffs: [number, number];

  if (!Z1 && !Z2) {
    // Peace: both choose not to attack
    outcome = 'peace';
    payoffs = [V / 2, V / 2];
  } else {
    // War: at least one attacks
    const state1HasDSA = K1 >= K2 + T;
    const state2HasDSA = K2 >= K1 + T;

    if (state1HasDSA) {
      outcome = 'dsa_victory_1';
      payoffs = [V, 0];
    } else if (state2HasDSA) {
      outcome = 'dsa_victory_2';
      payoffs = [0, V];
    } else {
      // Neither has DSA - catastrophe!
      outcome = 'catastrophe';
      payoffs = [-theta, -theta];
    }
  }

  // Subtract minor conflict costs if any occurred
  const y1 = actor1.minorConflictChoice;
  const y2 = actor2.minorConflictChoice;
  if (y1 > 0 || y2 > 0) {
    const minorCost = c_m + (y1 * y2) / (y1 + y2 || 1);
    payoffs[0] -= minorCost;
    payoffs[1] -= minorCost;
  }

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

  const state1Analysis = actor1.majorAttackChoice
    ? `${actor1.name} attacked: K=${K1} ≥ k*=${kStar1}`
    : actor1.minorConflictChoice > 0
      ? `${actor1.name} signaled (K=${K1}), but K < k*=${kStar1}`
      : `${actor1.name} stayed quiet: K=${K1} < K̂=${signalingCutoff}`;

  const state2Analysis = actor2.majorAttackChoice
    ? `${actor2.name} attacked: K=${K2} ≥ k*=${kStar2}`
    : actor2.minorConflictChoice > 0
      ? `${actor2.name} signaled (K=${K2}), but K < k*=${kStar2}`
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
