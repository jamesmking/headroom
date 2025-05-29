'use client';
import {useActionState} from 'react';
import {Button} from '@/components/button';
import {Field} from '@/components/field';
import {upsertTicket} from '@/features/tickets/actions/upsert-ticket';
import styles from './ticketForm.module.scss';
import {Ticket} from '@/generated/prisma';
import {Select} from '@/components/select';
import {statusOptions} from '@/lib/constants';

type TicketUpsertFormProps = {
  ticket?: Ticket;
};

const TicketForm = ({ticket}: TicketUpsertFormProps) => {
  const [actionState, action] = useActionState(upsertTicket.bind(null, ticket?.id), {
    message: '',
  });
  return (
    <>
      <form action={action} className={styles.Form} noValidate={true}>
        <input type="hidden" name="ticketId" value={ticket?.id} />
        <Field
          name="title"
          id="title"
          label="Title"
          hideLabel={true}
          error={actionState.message}
          defaultValue={ticket?.title || ''}
        />
        <Field
          name="description"
          id="description"
          label="Description"
          hideLabel={true}
          error={actionState.message}
          defaultValue={ticket?.description || ''}
          render={<textarea rows={5} />}
        />
        <Select name={'status'} id={'status'} label={'Status'} options={statusOptions} />
        <Button>{ticket ? 'Update' : 'Add'} ticket</Button>
      </form>
    </>
  );
};

export {TicketForm};
