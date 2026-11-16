/** Logotipo REGALUMO: un regalo cuyo lazo se convierte en un destello de luz ("lumo"). */
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="6" y="20" width="32" height="24" rx="6" fill="#FF6B4A" />
      <rect x="4" y="15" width="36" height="9" rx="4" fill="#1E1633" />
      <rect x="19" y="15" width="6" height="29" fill="#FFC23D" />
      <path d="M22 15c-7-1-11-6-8-9 3-3 7 2 8 9Z" fill="none" stroke="#1E1633" strokeWidth="3" strokeLinejoin="round" />
      <path d="M22 15c3-6 8-10 10-7 2 3-3 7-10 7Z" fill="none" stroke="#1E1633" strokeWidth="3" strokeLinejoin="round" />
      <path d="M40 2l1.8 4.6L46.5 8.4 41.8 10.2 40 15l-1.8-4.8L33.5 8.4l4.7-1.8Z" fill="#FFC23D" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="font-display text-2xl font-black tracking-tight lowercase">
        regal<span className="text-coral">u</span>mo
      </span>
    </span>
  );
}
