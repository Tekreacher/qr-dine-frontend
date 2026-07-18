// Circular countdown ring showing days left in subscription
// Green (>15 days) → Yellow (7-15 days) → Red (<7 days)
export default function SubscriptionRing({ daysLeft, totalDays = 30, size = 80, strokeWidth = 8 }) {
  // Clamp days between 0 and totalDays
  const days = daysLeft === null || daysLeft === undefined ? 0 : Math.max(0, Math.min(daysLeft, totalDays));
  const percentage = (days / totalDays) * 100;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on days left
  let color, label;
  if (daysLeft === null || daysLeft === undefined) {
    color = '#9CA3AF'; label = 'N/A';
  } else if (daysLeft <= 0) {
    color = '#DC2626'; label = 'Expired';
  } else if (daysLeft <= 7) {
    color = '#DC2626'; label = `${daysLeft}d`;   // red
  } else if (daysLeft <= 15) {
    color = '#F59E0B'; label = `${daysLeft}d`;   // yellow/orange
  } else {
    color = '#16A34A'; label = `${daysLeft}d`;   // green
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(156, 163, 175, 0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease' }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold leading-none" style={{ color, fontSize: size * 0.22 }}>
          {daysLeft !== null && daysLeft > 0 ? daysLeft : (daysLeft <= 0 ? '0' : '—')}
        </span>
        <span className="text-gray-400 leading-none mt-0.5" style={{ fontSize: size * 0.11 }}>
          {daysLeft !== null && daysLeft > 0 ? 'days' : (daysLeft <= 0 ? 'expired' : '')}
        </span>
      </div>
    </div>
  );
}
