import { LocalNotifications } from "@capacitor/local-notifications";
import type { DocumentRecord } from "@lockkaro/types";
import { isNative, kvSet } from "@/lib/data/native";
import { planReminders } from "./plan-reminders";

const KEY = "lk.expiryReminders";

export const remindersEnabled = () => isNative && localStorage.getItem(KEY) === "1";

/** Ask for permission, then turn reminders on. Returns whether they're on. */
export async function enableReminders(): Promise<boolean> {
  const { display } = await LocalNotifications.requestPermissions();
  if (display !== "granted") return false;
  kvSet(KEY, "1");
  return true;
}

export async function disableReminders(): Promise<void> {
  kvSet(KEY, "0");
  await cancelAll();
}

async function cancelAll() {
  const { notifications } = await LocalNotifications.getPending();
  if (notifications.length) {
    await LocalNotifications.cancel({ notifications: notifications.map((n) => ({ id: n.id })) });
  }
}

/**
 * Replace every scheduled reminder with a fresh plan. Cheap (a few dozen
 * alarms), so it simply re-runs whenever the document list changes.
 */
export async function syncReminders(docs: DocumentRecord[]): Promise<void> {
  if (!remindersEnabled()) return;
  await cancelAll();
  const plan = planReminders(docs);
  if (!plan.length) return;
  await LocalNotifications.schedule({
    notifications: plan.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      // Inexact is fine for a day-level reminder. Without this the plugin
      // defaults to exact and sends the user to the "Alarms & reminders"
      // settings page, a permission we deliberately don't declare.
      isExactNotification: false,
      schedule: { at: r.at, allowWhileIdle: true },
      smallIcon: "ic_stat_lock",
      iconColor: "#F59E0B",
      extra: { documentId: r.documentId },
    })),
  });
}
