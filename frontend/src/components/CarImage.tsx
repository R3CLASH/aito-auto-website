import Image from 'next/image';
import type { Media } from '@/lib/types';
import { CarOutline } from './Icons';

/** Shows the first car photo, or the vehicle-type silhouette while no photos are uploaded. */
export default function CarImage({ image, placeholder, alt, sizes, priority }: {
  image: Media | null;
  placeholder: Media | null;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  if (image) {
    return <Image className="photo" src={image.url} alt={image.alt || alt} fill sizes={sizes} priority={priority} />;
  }
  if (placeholder) {
    return (
      <Image className="ph" src={placeholder.url} alt={alt} width={placeholder.width} height={placeholder.height} sizes={sizes} priority={priority} />
    );
  }
  return <CarOutline className="ph" />;
}
