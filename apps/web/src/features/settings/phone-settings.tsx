"use client";

import { BellRing, Fingerprint } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { disableReminders, enableReminders, remindersEnabled, syncReminders } from "@/features/reminders/notifications";
import { canUseLock, lockEnabled, setLockEnabled } from "@/features/security/app-lock";
import { data } from "@/lib/data";
import { isNative } from "@/lib/data/native";

/** App lock + expiry reminders. Only rendered inside the native app. */
export function PhoneSettings() {
  const [ready, setReady] = useState(false);
  const [lockAvailable, setLockAvailable] = useState(false);
  const [lock, setLock] = useState(false);
  const [reminders, setReminders] = useState(false);
  const [busy, setBusy] = useState(false);

  // Decided in an effect, not during render: the page is prerendered as web.
  useEffect(() => {
    if (!isNative) return;
    setLock(lockEnabled());
    setReminders(remindersEnabled());
    void canUseLock().then(setLockAvailable).finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  const toggleLock = async (on: boolean) => {
    setBusy(true);
    if (await setLockEnabled(on)) setLock(on);
    else toast.error("Couldn't confirm it's you. The lock is still off.");
    setBusy(false);
  };

  const toggleReminders = async (on: boolean) => {
    setBusy(true);
    try {
      if (!on) {
        await disableReminders();
        setReminders(false);
      } else if (await enableReminders()) {
        setReminders(true);
        await syncReminders(await data.listDocuments());
        toast.success("You'll be reminded 30 days, 7 days and on the day a document expires.");
      } else {
        toast.error("Notifications are off for LockKaro. Turn them on in your phone's settings.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-6 shadow-subtle">
      <h2 className="text-sm font-semibold text-foreground">On this phone</h2>
      <Separator className="my-3" />
      <div className="space-y-5">
        <SettingRow
          icon={Fingerprint}
          title="App lock"
          description={
            lockAvailable
              ? "Ask for your fingerprint or screen lock when you open LockKaro, and hide it in recent apps."
              : "Set a fingerprint or screen lock in your phone's settings to use this."
          }
          checked={lock}
          disabled={busy || !lockAvailable}
          onChange={toggleLock}
        />
        <SettingRow
          icon={BellRing}
          title="Expiry reminders"
          description="A notification 30 days, 7 days and on the day a document expires."
          checked={reminders}
          disabled={busy}
          onChange={toggleReminders}
        />
      </div>
    </section>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: typeof Fingerprint;
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (on: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {title}
        </label>
        <p id={`${id}-desc`} className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-describedby={`${id}-desc`}
      />
    </div>
  );
}
