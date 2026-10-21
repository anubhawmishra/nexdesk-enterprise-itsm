import { z } from "zod";
import { AssetType, AssetLifecycleStatus } from "@prisma/client";

export const createAssetSchema = z.object({
  assetTag: z
    .string()
    .trim()
    .min(3, "Asset tag must be at least 3 characters")
    .max(50, "Asset tag cannot exceed 50 characters"),
  serialNumber: z
    .string()
    .trim()
    .min(3, "Serial number must be at least 3 characters")
    .max(80, "Serial number cannot exceed 80 characters"),
  assetType: z.nativeEnum(AssetType),
  manufacturer: z.string().trim().min(2, "Manufacturer is required"),
  model: z.string().trim().min(2, "Model is required"),
  operatingSystem: z.string().trim().optional().nullable(),
  processor: z.string().trim().optional().nullable(),
  ramGb: z.number().int().positive().optional().nullable(),
  storageGb: z.number().int().positive().optional().nullable(),
  purchaseDate: z.string().transform((val) => new Date(val)),
  warrantyExpiry: z.string().transform((val) => new Date(val)),
  lifecycleStatus: z.nativeEnum(AssetLifecycleStatus).default(AssetLifecycleStatus.IN_STORAGE),
  location: z.string().trim().min(2, "Location is required"),
  purchaseCost: z.number().positive().optional().nullable(),
  assignedToUserId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const assignAssetSchema = z.object({
  assignedToUserId: z.string().nullable(),
  notes: z.string().trim().max(500).optional(),
});

export const maintenanceRecordSchema = z.object({
  maintenanceType: z.enum(["PREVENTIVE", "REPAIR", "UPGRADE", "INSPECTION"]),
  description: z.string().trim().min(5, "Description must be at least 5 characters"),
  cost: z.number().min(0).default(0),
  notes: z.string().trim().max(1000).optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type AssignAssetInput = z.infer<typeof assignAssetSchema>;
export type MaintenanceRecordInput = z.infer<typeof maintenanceRecordSchema>;
