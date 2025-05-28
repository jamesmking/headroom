'use client';
import {useActionState} from 'react';
import {Button} from '@/components/button';
import {Collapse} from '@/components/collapse';
import {Field} from '@/components/field';
import {upsertTicket} from '@/features/tickets/actions/upsert-ticket';
import styles from './ticketForm.module.scss';

type TicketUpsertFormProps = {
  ticket?: {title: string; id: string};
};

const TicketForm = ({ticket}: TicketUpsertFormProps) => {
  const [actionState, action] = useActionState(upsertTicket.bind(null, ticket?.id), {
    message: '',
  });
  return (
    <>
      <Collapse title={'Add a new ticket'}>
        <form action={action} className={styles.Form} noValidate={true}>
          <input type="hidden" name="ticketId" value={ticket?.id} />
          <Field
            name="title"
            id="title"
            label="Title"
            hideLabel={true}
            error={actionState.message}
          />
          <Button>{ticket ? 'Update' : 'Add'} ticket</Button>
        </form>
      </Collapse>
    </>
  );
};

export {TicketForm};
