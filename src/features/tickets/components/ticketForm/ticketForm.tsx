'use client';
import {useActionState} from 'react';
import {Button} from '@/components/button';
import {Field} from '@/components/field';
import {upsertTicket} from '@/features/tickets/actions/upsert-ticket';

type TicketUpsertFormProps = {
  ticket?: {title: string; id: string};
};

const TicketForm = ({ticket}: TicketUpsertFormProps) => {
  const [actionState, action] = useActionState(upsertTicket.bind(null, ticket?.id), {
    message: '',
  });
  return (
    <form action={action} className={'flex flex-col gap-y-4'} noValidate={true}>
      <input type="hidden" name="ticketId" value={ticket?.id} />

      {actionState?.message && <div className="text-sm text-green-500">{actionState.message}</div>}
      <Field name="title" id="title" value="a" label="Title" />
      <Button>{ticket ? 'Update' : 'Create'}</Button>
    </form>
  );
};

export {TicketForm};
