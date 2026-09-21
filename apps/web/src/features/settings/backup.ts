import JSZip from "jszip";
import type { Category, Collection, DocumentRecord, DocumentText, Tag } from "@lockkaro/types";
import { getAllFiles, putFile } from "@/lib/data/mock-storage";

// Mirrors the KEYS object in mock-client.ts
const LS_KEYS = {
  deviceId: "lk.deviceId",
  categories: (uid: string) => `lockerr.categories.${uid}`,
  tags: (uid: string) => `lockerr.tags.${uid}`,
  collections: (uid: string) => `lockerr.collections.${uid}`,
  documents: (uid: string) => `lockerr.documents.${uid}`,
  activity: (uid: string) => `lockerr.activity.${uid}`,
  documentTexts: (uid: string) => `lockerr.document_texts.${uid}`,
};

function lsRead<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getDeviceId(): string {
  return localStorage.getItem(LS_KEYS.deviceId) ?? "";
}

export interface BackupMetadata {
  version: 1;
  exportedAt: string;
  categories: Category[];
  tags: Tag[];
  collections: Collection[];
  documents: DocumentRecord[];
  documentTexts: Record<string, DocumentText>;
}

export async function exportVault(): Promise<void> {
  const uid = getDeviceId();
  if (!uid) throw new Error("No vault found to export.");

  const metadata: BackupMetadata = {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories: lsRead<Category[]>(LS_KEYS.categories(uid), []),
    tags: lsRead<Tag[]>(LS_KEYS.tags(uid), []),
    collections: lsRead<Collection[]>(LS_KEYS.collections(uid), []),
    documents: lsRead<DocumentRecord[]>(LS_KEYS.documents(uid), []),
    documentTexts: lsRead<Record<string, DocumentText>>(LS_KEYS.documentTexts(uid), {}),
  };

  const zip = new JSZip();
  zip.file("metadata.json", JSON.stringify(metadata, null, 2));

  const files = await getAllFiles();
  const filesFolder = zip.folder("files")!;
  for (const [path, blob] of files) {
    const safeName = path.replace(/\//g, "_");
    filesFolder.file(safeName, blob);
  }

  const content = await zip.generateAsync({ type: "blob" });
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lockkaro-backup-${date}.zip`;
  a.click();
  URL.revokeObjectURL(url);

  localStorage.setItem("lk.lastBackup", new Date().toISOString());
}

export async function importVault(file: File): Promise<number> {
  const uid = getDeviceId() || (() => {
    const id = crypto.randomUUID();
    localStorage.setItem(LS_KEYS.deviceId, id);
    return id;
  })();

  const zip = await JSZip.loadAsync(file);

  const metaFile = zip.file("metadata.json");
  if (!metaFile) throw new Error("Invalid backup: missing metadata.json");

  const meta = JSON.parse(await metaFile.async("string")) as BackupMetadata;

  // Rewrite userId on all records to match the current device
  const rewrite = <T extends { userId: string }>(items: T[]): T[] =>
    items.map((item) => ({ ...item, userId: uid }));

  const docs = rewrite(meta.documents);

  localStorage.setItem(LS_KEYS.categories(uid), JSON.stringify(rewrite(meta.categories)));
  localStorage.setItem(LS_KEYS.tags(uid), JSON.stringify(rewrite(meta.tags)));
  localStorage.setItem(LS_KEYS.collections(uid), JSON.stringify(rewrite(meta.collections)));
  localStorage.setItem(LS_KEYS.documents(uid), JSON.stringify(docs));
  if (meta.documentTexts) {
    localStorage.setItem(LS_KEYS.documentTexts(uid), JSON.stringify(meta.documentTexts));
  }

  // Restore file blobs
  const filesFolder = zip.folder("files");
  if (filesFolder) {
    const fileEntries = Object.values(filesFolder.files).filter((f) => !f.dir);
    await Promise.all(
      fileEntries.map(async (entry) => {
        const blob = await entry.async("blob");
        // Restore path: safeName was path.replace(/\//g, "_")
        const originalPath = entry.name.replace(/^files\//, "").replace(/_/g, "/");
        await putFile(originalPath, blob);
      }),
    );
  }

  return docs.length;
}

export function getLastBackupDate(): string | null {
  return localStorage.getItem("lk.lastBackup");
}

export async function getStorageEstimate(): Promise<{ used: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const est = await navigator.storage.estimate();
  return { used: est.usage ?? 0, quota: est.quota ?? 0 };
}
