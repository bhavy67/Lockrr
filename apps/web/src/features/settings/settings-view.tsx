"use client";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, Database, Download, HardDrive, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { isNative } from "@/lib/data/native";
import { formatBytes } from "@/lib/utils";
import {
  exportVault,
  getLastBackupDate,
  getStorageEstimate,
  importVault,
} from "./backup";
import { PhoneSettings } from "./phone-settings";

export function SettingsView() {
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [storage, setStorage] = useState<{ used: number; quota: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLastBackup(getLastBackupDate());
    // In the app, documents live outside the WebView; its estimate would mislead.
    if (!isNative) getStorageEstimate().then(setStorage);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportVault();
      setLastBackup(new Date().toISOString());
      toast.success("Vault exported successfully.");
    } catch (err) {
      toast.error("Export failed. " + String(err));
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingFile(f);
    setConfirmOpen(true);
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!pendingFile) return;
    setConfirmOpen(false);
    setImporting(true);
    try {
      const count = await importVault(pendingFile);
      toast.success(`Vault restored. ${count} document${count !== 1 ? "s" : ""} imported.`);
      // Refetch everything rather than reload the page: inside the native app
      // a reload of /settings boots the landing page (see CLAUDE.md #15).
      await queryClient.invalidateQueries();
    } catch (err) {
      toast.error("Import failed. " + String(err));
    } finally {
      setImporting(false);
      setPendingFile(null);
    }
  };

  const usedPct = storage ? Math.round((storage.used / storage.quota) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your vault and data preferences.
        </p>
      </header>

      {/* Backup */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Backup your vault</h2>
            <p className="text-xs text-muted-foreground">
              Download a ZIP file containing all your documents and metadata.
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {lastBackup ? (
              <p className="text-xs text-muted-foreground">
                Last backup:{" "}
                <span className="text-foreground">
                  {format(new Date(lastBackup), "d MMM yyyy, h:mm a")}
                </span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No backup made yet.</p>
            )}
          </div>
          <Button
            onClick={handleExport}
            disabled={exporting}
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting…" : "Export vault"}
          </Button>
        </div>
      </section>

      {/* Restore */}
      <section className="mt-4 rounded-xl border border-border bg-card p-6 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Restore from backup</h2>
            <p className="text-xs text-muted-foreground">
              Import a previously exported ZIP file to restore your documents.
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Imported documents will be merged with your current vault.</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {importing ? "Importing…" : "Choose ZIP file"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".zip"
            className="sr-only"
            onChange={handleFileChange}
            aria-label="Choose backup ZIP file"
          />
        </div>
      </section>

      <PhoneSettings />

      {/* Storage usage */}
      {storage && (
        <section className="mt-4 rounded-xl border border-border bg-card p-6 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Storage</h2>
              <p className="text-xs text-muted-foreground">
                Storage used by your vault on this device.
              </p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatBytes(storage.used)} used</span>
              <span>{formatBytes(storage.quota)} total</span>
            </div>
            <Progress value={usedPct} className="h-2" />
          </div>
        </section>
      )}

      {/* About */}
      <section className="mt-4 rounded-xl border border-border bg-card p-6 shadow-subtle">
        <h2 className="text-sm font-semibold text-foreground">About LockKaro</h2>
        <Separator className="my-3" />
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Storage</dt>
            <dd className="text-foreground">On this device only</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Account</dt>
            <dd className="text-foreground">None required</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Version</dt>
            {/* Keep in step with versionName in android/app/build.gradle. */}
            <dd className="text-foreground">1.0.1</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Privacy</dt>
            <dd>
              <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
                Privacy policy
              </Link>
            </dd>
          </div>
        </dl>
      </section>

      {/* Confirm import dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore from backup?</DialogTitle>
            <DialogDescription>
              Documents from{" "}
              <strong>{pendingFile?.name}</strong> will be merged into your
              current vault. Existing documents with the same ID will be
              overwritten.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>Restore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
