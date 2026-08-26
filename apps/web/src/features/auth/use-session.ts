"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@lockerr/types";
import { data } from "@/lib/data";
import { qk } from "@/lib/query-keys";

export function useSession() {
  return useQuery<User | null>({
    queryKey: qk.session,
    queryFn: () => data.getSession(),
    staleTime: Infinity,
  });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      data.signIn(input.email, input.password),
    onSuccess: (res) => {
      qc.setQueryData(qk.session, res.user);
    },
  });
}

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      email: string;
      password: string;
      displayName: string;
    }) => data.signUp(input.email, input.password, input.displayName),
    onSuccess: (res) => {
      qc.setQueryData(qk.session, res.user);
    },
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => data.signOut(),
    onSuccess: () => {
      qc.setQueryData(qk.session, null);
      qc.clear();
    },
  });
}
