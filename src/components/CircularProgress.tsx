import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  trackColor: string;
  progressColor: string;
  subtitle?: string;
  showPercentage?: boolean;
  textSizeClass?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 90,
  strokeWidth = 9,
  trackColor,
  progressColor,
  subtitle,
  showPercentage = true,
  textSizeClass = 'text-xl',
  className = '',
}) => {
  const clampedPercentage = Math.min(100, Math.max(0, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="butt"
          className="transition-all duration-300 ease-out"
        />
      </svg>

      {/* Centered text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {showPercentage && (
          <span className={`font-black tracking-tighter text-black leading-none ${textSizeClass}`}>
            {clampedPercentage}%
          </span>
        )}
        {subtitle && (
          <span className="text-[10px] font-black tracking-wider uppercase text-neutral-800 mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
