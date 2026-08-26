"use client";

import { create } from "zustand";

interface UploadDialogState {
  isOpen: boolean;
  initialFiles: File[] | null;
  open: (files?: File[]) => void;
  close: () => void;
}

export const useUploadDialog = create<UploadDialogState>((set) => ({
  isOpen: false,
  initialFiles: null,
  open: (files) => set({ isOpen: true, initialFiles: files ?? null }),
  close: () => set({ isOpen: false, initialFiles: null }),
}));
