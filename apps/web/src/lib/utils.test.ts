import { describe, expect, it } from "vitest";
import {
  cn,
  formatBytes,
  initials,
  sanitizeFileName,
  stripExtension,
  truncate,
} from "./utils";

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

describe("stripExtension", () => {
  it("drops a trailing extension", () => {
    expect(stripExtension("passport.pdf")).toBe("passport");
  });

  it("drops only the last one", () => {
    expect(stripExtension("scan.2024.final.pdf")).toBe("scan.2024.final");
  });

  it("leaves a name without an extension alone", () => {
    expect(stripExtension("passport")).toBe("passport");
  });

  it("treats a leading dot as part of the name", () => {
    expect(stripExtension(".gitignore")).toBe(".gitignore");
  });
});

describe("sanitizeFileName", () => {
  it("keeps a plain name intact", () => {
    expect(sanitizeFileName("passport.pdf")).toBe("passport.pdf");
  });

  it("collapses characters that do not belong in a storage path", () => {
    expect(sanitizeFileName("my passport (2024).pdf")).toBe(
      "my_passport_2024_.pdf",
    );
  });

  it("cannot be used to climb out of the user's folder", () => {
    expect(sanitizeFileName("../../etc/passwd")).not.toContain("/");
  });

  it("caps the length", () => {
    expect(sanitizeFileName("a".repeat(300))).toHaveLength(120);
  });
});
