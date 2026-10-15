import type { DataClient } from "./client";
import { mockClient } from "./mock-client";
import { isNative, restored } from "./native";

/**
 * The app's data layer. All data lives in the browser — records in
 * localStorage, files in IndexedDB. No backend, no account required.
 *
 * Features import `data` from `@/lib/data` and nothing else.
 */
export const data: DataClient = isNative ? afterRestore(mockClient) : mockClient;

/**
 * Native only: every method waits for `restored`, so nothing reads
 * localStorage before records lost to the OS are copied back into it.
 * All DataClient methods are async, so this changes no signatures.
 */
function afterRestore(client: DataClient): DataClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      return async (...args: unknown[]) => {
        await restored;
        return value.apply(target, args);
      };
    },
  });
}

export type { DataClient } from "./client";
