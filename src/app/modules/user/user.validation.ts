import { z } from 'zod';

const createAdminZodSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }),
        email: z.string({ required_error: 'Email is required' }).email({ message: 'Invalid email address' }),
        password: z.string({ required_error: 'Password is required' }),
        role: z.string({ required_error: 'Role is required' })
    })
});

const createUserZodSchema = z.object({
    body: z.object({
        firstName: z.string({ required_error: 'First name is required' }),
        // lastName: z.string({ required_error: 'Last name is required' }),
        country: z.string({ required_error: 'countrey'}).optional(),
        phone : z.string({ required_error: 'Phone number is required' }),
        email: z.string({ required_error: 'Email is required' }).email({ message: 'Invalid email address' }),
        password: z.string({ required_error: 'Password is required' }),
        // gender: z.enum(["MAN", "WOMEN", "NON-BINARY", "TRANS MAN", "TRANS WOMAN"]).optional()

        // phoneNumber: z.string({ required_error: 'Phone number is required' }),
        // location: z.string({ required_error: 'Location is required' }),
    })
})










const updateUserZodSchema = z.object({
  body: z.object({
    firstName: z.string().optional(), // keep as is
    lastName: z.string().optional(),  // keep as is
    appId: z.string().optional(),     // keep as is

    role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]).optional().transform(val => val?.toLowerCase()),

    phoneNumber: z.string().optional(), // keep as is
    email: z.string().email({ message: "Invalid email address" }).optional().transform(val => val?.toLowerCase()),
    phone: z.string().optional(), // keep as is
    password: z.string().min(8, "Password must be at least 8 characters").optional(), // keep as is
    location: z.string().optional().transform(val => val?.toLowerCase()),
    profile: z.string().url().optional(), // keep as is
    documentVerified: z.array(z.string()).optional(), // keep as is
    photo: z.string().optional(), // keep as is

    emailVerified: z.boolean().optional(),
    phoneVerified: z.boolean().optional(),
    verified: z.boolean().optional(),

    accountInformation: z
      .object({
        status: z.boolean().optional(),
        stripeAccountId: z.string().optional(), // keep as is
        externalAccountId: z.string().optional(), // keep as is
        currency: z.string().optional(), // keep as is
      })
      .optional(),

    pages: z.array(z.string().transform(val => val.toLowerCase())).optional(),

    datingIntentions: z.string().optional().transform(val => val?.toLowerCase()),
    interestedIn: z.string().optional().transform(val => val?.toLowerCase()),
    languages: z.string().optional().transform(val => val?.toLowerCase()),

    age: z.number().min(18).max(100).optional(),

    height: z.number().min(30).max(250).optional(),
    minHeight: z.number().min(30).max(250).optional(),
    maxHeight: z.number().min(30).max(250).optional(),

    drinking: z.boolean().optional(),
    marijuana: z.boolean().optional(),
    smoking: z.boolean().optional(),
    balance: z.number().optional(),
    availableTime: z.number().optional(),
    gender: z.enum(["MAN", "WOMEN", "NON-BINARY", "TRANS MAN", "TRANS WOMAN"]).optional(),
    children: z.boolean().optional(),
    politics: z.string().optional().transform(val => val?.toLowerCase()),
    educationLevel: z.string().optional().transform(val => val?.toLowerCase()),
     ethnicity: z.enum([
    "Black / Africa Decent",
    "East Asia",
    "Hispanic/Latino",
    "Middle Eastern",
    "Native American",
    "Pacific Islander",
    "South Asian",
    "Southeast Asian",
    "White Caucasion",
    "Other",
    "Open to All",
    "Pisces",
  ]).optional(),
    zodiacPreference: z.string().optional().transform(val => val?.toLowerCase()),
  }),
});

export const UserValidation = { 
  createAdminZodSchema,
  createUserZodSchema,
  updateUserZodSchema
};









// const updateUserZodSchema = z.object({
//   body: z.object({
//     firstName: z.string().optional(),
//     lastName: z.string().optional(),
//     appId: z.string().optional(),
//     role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]).optional(),

//     phoneNumber: z.string().optional(),
//     email: z.string().email({ message: "Invalid email address" }).optional(),
//     phone: z.string().optional(),
//     password: z.string().min(8, "Password must be at least 8 characters").optional(),
//     location: z.string().optional(),
//     profile: z.string().url().optional(),
//     documentVerified: z.array(z.string()).optional(),
//     photo: z.string().optional(),

//     emailVerified: z.boolean().optional(),
//     phoneVerified: z.boolean().optional(),
//     verified: z.boolean().optional(),

//     accountInformation: z
//       .object({
//         status: z.boolean().optional(),
//         stripeAccountId: z.string().optional(),
//         externalAccountId: z.string().optional(),
//         currency: z.string().optional(),
//       })
//       .optional(),

//     pages: z.array(z.string()).optional(),

//     // তোমার model এ এগুলো string, তাই array না করে string রেখেছি
//     datingIntentions: z.string().optional(),
//     interestedIn: z.string().optional(),
//     languages: z.string().optional(),

//     age: z.number().min(18).max(100).optional(),

//     height: z.number().min(30).max(250).optional(),
//     minHeight: z.number().min(30).max(250).optional(),
//     maxHeight: z.number().min(30).max(250).optional(),

//     drinking: z.boolean().optional(),
//     marijuana: z.boolean().optional(),
//     smoking: z.boolean().optional(),

//     gender: z.string().optional(),
//     children: z.boolean().optional(),
//     politics: z.string().optional(),
//     educationLevel: z.string().optional(),
//     ethnicity: z.string().optional(),
//     zodiacPreference: z.string().optional(),
//   }),
// });


// export const UserValidation = { 
//     createAdminZodSchema,
//     createUserZodSchema,
//     updateUserZodSchema
// };  
