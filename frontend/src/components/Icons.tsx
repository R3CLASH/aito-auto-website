export function Arrow({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 9h13M10 4l5 5-5 5" />
    </svg>
  );
}

export function ArrowLeft({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M16 9H3M8 4L3 9l5 5" />
    </svg>
  );
}

export function Close({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M3 3l12 12M15 3L3 15" />
    </svg>
  );
}

export function WhatsApp({ size = 22, color = '#0F1B2B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20l1.3-3.9A8 8 0 1 1 8.2 19z" />
      <path d="M9.2 8.6c.2 2.9 3 5.6 6 6l1-1.4-1.9-1-.9.7a4.3 4.3 0 0 1-2.4-2.4l.7-.9-1-1.9z" fill={color} stroke="none" />
    </svg>
  );
}

export function ImageIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 16l-5-5-8 8" />
    </svg>
  );
}

/** Generic sedan silhouette used when a vehicle type has no picture yet. */
export function CarOutline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 150" role="img" aria-label="Auton siluetti" style={{ overflow: 'visible' }}>
      <path d="M18 104 L18 88 Q20 74 46 70 L120 62 Q160 34 205 30 L262 30 Q300 32 334 58 L368 64 Q388 68 388 86 L388 104 L336 104 A26 26 0 0 0 284 104 L122 104 A26 26 0 0 0 70 104 Z" fill="#fff" stroke="#16263D" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M134 62 Q166 42 205 38 L226 38 L230 62 Z M240 62 L237 38 L262 38 Q292 40 318 60 Z" fill="#1A7EB6" stroke="#16263D" strokeWidth="2.5" />
      <circle cx="96" cy="104" r="20" fill="#16263D" /><circle cx="96" cy="104" r="8" fill="#ADB1BA" />
      <circle cx="310" cy="104" r="20" fill="#16263D" /><circle cx="310" cy="104" r="8" fill="#ADB1BA" />
    </svg>
  );
}
