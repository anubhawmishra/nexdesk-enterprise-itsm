import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid corporate email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
