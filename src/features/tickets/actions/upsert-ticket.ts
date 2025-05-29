'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {ticketsPath} from '@/routes';

const upsertTicketSchema = z.object({
  title: z.string().min(1, {message: 'Title is required'}),
  description: z.string().optional(),
  status: z.enum(['BACKLOG', 'TODO', 'DOING', 'DONE', 'ARCHIVED'], {
    errorMap: () => ({message: 'Invalid status'}),
  }),
});

export const upsertTicket = async (
  id: string | undefined,
  _actionState: {
    message: string;
    payload?: FormData;
  },
  formData: FormData
) => {
  try {
    const data = upsertTicketSchema.parse({
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      status: formData.get('status') || 'BACKLOG',
    });

    await prisma.ticket.upsert({
      where: {
        id: id || '',
      },
      update: data,
      create: data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {message: error.issues[0].message, payload: formData};
    }
    console.error('Error upserting ticket:', error);
    return {message: 'Something went wrong', payload: formData};
  }

  revalidatePath(ticketsPath());
  // if (id) {
  //   redirect(ticketPath(id));
  // }
  return {message: 'Ticket created'};
};
