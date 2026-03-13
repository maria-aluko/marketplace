interface ProfileCompletenessRingProps {
  /** Score from 0–100 */
  score: number;
  /** Ring size in pixels */
  size?: number;
}

export function ProfileCompletenessRing({ score, size = 28 }: ProfileCompletenessRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 80 ? 'text-primary-500' : clamped >= 50 ? 'text-celebration-500' : 'text-red-400';

  return (
    <div
      className="relative inline-flex items-center justify-center"
      title={`Profile ${clamped}% complete`}
      aria-label={`Profile ${clamped}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={color}
        />
      </svg>
      <span className="absolute text-[8px] font-semibold text-surface-600">{clamped}</span>
    </div>
  );
}
