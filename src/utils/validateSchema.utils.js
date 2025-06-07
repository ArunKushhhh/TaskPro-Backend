import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(4, "Name must be atleast 4 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be atleast 8 characters long"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
});

const emailSchema = z.object({
  email: z.string().email("Email is required"),
});

export {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resetPasswordSchema,
  emailSchema,
};
