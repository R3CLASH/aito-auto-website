'use client';

import { useState } from 'react';

export default function Faq({ block }: { block: any }) {
  const items: any[] = block.items || [];
  const [open, setOpen] = useState(0);
  return (
    <section className="faq-sec">
      <div className="wrap">
        <div className="head">
          {block.eyebrow ? <div className="eyebrow">{block.eyebrow}</div> : null}
          <h2 className="d h-sec wipe">{block.title}</h2>
        </div>
        <div className="faq-list">
          {items.map((q, i) => (
            <div key={q.id ?? i}>
              <button className="faq-q" type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{q.question}</span>
                <span className="d" aria-hidden="true">{open === i ? '–' : '+'}</span>
              </button>
              {open === i ? <p id={`faq-${i}`} className="faq-a up">{q.answer}</p> : null}
            </div>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: items.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: q.answer } })),
          }).replace(/</g, '\\u003c'),
        }}
      />
    </section>
  );
}
