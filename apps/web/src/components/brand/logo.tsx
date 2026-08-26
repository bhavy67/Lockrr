import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

export function LogoMark({ className, size = 22 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
      aria-hidden
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="6"
        className="fill-primary/10"
      />
      <path
        d="M8 11.5V9a4 4 0 1 1 8 0v2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="7"
        y="11"
        width="10"
        height="8"
        rx="2"
        fill="currentColor"
      />
      <circle cx="12" cy="15" r="1.25" className="fill-primary-foreground" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        Lockerr
      </span>
    </div>
  );
}
