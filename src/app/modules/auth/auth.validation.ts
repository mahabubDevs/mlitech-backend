import { z ,AnyZodObject  } from 'zod';

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
  

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const createResetPasswordZodSchema = z
  .object({
    body: z.object({
      newPassword: z
        .string({ required_error: 'Password is required' })
        .regex(
          passwordRegex,
          'Password must be at least 8 characters, include uppercase, lowercase, number, and special character'
        ),
      confirmPassword: z.string({ required_error: 'Confirm Password is required' }),
    }),
  })
  .refine((data) => data.body.newPassword === data.body.confirmPassword, {
    message: "New password and confirm password must match",
    path: ["body", "confirmPassword"],
  }) as unknown as AnyZodObject;
  
const createChangePasswordZodSchema = z
  .object({
    body: z.object({
      currentPassword: z.string({
        required_error: 'Current Password is required',
      }),
      newPassword: z
        .string({ required_error: 'New Password is required' })
        .regex(
          passwordRegex,
          'Password must be at least 8 characters, include uppercase, lowercase, number, and special character'
        ),
      confirmPassword: z.string({
        required_error: 'Confirm Password is required',
      }),
    }),
  })
  .refine((data) => data.body.newPassword === data.body.confirmPassword, {
    message: "New password and confirm password must match",
    path: ["body", "confirmPassword"],
  }) as unknown as AnyZodObject;
 
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