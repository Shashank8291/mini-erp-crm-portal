interface LogoIconProps {
  size?: number;
  className?: string;
}

export default function LogoIcon({ size = 32, className = '' }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="#4F46E5" />
      <path
        d="M20 9L29.5 14.5V25.5L20 31L10.5 25.5V14.5L20 9Z"
        stroke="#E0E7FF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M20 14L25.5 17.5V23.5L20 27L14.5 23.5V17.5L20 14Z"
        fill="#FFFFFF"
        fillOpacity="0.9"
      />
      <circle cx="20" cy="20" r="2.5" fill="#4F46E5" />
    </svg>
  );
}
