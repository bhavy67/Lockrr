import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The link may be broken, or the page may have moved.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">Go to my vault</Link>
        </Button>
      </div>
    </div>
  );
}
