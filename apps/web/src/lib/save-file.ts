import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { MouseEvent } from "react";
import { blobToBase64, isNative } from "@/lib/data/native";

/**
 * Hand a file to the user. On the web that's a normal download. Inside the
 * native app `<a download>` does nothing, so the file goes to the cache dir
 * and the OS share sheet opens — Save to Files, open in a PDF viewer, etc.
 */
export async function saveFile(source: Blob | string, fileName: string): Promise<void> {
  if (!isNative) {
    const url = typeof source === "string" ? source : URL.createObjectURL(source);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (typeof source !== "string") setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
  const { uri } = await Filesystem.writeFile({
    path: fileName,
    data: await blobToBase64(blob),
    directory: Directory.Cache,
  });
  try {
    await Share.share({ files: [uri] });
  } catch {
    // Dismissing the share sheet rejects; that's not an error to the user.
  }
}

/** onClick for an `<a href={blobUrl}>` link: native routes it through `saveFile`. */
export function nativeLinkHandler(url: string, fileName: string) {
  if (!isNative) return undefined;
  return (e: MouseEvent) => {
    e.preventDefault();
    void saveFile(url, fileName);
  };
}
