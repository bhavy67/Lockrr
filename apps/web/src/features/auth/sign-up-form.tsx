"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signUpSchema, type SignUpInput } from "@lockerr/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignUp } from "./use-session";

export function SignUpForm() {
  const router = useRouter();
  const signUp = useSignUp();
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", displayName: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signUp.mutateAsync(values);
      toast.success("Welcome to Lockerr.");
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      form.setError("email", { message });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">What should we call you?</Label>
        <Input
          id="displayName"
          type="text"
          autoComplete="name"
          placeholder="Alex Chen"
          {...form.register("displayName")}
          aria-invalid={!!form.formState.errors.displayName}
        />
        {form.formState.errors.displayName && (
          <FieldError message={form.formState.errors.displayName.message} />
        )}
      </div>

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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          {...form.register("password")}
          aria-invalid={!!form.formState.errors.password}
        />
        {form.formState.errors.password && (
          <FieldError message={form.formState.errors.password.message} />
        )}
      </div>

      <Button type="submit" className="w-full" disabled={signUp.isPending}>
        {signUp.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating your vault
          </>
        ) : (
          "Create your vault"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to keep your documents to yourself. This is a
        demo build — accounts and files are stored locally on this device.
      </p>
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
