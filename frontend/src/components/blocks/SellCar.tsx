import { two } from '@/lib/format';
import SellCarForm from './SellCarForm';

export default function SellCar({ block }: { block: any }) {
  const points: any[] = block.points || [];
  return (
    <section className="sell">
      <div className="wrap sell-in">
        <div className="sell-copy">
          {block.eyebrow ? <div className="eyebrow up">{block.eyebrow}</div> : null}
          <h1 className="d up u2 pre">{block.title}</h1>
          {block.intro ? <p className="up u3">{block.intro}</p> : null}
        </div>
        {/* Sibling of the copy, not inside it, so phones can put the form before the promises. */}
        {points.length ? (
          <ol className="sell-pts up u4">
            {points.map((pt, i) => (
              <li key={pt.id ?? i}>
                <span className="sn">{two(i + 1)}</span>
                <span><strong>{pt.title}</strong>{pt.text ? <span>{pt.text}</span> : null}</span>
              </li>
            ))}
          </ol>
        ) : null}
        <SellCarForm
          title={block.formTitle || 'Pyydä ostotarjous'}
          consent={block.consentText || ''}
          successTitle={block.successTitle || 'Kiitos!'}
          successText={block.successText || ''}
        />
      </div>
    </section>
  );
}
