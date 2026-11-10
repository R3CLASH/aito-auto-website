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

/* Social brand marks. Filled glyphs on `currentColor` so they inherit the
   surrounding text colour in both the dark footer and the light contact page. */

function Brand({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {children}
    </svg>
  );
}

export function Facebook({ size = 20 }: { size?: number }) {
  return (
    <Brand size={size}>
      <path d="M13.5 21.9v-8.2h2.75l.41-3.19H13.5V8.47c0-.92.26-1.55 1.58-1.55h1.69V4.07c-.29-.04-1.3-.12-2.47-.12-2.44 0-4.11 1.49-4.11 4.23v2.36H7.43v3.19h2.76v8.2z" />
    </Brand>
  );
}

export function Instagram({ size = 20 }: { size?: number }) {
  return (
    <Brand size={size}>
      <path fillRule="evenodd" d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4A5.8 5.8 0 0 1 16.2 22H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4z" />
      <path fillRule="evenodd" d="M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6zm0 2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6z" />
      <circle cx="17.1" cy="6.9" r="1.2" />
    </Brand>
  );
}

export function YouTube({ size = 20 }: { size?: number }) {
  return (
    <Brand size={size}>
      <path fillRule="evenodd" d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77C22 15.2 22 12 22 12s0-3.2-.4-4.8zM10 15.5v-7l6 3.5z" />
    </Brand>
  );
}

export function TikTok({ size = 20 }: { size?: number }) {
  return (
    <Brand size={size}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.83-2.48V9.76a5.71 5.71 0 1 0 4.92 5.65V8.87a7.3 7.3 0 0 0 4.27 1.38V7.16a4.25 4.25 0 0 1-3.21-1.34z" />
    </Brand>
  );
}

export function LinkedIn({ size = 20 }: { size?: number }) {
  return (
    <Brand size={size}>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9.5 9h3.8v1.64h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.07V21h-4v-5.37c0-1.28-.02-2.93-1.78-2.93-1.79 0-2.06 1.4-2.06 2.84V21h-4z" />
    </Brand>
  );
}

const SOCIAL_ICONS = { facebook: Facebook, instagram: Instagram, youtube: YouTube, tiktok: TikTok, linkedin: LinkedIn };

export function SocialIcon({ name, size = 20 }: { name: keyof typeof SOCIAL_ICONS; size?: number }) {
  const Ico = SOCIAL_ICONS[name];
  return Ico ? <Ico size={size} /> : null;
}
