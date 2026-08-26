"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useUploadDialog } from "./upload-dialog-store";

interface Props extends ButtonProps {
  children?: ReactNode;
}

export function UploadCta({ children, ...props }: Props) {
  const open = useUploadDialog((s) => s.open);
  return (
    <Button onClick={() => open()} {...props}>
      {children}
    </Button>
  );
}

// Also export raw props type in case other components need it
export type UploadCtaProps = ButtonHTMLAttributes<HTMLButtonElement>;
