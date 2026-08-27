"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signInSchema, type SignInInput } from "@lockkaro/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignIn } from "./use-session";

export function SignInForm() {
  const router = useRouter();
  const signIn = useSignIn();
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signIn.mutateAsync(values);
      toast.success("Welcome back.");
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      form.setError("password", { message });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          {...form.register("email")}
          aria-invalid={!!form.formState.errors.email}
        />
        {form.formState.errors.email && (
          <FieldError message={form.formState.errors.email.message} />
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/sign-up"
            className="focus-ring rounded text-xs text-muted-foreground hover:text-foreground"
          >
            New here?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...form.register("password")}
          aria-invalid={!!form.formState.errors.password}
        />
        {form.formState.errors.password && (
          <FieldError message={form.formState.errors.password.message} />
        )}
      </div>

      <Button type="submit" className="w-full" disabled={signIn.isPending}>
        {signIn.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing you in
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-center gap-1.5 text-xs text-destructive"
    >
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}
