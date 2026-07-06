import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z
    .string({ error: 'Organization name is required.' })
    .trim()
    .min(2, { message: 'Organization name is required.' })
    .max(120, {
      message: 'Organization name must be 120 characters or less.',
    }),
  organizationType: z
    .string({ error: 'Please select an organization type.' })
    .trim()
    .min(2, { message: 'Please select an organization type.' })
    .max(80, {
      message: 'Organization type must be 80 characters or less.',
    }),
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
  state: z
    .string({ error: 'Please select a state.' })
    .trim()
    .min(2, { message: 'Please select a state.' })
    .max(100, { message: 'State must be 100 characters or less.' }),
  city: z
    .string({ error: 'Please enter a city.' })
    .trim()
    .min(2, { message: 'Please enter a city.' })
    .max(100, { message: 'City must be 100 characters or less.' })
    .optional(),
  area: z
    .string({ error: 'Please enter a valid area.' })
    .trim()
    .min(2, { message: 'Please enter a valid area.' })
    .max(100, { message: 'Area must be 100 characters or less.' })
    .optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;
