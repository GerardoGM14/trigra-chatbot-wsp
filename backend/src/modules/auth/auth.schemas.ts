// Schemas Zod que validan payloads de /auth. Se reusan en tests futuros y para
// generar tipos TS (`z.infer`).
import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3, "Mínimo 3 caracteres"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Correo inválido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
