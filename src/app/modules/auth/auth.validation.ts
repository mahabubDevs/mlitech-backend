import { z } from 'zod';

const createVerifyEmailZodSchema = z.object({
    body: z.object({
        email: z.string({ required_error: 'Email is required' }).email({ message: 'Invalid email address' }),
        oneTimeCode: z.number({ required_error: 'One time code is required' })
    })
});

const createLoginZodSchema = z.object({
  body: z.object({
    identifier: z
      .string({ required_error: 'Email or phone is required' })
      .refine((val) => {
        // check if it looks like email or phone
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{6,15}$/; // adjust length if needed
        return emailRegex.test(val) || phoneRegex.test(val);
      }, { message: "Must be a valid email or phone number" }),
    password: z.string({ required_error: 'Password is required' })
  })
});
  
const createForgetPasswordZodSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone number is required' })
      .refine((val) => {
        const phoneRegex = /^[0-9]{6,15}$/; // adjust length as needed
        return phoneRegex.test(val);
      }, { message: "Invalid phone number" })
  })
});
  
const createResetPasswordZodSchema = z.object({
    body: z.object({
        newPassword: z.string({ required_error: 'Password is required' }),
        confirmPassword: z.string({
            required_error: 'Confirm Password is required',
        })
    })
});
  
const createChangePasswordZodSchema = z.object({
    body: z.object({
        currentPassword: z.string({
            required_error: 'Current Password is required',
        }),
        newPassword: z.string({ required_error: 'New Password is required' }),
        confirmPassword: z.string({
            required_error: 'Confirm Password is required',
        })
    })
});

const createVerifyPhoneZodSchema = z.object({
    body: z.object({
        phone: z.string({ required_error: 'Phone number is required' }),
        oneTimeCode: z.number({ required_error: 'One time code is required' })
    })
});

export const AuthValidation = {
    createVerifyEmailZodSchema,
    createForgetPasswordZodSchema,
    createLoginZodSchema,
    createResetPasswordZodSchema,
    createChangePasswordZodSchema,
    createVerifyPhoneZodSchema
};