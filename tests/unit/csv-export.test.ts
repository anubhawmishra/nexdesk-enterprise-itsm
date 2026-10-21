import { describe, it, expect } from "vitest";
import { sanitizeCsvField, generateCsv } from "@/lib/security/csv-export";

describe("CSV Export Security & RFC 4180 Compliance", () => {
  it("prefixes dangerous formula trigger '=' with a single quote", () => {
    const malicious = "=cmd|' /C calc'!A0";
    const sanitized = sanitizeCsvField(malicious);
    expect(sanitized.startsWith("'=")).toBe(true);
  });

  it("prefixes formula trigger '+' with a single quote", () => {
    const malicious = "+12345";
    const sanitized = sanitizeCsvField(malicious);
    expect(sanitized.startsWith("'+")).toBe(true);
  });

  it("prefixes formula trigger '-' with a single quote", () => {
    const malicious = "-5+5";
    const sanitized = sanitizeCsvField(malicious);
    expect(sanitized.startsWith("'-")).toBe(true);
  });

  it("prefixes formula trigger '@' with a single quote", () => {
    const maliciousWithoutComma = "@SUM(1)";
    const sanitizedClean = sanitizeCsvField(maliciousWithoutComma);
    expect(sanitizedClean.startsWith("'@")).toBe(true);

    const maliciousWithComma = "@SUM(1,2)";
    const sanitizedQuoted = sanitizeCsvField(maliciousWithComma);
    expect(sanitizedQuoted).toBe("\"'@SUM(1,2)\"");
  });

  it("escapes fields containing commas or quotes correctly", () => {
    const textWithComma = "San Francisco, CA";
    expect(sanitizeCsvField(textWithComma)).toBe('"San Francisco, CA"');

    const textWithQuotes = 'MacBook Pro 16"';
    expect(sanitizeCsvField(textWithQuotes)).toBe('"MacBook Pro 16"""');
  });

  it("generates a clean multi-row CSV document", () => {
    const items = [
      { tag: "AST-1001", model: "ThinkPad X1", cost: 1500 },
      { tag: "AST-1002", model: "=DDE('cmd';'calc')", cost: 2000 },
    ];

    const csv = generateCsv(items, [
      { header: "Asset Tag", key: "tag" },
      { header: "Model", key: "model" },
      { header: "Cost", key: "cost" },
    ]);

    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Asset Tag,Model,Cost");
    expect(lines[1]).toBe("AST-1001,ThinkPad X1,1500");
    // Verify malicious cell is neutralized
    expect(lines[2]).toContain("'=DDE");
  });
});
