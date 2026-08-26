import Link from "next/link";
import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = { title: "Create your vault" };

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-8rem)] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Create your vault
        </h1>
        <p className="text-sm text-muted-foreground">
          A quiet, private home for the paperwork of your life.
        </p>
      </div>
      <div className="mt-8">
        <SignUpForm />
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have one?{" "}
        <Link
          href="/sign-in"
          className="focus-ring rounded font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
