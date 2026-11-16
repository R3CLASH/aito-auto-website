import { Arrow } from '../Icons';
import SmartLink from '../SmartLink';

/**
 * The hero's right-hand column. It used to be a showroom turntable that cycled
 * the vehicle types; it now carries the two decisions a visitor actually
 * arrives with -- buying or selling -- as full-size panels.
 */
export default function HeroShowroom({ block, carCount }: { block: any; carCount: number }) {
  const buy = block.buyCta?.url ? block.buyCta : { label: 'Osta auto', url: '/autot' };
  const sell = block.sellCta?.url ? block.sellCta : { label: 'Myy auto', url: '/myy-auto' };

  return (
    <section className="hero">
      <div className="wrap hero-in">
        <div className="hero-copy">
          {block.eyebrow ? <div className="hero-kicker up">{block.eyebrow}</div> : null}
          <h1 className="d up u2">
            {block.titleLine1}
            {block.titleLine2 ? <><br /><span className="outline">{block.titleLine2}</span></> : null}
          </h1>
          {block.description ? <p className="up u3">{block.description}</p> : null}
          <div className="hero-ctas up u4">
            {block.primaryCta ? <SmartLink className="btn btn-white cut" href={block.primaryCta.url}>{block.primaryCta.label} <Arrow /></SmartLink> : null}
            {block.secondaryCta ? <SmartLink className="btn btn-ghost" href={block.secondaryCta.url}>{block.secondaryCta.label}</SmartLink> : null}
          </div>
        </div>

        {/* A fork in the road, drawn the way Finnish direction signs are: blue
            plates with an arrow end, a white supplementary plate underneath,
            both bolted to one post. Buying points on, selling points back. */}
        <nav className="hero-nav" aria-label="Osta tai myy">
          <span className="sign-post" aria-hidden="true" />
          <SmartLink className="sign sign-buy" href={buy.url}>
            <span className="sign-plate">
              <span className="sign-t d">{buy.label}</span>
              <span className="sign-n d">{carCount}<small> {carCount === 1 ? 'auto' : 'autoa'}</small></span>
            </span>
            <span className="sign-sub">Valmiina pihassa</span>
          </SmartLink>
          <SmartLink className="sign sign-sell" href={sell.url}>
            <span className="sign-plate">
              <span className="sign-t d">{sell.label}</span>
            </span>
            <span className="sign-sub">Kerro autostasi, saat tarjouksen</span>
          </SmartLink>
        </nav>
      </div>
    </section>
  );
}
