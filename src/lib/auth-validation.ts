import { z } from "zod"

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(255, "Email is too long")
    .email("Invalid email format")
    .regex(EMAIL_REGEX, "Invalid email format")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password is too long"),
})

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(255, "Email is too long")
    .email("Invalid email format")
    .regex(EMAIL_REGEX, "Invalid email format")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  username: z
    .string()
    .min(1, "Username is required")
    .max(50, "Username is too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .transform((v) => v.trim()),
  displayName: z
    .string()
    .max(100, "Display name is too long")
    .optional()
    .transform((v) => v?.trim() || undefined),
})

export const setPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(255, "Email is too long")
    .email("Invalid email format")
    .regex(EMAIL_REGEX, "Invalid email format")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password is too long"),
})

export const confirmEmailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(255, "Email is too long")
    .email("Invalid email format")
    .regex(EMAIL_REGEX, "Invalid email format")
    .transform((v) => v.toLowerCase().trim()),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type SetPasswordInput = z.infer<typeof setPasswordSchema>
export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>

export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/data:text\/html/gi, "")
    .replace(/[<>'"]/g, "")
    .trim()
}

export function validateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  console.error("[AUTH_VALIDATION] Validation failed:", result.error.flatten().fieldErrors)
  return { success: false, error: "Invalid input. Please check your details and try again." }
}
