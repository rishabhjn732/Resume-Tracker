import type { AgentStep, Tone } from "@/lib/types";

const toneStyle: Record<Tone, { badge: string; circle: string }> = {
  ok: { badge: "bg-accent-soft text-accent-strong", circle: "bg-accent-soft text-accent-strong" },
  warn: { badge: "bg-warn-soft text-warn", circle: "bg-warn-soft text-warn" },
  muted: { badge: "bg-off-soft text-off", circle: "bg-off-soft text-off" },
};

export function AgentSteps({ steps, memory }: { steps: AgentStep[]; memory: string[] }) {
  return (
    <aside
      aria-label="How the agent answered"
      className="flex min-w-0 flex-[1_1_320px] flex-col gap-6 border-l border-line bg-white p-5 min-[1144px]:sticky min-[1144px]:top-0 min-[1144px]:h-screen min-[1144px]:self-start min-[1144px]:overflow-y-auto"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">How the agent answered</h2>
        <p className="text-sm text-muted">Fake steps for the last question</p>
      </div>

      {steps.length === 0 ? (
        <p className="text-sm text-muted">Ask a question to see each agent step.</p>
      ) : (
        <ol className="flex flex-col">
          {steps.map((step, index) => (
            <li key={`${step.name}-${index}`} className="flex gap-3">
              <div className="flex w-6 shrink-0 flex-col items-center">
                <div
                  className={`flex size-6 items-center justify-center rounded-full font-mono text-xs font-medium ${toneStyle[step.tone].circle}`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 ? <div className="min-h-3.5 w-px flex-1 bg-line" /> : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-sm font-semibold break-words">{step.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneStyle[step.tone].badge}`}>
                    {step.tag}
                  </span>
                </div>
                <p className="text-sm leading-snug text-muted">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <section className="flex flex-col gap-2 rounded-lg bg-ground p-3.5">
        <h3 className="text-sm font-semibold">Long-term memory</h3>
        {memory.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {memory.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing saved yet. Try: We are hiring for a search role.</p>
        )}
      </section>
    </aside>
  );
}
