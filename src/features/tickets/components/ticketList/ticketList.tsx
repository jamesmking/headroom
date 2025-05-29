import {Placeholder} from '@/components/placeholder';
import {TicketCard} from '@/features/tickets/components/ticket';
import {getTickets} from '@/features/tickets/queries/get-tickets';
import styles from './ticketList.module.scss';

const TicketList = async () => {
  const tickets = await getTickets();
  return (
    <div className={styles.Page}>
      {tickets.length === 0 && <Placeholder label={'No tickets found'} />}
      {tickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
};

export {TicketList};
