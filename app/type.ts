import { z } from "zod";

export const authenSchema = z.object({
  email: z.string().email(),
  loading: z.boolean(),
  success: z.boolean(),
  fail: z.boolean(),
  name: z.string(),
  organization: z.string(),
  os: z.string(),
  pubIP: z.string(),
  browser: z.string(),
  faceStep: z.boolean(),
});

export type AuthenticatorSchema = z.infer<typeof authenSchema>;
