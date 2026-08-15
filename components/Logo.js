// Logo — VETTE shield + wordmark
export default function Logo({ size = 28, word = true, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2.2l8 3.2v6.1c0 5-3.3 8.7-8 10.3-4.7-1.6-8-5.3-8-10.3V5.4l8-3.2z"
          fill="#C6FF4A"
        />
        <path
          d="M8.6 12.3l2.4 2.4 4.4-4.9"
          stroke="#0B0B10"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {word && (
        <span className="font-black tracking-[0.3em] text-soft text-sm leading-none">VETTE</span>
      )}
    </span>
  );
}
