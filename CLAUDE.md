# CAPF: Competitive AI Policy Framework Visualization

## Project Vision
An interactive visualization/game modeling geopolitical conflict dynamics around transformative AI, based on CAIS' MAIM model and related game-theoretic literature. The core insight: small changes to assumptions produce wildly different equilibria.

## Interface Design

### Main View: Stylized World Map
- Nations/regions as diagrammatic aggregates (not photorealistic)
- Visual elements: datacenter buildup, resource allocation bars, strike indicators, alliance lines

### Interaction Model
- Turn-based stepping through scenarios
- Observer mode: user watches AI state actors play out rational strategies
- User selects assumptions, not plays as a nation

### Collapsible Game Theory Panel
- Shows payoff matrix or game tree
- Highlights predicted equilibrium
- Explains why actors take actions

### Assumption Control Sidebar
- Toggles/sliders for key parameters from literature
- Changing assumptions triggers map animation showing new equilibrium

---

## Literature Foundation

### Core Papers
1. **MAIM.pdf** - CAIS' "Mutually Assured AI Malfunction" framework
2. **On_Decisive_Strategic_Advantage.pdf** - DSA game-theoretic signaling model
3. **RAND Commentary** - Critical analysis of MAIM feasibility

### Key Concepts
- **DSA (Decisive Strategic Advantage)**: Ability to defeat rest of world via AI
- **Escalation Ladder**: Espionage → Covert sabotage → Overt cyberattacks → Kinetic strikes
- **Intelligence Recursion**: AI systems autonomously accelerating AI R&D
- **MAIM Pillars**: Deterrence, Nonproliferation, Competitiveness

### Key Debates (from literature)
| Debate | Pro-MAIM | Skeptical |
|--------|----------|-----------|
| Observability | Imperfect monitoring suffices | Four fundamental challenges |
| Red Lines | Intimidate, don't adjudicate | 7 deterrence conditions often unmet |
| Infrastructure | Frontier compute is concentrated | Development is distributed |
| Stability | Escalation ladders prevent jumps | First-strike incentives |

---

## Parameters to Model

### Strategic Environment
- DSA Threshold (Low/Medium/High)
- Prize Value (0-100)
- Catastrophe Cost (0-100)
- Uncertainty/Observability (Low/Medium/High)
- Intelligence Recursion Speed (Slow/Fast/Instant)

### Deterrence
- Red Line Clarity (Fuzzy/Clear)
- Threat Credibility (0-100%)
- Sabotage Capability (Low/Medium/High)
- Attribution Confidence (Low/Medium/High)

### Infrastructure
- Compute Concentration (Centralized/Distributed)
- Security Investment (0-100%)
- Safety Investment (0-100%)

### Actor Behavior
- Risk Tolerance (Averse/Neutral/Seeking)
- Time Horizon (Short/Medium/Long)
- Cooperation Propensity (Low/Medium/High)

### Binary Toggles
- MAD-style deterrence works (ON/OFF)
- Verification is possible (ON/OFF)
- Loss of control is real risk (ON/OFF)
- First-mover advantage exists (ON/OFF)
- Middle powers can intervene (ON/OFF)

---

## Tech Stack
- React + TypeScript + Vite
- D3.js (map and game theory visualizations)
- Zustand (state management)
- Tailwind CSS

## Architecture
```
src/
├── components/
│   ├── Map/           # WorldMap, Region, DatacenterIcon, StrikeIndicator, AllianceLine
│   ├── GameTheory/    # PayoffMatrix, GameTree, EquilibriumExplainer
│   ├── Controls/      # ParameterSlider, ToggleSwitch, AssumptionPanel
│   └── Timeline/      # TurnControls, EventLog
├── models/            # gameState, actors, assumptions, equilibrium types
├── simulation/        # engine, strategies, outcomes
├── data/              # regions.json, scenarios.json
└── store/             # gameStore.ts
```

## Implementation Phases
1. **Core Framework**: Project setup, Zustand store, basic map, assumption sidebar
2. **Simulation Engine**: Actor decision logic, equilibrium calculation, turn system
3. **Visualizations**: Animated resource changes, payoff matrix, escalation ladder
4. **Game Theory Panel**: Strategic situation display, equilibrium highlighting, reasoning explanations
5. **Polish**: Pre-built scenarios, tutorial mode, export/share

## Equilibrium Types to Model
- Stable deterrence (MAIM success)
- Arms race (mutual buildup)
- Preemptive strike (first-mover wins)
- Negotiated cooperation (RAND path)
- Coalition intervention (middle powers)
