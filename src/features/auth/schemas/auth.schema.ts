import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Nywila iwe na herufi 8 au zaidi')
  .regex(/[A-Z]/, 'Weka herufi kubwa moja angalau')
  .regex(/[a-z]/, 'Weka herufi ndogo moja angalau')
  .regex(/[0-9]/, 'Weka namba moja angalau');

export const loginSchema = z.object({
  email: z.string().email('Barua pepe si sahihi'),
  password: z.string().min(1, 'Weka nywila'),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(3, 'Jina kamili linahitajika'),
    companyName: z.string().min(2, 'Jina la kampuni linahitajika'),
    email: z.string().email('Barua pepe si sahihi'),
    phone: z.string().min(9, 'Namba ya simu si sahihi'),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Nywila hazifanani',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Barua pepe si sahihi'),
});

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Nywila hazifanani',
    path: ['confirmPassword'],
  });

export const twoFactorSchema = z.object({
  code: z.string().length(6, 'Weka namba 6'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type TwoFactorInput = z.infer<typeof twoFactorSchema>;
