interface FaqItem {
  question: string;
  answer: string;
}

/** Tilgængelig FAQ med native <details>/<summary>. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-brand-ink/10 rounded-xl bg-white shadow-sm ring-1 ring-brand-ink/5">
      {items.map((item) => (
        <details key={item.question} className="group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-brand-ink [&::-webkit-details-marker]:hidden">
            {item.question}
            <span aria-hidden className="text-xl text-brand-primary transition-transform group-open:rotate-45 motion-reduce:transform-none">
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-brand-ink/70">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
