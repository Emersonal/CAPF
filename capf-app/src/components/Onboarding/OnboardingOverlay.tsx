/**
 * OnboardingOverlay - Multi-step tutorial shown on first launch
 * Explains the papers, the model, and how to use the app
 */

import { useState } from 'react';

interface OnboardingOverlayProps {
  onClose: () => void;
}

const STEPS = [
  {
    title: 'Decisive Strategic Advantage',
    subtitle: 'What DSA Means',
    content: (
      <>
        <p className="text-gray-300 leading-relaxed">
          A <span className="text-white font-medium">Decisive Strategic Advantage</span> (DSA)
          is a gap in AI capability so large that one state could defeat all rivals at
          negligible cost to itself. This goes beyond conventional military superiority —
          DSA means the contest is effectively already decided before it begins.
        </p>
        <p className="text-gray-400 mt-3 leading-relaxed">
          The concept isn't new — but AI changes the picture.
        </p>
        <div className="mt-5 space-y-3">
          <div className="flex gap-3">
            <span className="text-blue-400 text-lg mt-0.5">1</span>
            <div>
              <p className="text-white text-sm font-medium">Counterforce First Strike</p>
              <p className="text-gray-400 text-sm">
                The closest historical analogue is nuclear counterforce: destroying an
                enemy's arsenal before they can retaliate. That's a DSA — one side wins
                before the contest begins.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 text-lg mt-0.5">2</span>
            <div>
              <p className="text-white text-sm font-medium">Beyond Nuclear</p>
              <p className="text-gray-400 text-sm">
                DSA could emerge in other domains too: cyber warfare, autonomous weapons,
                or any capability gap large enough to make resistance futile.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 text-lg mt-0.5">3</span>
            <div>
              <p className="text-white text-sm font-medium">Automated Research</p>
              <p className="text-gray-400 text-sm">
                What makes this newly plausible is advanced AI that can accelerate its own
                R&D. Automated research could let one state pull ahead fast enough to open
                a decisive gap before rivals can respond.
              </p>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'The Strategic Problem',
    subtitle: 'Signaling Under Uncertainty',
    content: (
      <>
        <p className="text-gray-300 leading-relaxed">
          Because capability is private, states face a <span className="text-white font-medium">signaling
          game</span>. Each knows its own AI strength but not its rival's. This
          uncertainty is what makes the situation unstable — and what makes deterrence
          both necessary and fragile.
        </p>
        <p className="text-gray-400 mt-4 leading-relaxed">
          States can try to reveal strength through proxy conflicts or demonstrations,
          but signaling is costly and may provoke the very escalation it aims to prevent.
          The result is a strategic landscape where small changes in assumptions —
          about observability, risk tolerance, or the value of dominance — produce
          radically different equilibria.
        </p>
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
          <p className="text-blue-200">
            This simulator lets you explore when deterrence holds and when it breaks
            down — by adjusting the assumptions that drive each outcome.
          </p>
        </div>
        <p className="text-gray-500 mt-4 text-sm">
          No prior reading required. The next slides cover the key papers and the formal model.
        </p>
      </>
    ),
  },
  {
    title: 'The MAIM Paper',
    subtitle: 'Hendrycks, Schmidt & Wang (2025)',
    content: (
      <>
        <p className="text-gray-300 leading-relaxed">
          The <span className="text-white font-medium">Superintelligence Strategy</span> paper
          argues that AI is a national security challenge on the scale of nuclear weapons. Its
          central idea: <span className="text-white font-medium">MAIM</span> — Mutually
          Assured AI Malfunction.
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex gap-3">
            <span className="text-red-400 text-lg mt-0.5">1</span>
            <div>
              <p className="text-white text-sm font-medium">Deterrence</p>
              <p className="text-gray-400 text-sm">
                States threaten to sabotage each other's AI projects — via espionage,
                cyberattacks, or strikes on datacenters — preventing any unilateral sprint
                to superintelligence.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-yellow-400 text-lg mt-0.5">2</span>
            <div>
              <p className="text-white text-sm font-medium">Nonproliferation</p>
              <p className="text-gray-400 text-sm">
                Treating AI chips like fissile material — export controls, firmware tracking,
                model weight security — to keep dangerous capabilities away from rogue actors.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-green-400 text-lg mt-0.5">3</span>
            <div>
              <p className="text-white text-sm font-medium">Competitiveness</p>
              <p className="text-gray-400 text-sm">
                States still need AI for economic and military strength — the goal is stable
                competition, not a freeze.
              </p>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'The Critique',
    subtitle: 'RAND & the Stability Problem',
    content: (
      <>
        <p className="text-gray-300 leading-relaxed">
          RAND's analysts pushed back hard. Their core objection:
          <span className="text-white font-medium"> MAD deterred weapons use, not
          development.</span> MAIM tries to deter development, which is fundamentally
          harder.
        </p>
        <div className="mt-4 space-y-3 text-sm">
          <div className="p-3 bg-red-900/20 border border-red-800/30 rounded">
            <p className="text-red-300 font-medium">Capability Uncertainty</p>
            <p className="text-gray-400 mt-1">
              You can't reliably assess how capable your rival's AI is — or how close
              they are to a breakthrough. Without that knowledge, deterrence thresholds
              become guesswork and red lines are unenforceable.
            </p>
          </div>
          <div className="p-3 bg-red-900/20 border border-red-800/30 rounded">
            <p className="text-red-300 font-medium">First-Strike Incentives</p>
            <p className="text-gray-400 mt-1">
              Instead of stability, you get two paranoid states leaning forward, terrified
              of waiting too long to act. A "hair-trigger balance of AI terror."
            </p>
          </div>
          <div className="p-3 bg-red-900/20 border border-red-800/30 rounded">
            <p className="text-red-300 font-medium">Compliance Paradox</p>
            <p className="text-gray-400 mt-1">
              Giving in to a MAIM threat means losing your AI program — the same cost as
              being attacked. So why would you comply?
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'The Model',
    subtitle: "Patell's DSA Signaling Game",
    content: (
      <>
        <p className="text-gray-300 leading-relaxed">
          This simulator implements a formal game-theoretic model that makes the debate
          precise. Two states play a <span className="text-white font-medium">three-stage
          sequential game:</span>
        </p>
        <div className="mt-4 space-y-4">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-700 flex items-center justify-center text-purple-300 text-sm font-bold flex-shrink-0">1</div>
            <div>
              <p className="text-white text-sm font-medium">Nature Draws Capabilities</p>
              <p className="text-gray-400 text-sm">
                Each state privately learns how strong its AI is. Your opponent doesn't
                know your draw, and you don't know theirs.
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-yellow-900/50 border border-yellow-700 flex items-center justify-center text-yellow-300 text-sm font-bold flex-shrink-0">2</div>
            <div>
              <p className="text-white text-sm font-medium">Minor Conflict (Signaling)</p>
              <p className="text-gray-400 text-sm">
                States can engage in proxy wars or cyber demonstrations to reveal a lower
                bound on their capabilities — deterring attack by showing strength.
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-red-900/50 border border-red-700 flex items-center justify-center text-red-300 text-sm font-bold flex-shrink-0">3</div>
            <div>
              <p className="text-white text-sm font-medium">Major War or Peace</p>
              <p className="text-gray-400 text-sm">
                Attack or don't. If one side has a <span className="text-white">Decisive
                Strategic Advantage</span> (DSA), they win everything. If neither does,
                war is catastrophic for both.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 p-3 bg-emerald-900/20 border border-emerald-800/50 rounded-lg">
          <p className="text-emerald-300 text-sm font-medium">Investment Mode</p>
          <p className="text-gray-400 text-sm mt-1">
            Toggle <span className="text-emerald-300">Investment Mode</span> to add a
            "Date 0" pregame where states choose R&D spending (I). Their investment
            determines capability (w) and uncertainty ({'\u03C3'}) endogenously.
          </p>
        </div>

        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-white text-sm font-medium mb-2">Payoff Structure</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-green-300">Peace</span>
              <span className="text-gray-400">W - I + V/2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-300">DSA Winner</span>
              <span className="text-gray-400">W - I + V</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-300">DSA Loser</span>
              <span className="text-gray-400">0 (total wipeout)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-300">Catastrophe</span>
              <span className="text-gray-400">max(0, W - I - {'\u03B8'})</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            W = wealth, I = investment (0 in manual mode), V = prize, {'\u03B8'} = catastrophe cost
          </p>
        </div>
      </>
    ),
  },
  {
    title: 'How to Use This',
    subtitle: 'Parameters, Simulation & Scenarios',
    content: (
      <>
        <div className="space-y-4 text-sm">
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-white font-medium mb-1">Game Structure — 4 Global Parameters</p>
            <p className="text-gray-400">
              These shape the strategic landscape for both states equally.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-blue-300">T (DSA Threshold)</span>
              <span className="text-gray-500">How hard is knockout victory?</span>
              <span className="text-blue-300">V (Prize)</span>
              <span className="text-gray-500">How much does winning matter?</span>
              <span className="text-blue-300">{'\u03B8'} (Catastrophe Cost)</span>
              <span className="text-gray-500">How bad is mutual destruction?</span>
              <span className="text-blue-300">c_m (Conflict Cost)</span>
              <span className="text-gray-500">How expensive is signaling?</span>
            </div>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-white font-medium mb-1">State Endowments — W</p>
            <p className="text-gray-400">
              Each state has a <span className="text-white">wealth endowment (W)</span> representing
              total national resources. Use <span className="text-blue-300">Split by state</span> to
              give each state a different W, modeling asymmetric economies.
            </p>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-white font-medium mb-1">State Capabilities — Two Modes</p>
            <div className="mt-1 space-y-2">
              <p className="text-gray-400">
                <span className="text-white">Manual:</span> Set w (base capability) and
                {' '}{'\u03C3'} (uncertainty) directly. Each is splittable per state.
              </p>
              <p className="text-gray-400">
                <span className="text-emerald-300">Investment:</span> Set I (R&D spending) instead
                — w and {'\u03C3'} are derived automatically. Use the{' '}
                <span className="text-amber-300">Find Nash Equilibrium</span> button to let
                the GTO solver compute optimal investments.
              </p>
            </div>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-white font-medium mb-1">Running the Simulation</p>
            <p className="text-gray-400">
              Click <span className="text-blue-300">Start Round</span> to step through one game,
              or <span className="text-green-300">Auto</span> to watch rounds play out continuously.
              Try the <span className="text-purple-300">Scenario Presets</span> to see how different
              assumptions produce wildly different outcomes.
            </p>
          </div>
        </div>
      </>
    ),
  },
];

export function OnboardingOverlay({ onClose }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-8 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{current.title}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{current.subtitle}</p>
            </div>
            <span className="text-xs text-gray-600">
              {step + 1} / {STEPS.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-4 min-h-[300px] max-h-[60vh] overflow-y-auto">
          {current.content}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-800/50 flex items-center justify-between">
          <button
            onClick={() => setStep(step - 1)}
            disabled={isFirst}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
          {isLast ? (
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              Start Exploring
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
