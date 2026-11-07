import { useState } from "react";
import type { Card, JdRow } from "@/lib/types";

// LEARN: This file has no "use client", but ChatWindow imports it.
// So it runs in the browser as part of ChatWindow.

type Actions = {
  onAsk: (question: string) => void;
  onBook: (slot: string) => void;
  onCompare: (jobDescription: string) => void;
  disabled: boolean;
  isBooked: boolean;
};

const shell = "flex flex-col gap-4 rounded-xl border border-line bg-white p-5";

function Timeline({ items }: { items: { years: string; company: string; role: string }[] }) {
  const bars = ["bg-[#b9c8ec]", "bg-[#7e9be3]", "bg-accent"];
  return (
    <section className={shell}>
      <h2 className="text-sm font-semibold">Career timeline</h2>
      <ol className="flex flex-wrap gap-3">
        {items.map((item, index) => (
          <li key={item.company} className="flex min-w-0 flex-[1_1_180px] flex-col gap-2">
            <div className={`h-1.5 rounded-full ${bars[Math.min(index, bars.length - 1)]}`} />
            <div className="font-mono text-xs text-muted">{item.years}</div>
            <div className="font-semibold">{item.company}</div>
            <div className="text-sm text-muted">{item.role}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Slots({
  slots,
  onBook,
  disabled,
  isBooked,
}: {
  slots: { id: string; day: string; time: string }[];
  onBook: (slot: string) => void;
  disabled: boolean;
  isBooked: boolean;
}) {
  const [selectedId, setSelectedId] = useState(slots[0].id);
  const selected = slots.find((slot) => slot.id === selectedId) ?? slots[0];
  const label = `${selected.day}, ${selected.time}`;

  return (
    <section className={shell}>
      <h2 className="text-sm font-semibold">Available slots (India time)</h2>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => {
          const isSelected = slot.id === selectedId;
          return (
            <button
              key={slot.id}
              type="button"
              aria-pressed={isSelected}
              disabled={isBooked}
              onClick={() => setSelectedId(slot.id)}
              className={`min-h-16 flex-[1_1_170px] rounded-lg border p-3 text-left text-sm ${
                isSelected ? "border-accent bg-accent-soft" : "border-line-strong bg-white"
              }`}
            >
              <span className="block font-semibold">{slot.day}</span>
              <span className="mt-1 block">{slot.time}</span>
            </button>
          );
        })}
      </div>
      {!isBooked ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onBook(label)}
          className="min-h-11 self-start rounded-lg bg-accent px-4 font-medium text-white hover:bg-accent-strong disabled:opacity-60"
        >
          Confirm {label}
        </button>
      ) : null}
    </section>
  );
}

const sampleJobDescription = `Senior Backend Engineer

We need someone with:
- Java backend experience
- Search platforms
- RAG and GenAI
- Team leadership
- Kubernetes`;

function JdInput({ onCompare, disabled }: { onCompare: (text: string) => void; disabled: boolean }) {
  const [text, setText] = useState(sampleJobDescription);
  const isEmpty = !text.trim();

  return (
    <section className={shell}>
      <div className="flex flex-col gap-2">
        <label htmlFor="jd-text" className="text-sm font-medium">
          Job description
        </label>
        <textarea
          id="jd-text"
          rows={8}
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="w-full resize-y rounded-lg border border-line-strong p-3 text-sm leading-relaxed"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted">This comparison uses 1 question.</span>
        <button
          type="button"
          disabled={disabled || isEmpty}
          onClick={() => onCompare(text)}
          className="min-h-11 rounded-lg bg-accent px-4 font-medium text-white hover:bg-accent-strong disabled:opacity-60"
        >
          Compare
        </button>
      </div>
    </section>
  );
}

const resultStyle: Record<JdRow["result"], string> = {
  Match: "bg-accent-soft text-accent-strong",
  Partial: "bg-warn-soft text-warn",
  "Not found": "bg-off-soft text-off",
};

function JdResult({ rows }: { rows: JdRow[] }) {
  const results: JdRow["result"][] = ["Match", "Partial", "Not found"];
  return (
    <section className={shell}>
      <h2 className="text-sm font-semibold">Requirement check</h2>
      <div className="grid grid-cols-3 gap-2">
        {results.map((result) => (
          <div key={result} className={`rounded-lg p-3 ${resultStyle[result]}`}>
            <div className="text-2xl font-semibold">{rows.filter((row) => row.result === result).length}</div>
            <div className="text-sm">{result}</div>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-3 font-medium">Requirement</th>
              <th scope="col" className="p-2 font-medium">Result</th>
              <th scope="col" className="py-2 pl-3 font-medium">Proof from resume</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.requirement}-${index}`} className="border-b border-off-soft last:border-0">
                <td className="py-3 pr-3 font-medium">{row.requirement}</td>
                <td className="p-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${resultStyle[row.result]}`}>
                    {row.result}
                  </span>
                </td>
                <td className="py-3 pl-3">{row.proof}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Suggestions({
  suggestions,
  onAsk,
  disabled,
}: {
  suggestions: string[];
  onAsk: (question: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onAsk(suggestion)}
          className="min-h-11 rounded-full border border-line-strong bg-white px-4 text-sm hover:bg-ground disabled:opacity-60"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

// LEARN: The agent returns card.type, and React chooses the matching component.
// The LLM never writes HTML, so the UI stays safe and consistent.
export function AnswerCard({ card, actions }: { card: Card; actions: Actions }) {
  switch (card.type) {
    case "timeline":
      return <Timeline items={card.items} />;
    case "slots":
      return (
        <Slots slots={card.slots} onBook={actions.onBook} disabled={actions.disabled} isBooked={actions.isBooked} />
      );
    case "booked":
      return (
        <div role="status" className="rounded-lg bg-accent-soft p-3 text-sm font-medium text-accent-strong">
          Booked: {card.slot}
        </div>
      );
    case "jdInput":
      return <JdInput onCompare={actions.onCompare} disabled={actions.disabled} />;
    case "jdResult":
      return <JdResult rows={card.rows} />;
    case "blocked":
      return (
        <div className="flex flex-col gap-3 rounded-xl border border-warn-line bg-warn-soft p-4">
          <p className="text-sm">Try one of these questions:</p>
          <Suggestions suggestions={card.suggestions} onAsk={actions.onAsk} disabled={actions.disabled} />
        </div>
      );
    case "suggestions":
      return <Suggestions suggestions={card.suggestions} onAsk={actions.onAsk} disabled={actions.disabled} />;
  }
}
