import { z } from 'zod';
import { EventCategory } from './event.types';

export const eventCategories = [
  'Religious',
  'Social',
  'Community',
  'Educational',
  'Meeting',
  'Personal',
  'Other',
] as const satisfies readonly EventCategory[];

const optionalText = (max: number, message: string) =>
  z.string({ error: message }).trim().max(max, { message }).optional();

const eventFieldsSchema = z.object({
  title: z
    .string({ error: 'Event title is required.' })
    .trim()
    .min(1, { message: 'Event title is required.' })
    .max(150, { message: 'Event title must be 150 characters or less.' }),
  description: optionalText(
    1000,
    'Description must be 1000 characters or less.',
  ),
  category: z
    .enum(eventCategories, {
      error: 'Please select a valid event category.',
    })
    .optional(),
  startDateTime: z
    .string({ error: 'Start date and time is required.' })
    .datetime({ message: 'Start date and time must be a valid ISO date.' }),
  endDateTime: z
    .string({ error: 'End date and time must be a valid ISO date.' })
    .datetime({ message: 'End date and time must be a valid ISO date.' })
    .optional(),
  location: optionalText(250, 'Location must be 250 characters or less.'),
  status: z
    .literal('Cancelled', {
      error: 'Only cancelled status can be stored explicitly.',
    })
    .optional(),
  notes: optionalText(1000, 'Notes must be 1000 characters or less.'),
});

function isEndAfterStart(data: {
  startDateTime?: string;
  endDateTime?: string;
}): boolean {
  if (!data.startDateTime || !data.endDateTime) {
    return true;
  }

  return (
    new Date(data.endDateTime).getTime() >=
    new Date(data.startDateTime).getTime()
  );
}

export const createEventSchema = eventFieldsSchema.refine(isEndAfterStart, {
  message: 'End date and time must be after the start date and time.',
  path: ['endDateTime'],
});

export const updateEventSchema = eventFieldsSchema
  .extend({
    status: z
      .literal('Cancelled', {
        error: 'Only cancelled status can be stored explicitly.',
      })
      .nullable()
      .optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required.',
  })
  .refine(isEndAfterStart, {
    message: 'End date and time must be after the start date and time.',
    path: ['endDateTime'],
  });

export const listEventsQuerySchema = z.object({
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

export type CreateEventDto = z.infer<typeof createEventSchema>;
export type UpdateEventDto = z.infer<typeof updateEventSchema>;
export type ListEventsQueryDto = z.infer<typeof listEventsQuerySchema>;
