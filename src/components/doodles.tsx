// Hand-drawn inline SVG ornaments — the app's pen-and-ink voice.
type P = { className?: string; style?: React.CSSProperties };

export function DoodleStar({ className, style }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden fill="none">
      <path d="M12 2.6 C 12.9 7.4, 15 9.6, 21 11.4 C 15.4 13.2, 13 15.6, 12 21.4 C 11 15.8, 8.6 13.2, 3 11.6 C 8.8 9.8, 11 7.4, 12 2.6 Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

export function DoodleHeart({ className, style }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden fill="none">
      <path d="M12 20 C 5 15, 3.2 11.4, 5.2 8.6 C 7 6.2, 10.4 6.6, 12 9.4 C 13.6 6.6, 17 6.2, 18.8 8.6 C 20.8 11.4, 19 15, 12 20 Z" fill="currentColor" />
    </svg>
  );
}

export function HeartOutline({ className, style }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden fill="none">
      <path d="M12 19.4 C 5.8 15, 4 11.6, 5.8 9 C 7.4 6.8, 10.6 7.2, 12 9.8 C 13.4 7.2, 16.6 6.8, 18.2 9 C 20 11.6, 18.2 15, 12 19.4 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export function Flourish({ className, style }: P) {
  return (
    <svg viewBox="0 0 120 24" className={className} style={style} aria-hidden fill="none">
      <path d="M4 14 C 24 6, 40 20, 60 12 S 96 6, 116 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M52 12 c 2 -5, 7 -6, 9 -3 c -4 0 -6 2 -9 3 Z M68 12 c -2 -5, -7 -6, -9 -3 c 4 0, 6 2, 9 3 Z" fill="currentColor" />
      <circle cx="60" cy="11.4" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function SprigLine({ className, style }: P) {
  return (
    <svg viewBox="0 0 200 20" className={className} style={style} aria-hidden fill="none">
      <path d="M6 12 C 50 8, 150 8, 194 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {[30, 60, 90, 120, 150, 172].map((x, i) => (
        <path key={x} d={`M${x} ${10.5 - (i % 2)} c 2 -6, 7 -7, 9 -4 c -4 0 -6 2 -9 4 Z`} fill="currentColor" opacity={0.85} transform={i % 2 ? `rotate(180 ${x + 4} ${10}) translate(0 ${-1})` : undefined} />
      ))}
    </svg>
  );
}

export function TornEdge({ className, style, flip }: P & { flip?: boolean }) {
  return (
    <svg viewBox="0 0 1200 26" preserveAspectRatio="none" className={className} style={style} aria-hidden>
      <path
        d={
          flip
            ? "M0 26 L0 12 C 60 4, 120 18, 190 10 S 320 4, 400 12 S 540 20, 640 10 S 780 2, 880 12 S 1020 20, 1100 10 S 1170 6, 1200 12 L1200 26 Z"
            : "M0 0 L0 12 C 60 20, 120 6, 190 14 S 320 20, 400 12 S 540 4, 640 14 S 780 22, 880 12 S 1020 4, 1100 14 S 1170 18, 1200 12 L1200 0 Z"
        }
        fill="currentColor"
      />
    </svg>
  );
}

export function PinDoodle({ className, style }: P) {
  return (
    <svg viewBox="0 0 24 30" className={className} style={style} aria-hidden fill="none">
      <path d="M12 2 C 7 2, 4 5.6, 4 9.6 C 4 15, 12 27, 12 27 C 12 27, 20 15, 20 9.6 C 20 5.6, 17 2, 12 2 Z" fill="currentColor" />
      <circle cx="12" cy="9.6" r="3" fill="#F7F2E8" />
    </svg>
  );
}

export function EnvelopeDoodle({ className, style, sealed }: P & { sealed?: boolean }) {
  return (
    <svg viewBox="0 0 40 30" className={className} style={style} aria-hidden fill="none">
      <rect x="2" y="4" width="36" height="24" rx="2" fill="#FFFDF7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 6 L20 18 L37 6" stroke="currentColor" strokeWidth="1.4" fill="none" />
      {sealed && <circle cx="20" cy="20" r="4.4" fill="#BF7967" stroke="#A25F4E" strokeWidth="1" />}
    </svg>
  );
}

export function MoonDoodle({ className, style }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden fill="none">
      <path d="M18.6 14.8 A 8.4 8.4 0 1 1 9.4 4.4 A 7 7 0 0 0 18.6 14.8 Z" fill="currentColor" />
    </svg>
  );
}

export function FlowerDoodle({ className, style }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden fill="currentColor">
      <circle cx="12" cy="7" r="3.2" opacity="0.85" />
      <circle cx="17" cy="11" r="3.2" opacity="0.85" />
      <circle cx="15" cy="17" r="3.2" opacity="0.85" />
      <circle cx="9" cy="17" r="3.2" opacity="0.85" />
      <circle cx="7" cy="11" r="3.2" opacity="0.85" />
      <circle cx="12" cy="12.5" r="2.2" fill="#E6D7B8" />
    </svg>
  );
}

export function SunDoodle({ className, style }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="7.1" y2="7.1" />
      <line x1="16.9" y1="16.9" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="7.1" y2="16.9" />
      <line x1="16.9" y1="7.1" x2="19.1" y2="4.9" />
    </svg>
  );
}


