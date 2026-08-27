import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Small lock inside a soft indigo tile. Kept intentionally simple — has to
 * read at 16 px in a favicon. The shackle is slightly heavier than the
 * previous revision (2 vs 1.8 stroke) and the keyhole a hair larger, both
 * to survive downscaling.
 */
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
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5.5"
        className="fill-primary/10"
      />
      <path
        d="M8 11.5V8.75a4 4 0 1 1 8 0V11.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="6.75"
        y="11"
        width="10.5"
        height="8.5"
        rx="2"
        fill="currentColor"
      />
      <circle cx="12" cy="15.25" r="1.4" className="fill-primary-foreground" />
    </svg>
  );
}

/**
 * The "LockKaro" wordmark uses weight contrast to visually acknowledge the
 * bilingual name: "Lock" (English) sits at medium weight, "Karo" (Hindi,
 * meaning "do it") in bold. Rendered as one word — no space, no visual seam
 * beyond weight.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-[15px] tracking-tight text-foreground">
        <span className="font-medium">Lock</span>
        <span className="font-bold">Karo</span>
      </span>
    </div>
  );
}
