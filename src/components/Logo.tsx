export default function Logo({ size = 32, light = false }: { size?: number; light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
        <rect width="32" height="32" rx="9" fill={light ? '#ffffff' : '#1c4fe0'} />
        <path
          d="M9 16.5l4.2 4.2L23 11"
          fill="none"
          stroke={light ? '#1c4fe0' : '#ffffff'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24.5" cy="8" r="3" fill="#ff7a18" />
      </svg>
      <div className={`leading-none ${light ? 'text-white' : 'text-brand-950'}`}>
        <div className="font-extrabold tracking-tight text-[19px]">Qualstate</div>
      </div>
    </div>
  )
}
