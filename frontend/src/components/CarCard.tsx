import Link from 'next/link';
import type { CarSummary } from '@/lib/types';
import { euro, km } from '@/lib/format';
import Plate from './Plate';
import CarImage from './CarImage';

export default function CarCard({ car, className = '', priority }: { car: CarSummary; className?: string; priority?: boolean }) {
  return (
    <Link className={`car-card lift ${className}`} href={car.href}>
      <div className="pic">
        <CarImage image={car.image} placeholder={car.placeholder} alt={car.title} priority={priority}
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 320px" />
        {car.badge ? <span className={`tag ${car.reserved ? 'res' : ''}`}>{car.badge}</span> : null}
        {car.photoCount > 1 ? <span className="count">{car.photoCount} kuvaa</span> : null}
      </div>
      <div className="body">
        <div>
          <div className="brand">{car.brand.name}</div>
          <div className="d model">{car.model.name}</div>
          {car.variant ? <div className="variant">{car.variant}</div> : null}
        </div>
        <div className="chips">
          <span>{car.year}</span>
          <span>{km(car.mileage)}</span>
          <span>{car.fuel}</span>
          <span>{car.transmission}</span>
        </div>
        <div className="foot">
          <Plate band="EUR" text={euro(car.price)} />
          <div className="mo">
            <div className="m">alk.</div>
            <strong>{car.monthly} €/kk</strong>
          </div>
        </div>
      </div>
    </Link>
  );
}
