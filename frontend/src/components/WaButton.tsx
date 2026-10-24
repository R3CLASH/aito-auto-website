'use client';

import { useWhatsApp, type WaOptions } from './WhatsAppProvider';

export default function WaButton({ className = 'btn btn-wa', options, children }: {
  className?: string;
  options?: WaOptions;
  children: React.ReactNode;
}) {
  const wa = useWhatsApp();
  return (
    <button type="button" className={className} onClick={() => wa.open(options)}>
      {children}
    </button>
  );
}
