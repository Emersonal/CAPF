/**
 * Zustand store for DSA Simulator game state
 * Manages parameters, simulation, and UI state
 */

import { create } from 'zustand';
import type { ModelParameters, GameState, RoundPhase } from '../models/types';
import { DEFAULT_PARAMETERS } from '../models/types';
import {
  createInitialGameState,
  advanceRound,
  resetGame,
  simulateRound,
} from '../simulation/engine';
import { computeEquilibrium } from '../simulation/equilibrium';

/**
 * Store state interface
 */
interface GameStore extends GameState {
  // Actions
  updateParameter: <K extends keyof ModelParameters>(
    param: K,
    value: ModelParameters[K]
  ) => void;
  runRound: () => void;
  reset: () => void;
  loadParameters: (params: ModelParameters) => void;
  togglePlay: () => void;
  setPlaying: (isPlaying: boolean) => void;
  // Step-by-step phase actions
  startRound: () => void;
  advancePhase: () => void;
  completeRound: () => void;
}

/**
 * Create the game store
 */
export const useGameStore = create<GameStore>((set, get) => {
  const initialState = createInitialGameState(DEFAULT_PARAMETERS);

  return {
    // Initial state
    ...initialState,

    // Update a single parameter and recompute equilibrium
    updateParameter: (param, value) => {
      set((state) => {
        const newParams = { ...state.parameters, [param]: value };
        const newEquilibrium = computeEquilibrium(newParams);

        return {
          parameters: newParams,
          equilibriumPrediction: newEquilibrium,
        };
      });
    },

    // Run one simulation round
    runRound: () => {
      set((state) => {
        const newState = advanceRound(state);
        return {
          round: newState.round,
          history: newState.history,
          equilibriumPrediction: newState.equilibriumPrediction,
          actors: newState.actors,
        };
      });
    },

    // Reset to initial state
    reset: () => {
      const state = get();
      const newState = resetGame(state.parameters);
      set({
        round: newState.round,
        date: newState.date,
        actors: newState.actors,
        history: newState.history,
        equilibriumPrediction: newState.equilibriumPrediction,
        isPlaying: false,
      });
    },

    // Load a complete parameter set (for scenarios)
    loadParameters: (params: ModelParameters) => {
      const newEquilibrium = computeEquilibrium(params);
      const newState = resetGame(params);
      set({
        parameters: params,
        round: newState.round,
        date: newState.date,
        actors: newState.actors,
        history: newState.history,
        equilibriumPrediction: newEquilibrium,
        isPlaying: false,
      });
    },

    // Toggle auto-play
    togglePlay: () => {
      set((state) => ({ isPlaying: !state.isPlaying }));
    },

    // Set playing state directly
    setPlaying: (isPlaying) => {
      set({ isPlaying });
    },

    // Start a new round (step-by-step mode)
    startRound: () => {
      const state = get();
      if (state.currentPhase !== 'idle') return; // Already in progress

      // Run the full simulation but store result for step-by-step reveal
      const outcome = simulateRound(state);
      set({
        pendingOutcome: outcome,
        currentPhase: 'date1',
      });
    },

    // Advance to next phase in step-by-step mode
    advancePhase: () => {
      const state = get();
      const phaseOrder: RoundPhase[] = ['idle', 'date1', 'date2', 'date3', 'outcome'];
      const currentIndex = phaseOrder.indexOf(state.currentPhase);

      if (currentIndex === -1 || currentIndex >= phaseOrder.length - 1) {
        // At outcome phase, complete the round
        get().completeRound();
        return;
      }

      const nextPhase = phaseOrder[currentIndex + 1];
      set({ currentPhase: nextPhase });
    },

    // Complete the round and add to history
    completeRound: () => {
      const state = get();
      if (!state.pendingOutcome) return;

      set({
        round: state.round + 1,
        history: [...state.history, state.pendingOutcome],
        equilibriumPrediction: computeEquilibrium(state.parameters),
        currentPhase: 'idle',
        pendingOutcome: null,
      });
    },
  };
});

/**
 * Selector hooks for convenience
 */
export const useParameters = () => useGameStore((state) => state.parameters);
export const useEquilibrium = () => useGameStore((state) => state.equilibriumPrediction);
export const useHistory = () => useGameStore((state) => state.history);
export const useRound = () => useGameStore((state) => state.round);
export const useIsPlaying = () => useGameStore((state) => state.isPlaying);
export const useActors = () => useGameStore((state) => state.actors);
export const useCurrentPhase = () => useGameStore((state) => state.currentPhase);
export const usePendingOutcome = () => useGameStore((state) => state.pendingOutcome);

/**
 * Action hooks
 */
export const useUpdateParameter = () => useGameStore((state) => state.updateParameter);
export const useRunRound = () => useGameStore((state) => state.runRound);
export const useReset = () => useGameStore((state) => state.reset);
export const useTogglePlay = () => useGameStore((state) => state.togglePlay);
export const useStartRound = () => useGameStore((state) => state.startRound);
export const useAdvancePhase = () => useGameStore((state) => state.advancePhase);
export const useCompleteRound = () => useGameStore((state) => state.completeRound);
