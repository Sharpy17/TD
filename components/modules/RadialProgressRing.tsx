type RadialProgressRingProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
};

export function RadialProgressRing({ percentage, size = 68, strokeWidth = 6 }: RadialProgressRingProps) {
  const bounded = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (bounded / 100) * circumference;
  const gradient = bounded === 100 ? "ring-complete" : bounded > 70 ? "ring-final" : bounded > 30 ? "ring-mid" : "ring-early";

  return (
    <div className="progress-ring" style={{ width: size, height: size }} aria-label={`${bounded}% complete`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={bounded === 100 ? "#10B981" : bounded > 70 ? "#6366F1" : bounded > 30 ? "#FFAA00" : "#FF2A55"} />
            <stop offset="100%" stopColor={bounded === 100 ? "#34D399" : bounded > 70 ? "#38BDF8" : bounded > 30 ? "#8B5CF6" : "#FF708F"} />
          </linearGradient>
        </defs>
        <circle className="progress-ring__track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <circle
          className="progress-ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradient})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <strong>{bounded}%</strong>
    </div>
  );
}
