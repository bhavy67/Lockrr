import type { DataClient } from "./client";
import { mockClient } from "./mock-client";

/**
 * The app's data layer. All data lives in the browser — records in
 * localStorage, files in IndexedDB. No backend, no account required.
 *
 * Features import `data` from `@/lib/data` and nothing else.
 */
export const data: DataClient = mockClient;

export type { DataClient } from "./client";
