'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Media } from '@/lib/types';
import { ArrowLeft, Arrow, CarOutline } from '../Icons';

export default function CarGallery({ images, placeholder, title }: { images: Media[]; placeholder: Media | null; title: string }) {
  const [i, setI] = useState(0);
  const n = images.length;
  const cur = images[i];

  return (
    <div className="gallery">
      <div className="g-main">
        {cur ? (
          <Image key={cur.url} className="photo fade" src={cur.url} alt={cur.alt || `${title}, kuva ${i + 1}`} fill priority sizes="(max-width: 1000px) 100vw, 760px" />
        ) : placeholder ? (
          <Image className="ph drive" src={placeholder.url} alt={title} width={placeholder.width} height={placeholder.height} priority sizes="(max-width: 1000px) 90vw, 700px" />
        ) : (
          <CarOutline className="ph drive" />
        )}
        {n ? <span className="g-count">{i + 1} / {n}</span> : <span className="g-count">Kuvat tulossa</span>}
        {n > 1 ? (
          <div className="g-nav">
            <button type="button" aria-label="Edellinen kuva" onClick={() => setI((i - 1 + n) % n)}><ArrowLeft /></button>
            <button type="button" aria-label="Seuraava kuva" onClick={() => setI((i + 1) % n)}><Arrow /></button>
          </div>
        ) : null}
      </div>
      {n > 1 ? (
        <div className="thumbs">
          {images.map((img, j) => (
            <button key={img.url} type="button" className="thumb" aria-label={`Kuva ${j + 1}`} aria-pressed={j === i} onClick={() => setI(j)}>
              <Image src={img.url} alt="" width={200} height={150} sizes="120px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
