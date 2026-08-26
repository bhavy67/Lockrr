export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-elevated focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
