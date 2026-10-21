import { describe, it, expect } from "vitest";
import { createTicketSchema, createCommentSchema } from "@/lib/validation/ticket.schema";
import { createAssetSchema } from "@/lib/validation/asset.schema";
import { loginSchema } from "@/lib/validation/auth.schema";
import { TicketPriority, TicketType } from "@prisma/client";

describe("Input Validation & Zod Schema Enforcement", () => {
  it("rejects ticket creation with short title or description", () => {
    const invalid = {
      title: "VPN", // too short (min 5)
      description: "Broken", // too short (min 15)
      type: TicketType.INCIDENT,
      categoryId: "cat-1",
      priority: TicketPriority.HIGH,
    };

    const result = createTicketSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts valid ticket payload", () => {
    const valid = {
      title: "VPN connection timeout on gateway US-West",
      description: "Continuous drops observed when connecting to internal staging cluster via Palo Alto client.",
      type: TicketType.INCIDENT,
      categoryId: "cat-1",
      priority: TicketPriority.HIGH,
    };

    const result = createTicketSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects empty comment submission", () => {
    const invalid = { content: "   ", isInternal: false };
    const result = createCommentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("validates asset creation dates and required fields", () => {
    const validAsset = {
      assetTag: "AST-9099",
      serialNumber: "SN-987123",
      assetType: "LAPTOP",
      manufacturer: "Lenovo",
      model: "ThinkPad X1 Carbon",
      purchaseDate: "2024-01-15",
      warrantyExpiry: "2027-01-15",
      location: "HQ Floor 3",
    };

    const result = createAssetSchema.safeParse(validAsset);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.purchaseDate).toBeInstanceOf(Date);
    }
  });

  it("rejects invalid login email syntax", () => {
    const invalid = { email: "not-an-email", password: "some-password" };
    const result = loginSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
