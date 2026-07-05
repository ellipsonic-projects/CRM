import { z } from 'zod';

const personFieldsSchema = z.object({
  fullName: z
    .string({ error: 'Full name is required.' })
    .trim()
    .min(2, { message: 'Full name is required.' })
    .max(100, { message: 'Full name must be 100 characters or less.' }),

  phone: z
    .string({
      error: 'Please enter a valid 10-digit Indian mobile number.',
    })
    .regex(/^[6-9]\d{9}$/, {
      message: 'Please enter a valid 10-digit Indian mobile number.',
    })
    .optional(),
  email: z
    .string({ error: 'Please enter a valid email address.' })
    .email({ message: 'Please enter a valid email address.' })
    .optional(),

  gender: z.enum(['male', 'female', 'other'], {
    error: 'Please select a gender.',
  }),

  occupation: z
    .string({ error: 'Occupation must be 100 characters or less.' })
    .max(100, { message: 'Occupation must be 100 characters or less.' })
    .optional(),

  state: z
    .string({ error: 'Please select a state.' })
    .min(2, { message: 'Please select a state.' }),

  city: z.string({ error: 'Please enter a city.' }).optional(),

  area: z.string({ error: 'Please enter a valid area.' }).optional(),

  notes: z
    .string({ error: 'Notes must be 1000 characters or less.' })
    .max(1000, { message: 'Notes must be 1000 characters or less.' })
    .optional(),

  profilePicture: z
    .string({ error: 'Please enter a valid profile picture URL.' })
    .url({ message: 'Please enter a valid profile picture URL.' })
    .optional(),

  hasLogin: z.boolean().default(false),
});

export const createPersonSchema = z
  .object(personFieldsSchema.shape)
  .refine((data) => data.phone || data.email, {
    message: 'Either phone or email is required.',
    path: ['phone'],
  });

export const updatePersonSchema = personFieldsSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required.',
  });

export const listPeopleQuerySchema = z.object({
  page: z.coerce
    .number({ error: 'Page must be a number.' })
    .int({ message: 'Page must be a whole number.' })
    .positive({ message: 'Page must be greater than zero.' })
    .default(1),
  limit: z.coerce
    .number({ error: 'Limit must be a number.' })
    .int({ message: 'Limit must be a whole number.' })
    .positive({ message: 'Limit must be greater than zero.' })
    .max(100, { message: 'Limit cannot be greater than 100.' })
    .default(20),
});

export type CreatePersonDto = z.infer<typeof createPersonSchema>;
export type UpdatePersonDto = z.infer<typeof updatePersonSchema>;
export type ListPeopleQueryDto = z.infer<typeof listPeopleQuerySchema>;
