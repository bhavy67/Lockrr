"use client";

import { useBindExtractionInvalidator } from "./hooks";

export function ExtractionQueueMount() {
  useBindExtractionInvalidator();
  return null;
}
