"use client";

import { LocalNotifications } from "@capacitor/local-notifications";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDocuments } from "@/features/documents/hooks";
import { isNative } from "@/lib/data/native";
import { documentHref } from "@/lib/routes";
import { syncReminders } from "./notifications";

/** Native app only: keeps expiry notifications in step with the vault. */
export function RemindersMount() {
  const router = useRouter();
  const { data: docs } = useDocuments();

  useEffect(() => {
    if (docs) void syncReminders(docs).catch((e) => console.warn("[LockKaro] reminders", e));
  }, [docs]);

  useEffect(() => {
    if (!isNative) return;
    const handle = LocalNotifications.addListener("localNotificationActionPerformed", (e) => {
      const id = e.notification.extra?.documentId;
      if (typeof id === "string") router.push(documentHref(id));
    });
    return () => void handle.then((h) => h.remove());
  }, [router]);

  return null;
}
