import { describe, expect, it } from "vitest";
import { cn, formatBytes, initials, truncate } from "./utils";

describe("cn", () => {
  it("merges class names and dedupes tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "text-lg", null, "font-medium")).toBe(
      "text-sm font-medium",
    );
  });
});

describe("formatBytes", () => {
  it("returns 0 B for zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("uses integer values for small bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("uses KB", () => {
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("uses MB", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });

  it("scales up to TB", () => {
    expect(formatBytes(1024 ** 4)).toMatch(/TB$/);
  });
});

describe("initials", () => {
  it("takes first letters of first two words", () => {
    expect(initials("Alex Chen")).toBe("AC");
    expect(initials("Bhavy L Ladani")).toBe("BL");
  });

  it("handles single word", () => {
    expect(initials("Alex")).toBe("A");
  });

  it("fallback for empty string", () => {
    expect(initials("")).toBe("?");
    expect(initials("   ")).toBe("?");
  });

  it("uppercases", () => {
    expect(initials("alex chen")).toBe("AC");
  });
});

describe("truncate", () => {
  it("returns the string unchanged when short enough", () => {
    expect(truncate("hi", 10)).toBe("hi");
  });

  it("truncates with ellipsis", () => {
    expect(truncate("abcdefghij", 5)).toBe("abcd…");
  });
});
