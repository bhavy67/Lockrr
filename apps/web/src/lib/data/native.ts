/**
 * Native (Capacitor) persistence.
 *
 * Inside the iOS/Android app, the WebView's localStorage and IndexedDB are
 * storage the OS is allowed to reclaim when the phone runs low on space — not
 * acceptable for a vault. So on native:
 *
 *   - file blobs live in the app's private data directory (`files/…`), and
 *   - every localStorage write is mirrored to `kv/<key>`, then restored at
 *     boot for any key localStorage has lost.
 *
 * localStorage stays the synchronous read path, so nothing above the data
 * layer changes. On the web, none of this runs.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

export const isNative = Capacitor.isNativePlatform();

const DIR = Directory.Data;
const kvPath = (key: string) => `kv/${encodeURIComponent(key)}`;

// ---------- records ----------

const pending = new Map<string, Promise<void>>();

/**
 * localStorage.setItem, mirrored to disk on native. Writes to the same key are
 * chained and each one persists localStorage's value *at the time it runs*, so
 * the file always ends on the latest value no matter how calls interleave.
 */
export function kvSet(key: string, value: string): void {
  localStorage.setItem(key, value);
  if (!isNative) return;
  // ponytail: a write still in flight when the app is killed is lost from the
  // mirror; localStorage still has it, and restore only fills missing keys.
  const next = (pending.get(key) ?? Promise.resolve()).then(() =>
    Filesystem.writeFile({
      path: kvPath(key),
      data: localStorage.getItem(key) ?? "",
      directory: DIR,
      encoding: Encoding.UTF8,
      recursive: true,
    }).then(
      () => undefined,
      (err) => console.warn("[LockKaro] couldn't persist", key, err),
    ),
  );
  pending.set(key, next);
}

/** Copy mirrored records back into localStorage for any key it has lost. */
async function restoreKv(): Promise<void> {
  let names: string[];
  try {
    const { files } = await Filesystem.readdir({ path: "kv", directory: DIR });
    names = files.map((f) => f.name);
  } catch {
    return; // first launch — nothing mirrored yet
  }
  await Promise.all(
    names.map(async (name) => {
      const key = decodeURIComponent(name);
      if (localStorage.getItem(key) !== null) return;
      const { data } = await Filesystem.readFile({
        path: `kv/${name}`,
        directory: DIR,
        encoding: Encoding.UTF8,
      });
      localStorage.setItem(key, data as string);
    }),
  );
}

/** Resolves once records are back. `@/lib/data` awaits it before every call. */
export const restored: Promise<void> = isNative
  ? restoreKv().catch((err) => console.warn("[LockKaro] restore failed", err))
  : Promise.resolve();

// ---------- file blobs ----------

const filePath = (key: string) => `files/${key}`;

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(",", 2)[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function base64ToBlob(b64: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes]);
}

export async function nativePutFile(key: string, blob: Blob): Promise<void> {
  // ponytail: base64 over the bridge holds the file in memory ~2.3x; fine for
  // documents, revisit (chunked appendFile) if people store 100 MB+ videos.
  await Filesystem.writeFile({
    path: filePath(key),
    data: await blobToBase64(blob),
    directory: DIR,
    recursive: true,
  });
}

export async function nativeGetFile(key: string): Promise<Blob | null> {
  try {
    const { data } = await Filesystem.readFile({ path: filePath(key), directory: DIR });
    return typeof data === "string" ? base64ToBlob(data) : data;
  } catch {
    return null;
  }
}

export async function nativeDeleteFile(key: string): Promise<void> {
  await Filesystem.deleteFile({ path: filePath(key), directory: DIR }).catch(() => {});
}

/** Every stored file, keyed like `putFile` keys (`<uid>/<id>-<name>`). */
export async function nativeGetAllFiles(): Promise<Map<string, Blob>> {
  const out = new Map<string, Blob>();
  const walk = async (dir: string): Promise<void> => {
    const { files } = await Filesystem.readdir({ path: filePath(dir), directory: DIR });
    for (const f of files) {
      const key = dir ? `${dir}/${f.name}` : f.name;
      if (f.type === "directory") await walk(key);
      else {
        const blob = await nativeGetFile(key);
        if (blob) out.set(key, blob);
      }
    }
  };
  await walk("").catch(() => {}); // no files/ yet
  return out;
}
