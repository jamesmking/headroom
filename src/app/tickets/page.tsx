import type {Metadata} from 'next';
import {TicketForm} from '@/features/tickets/components/ticketForm';
import {TicketList} from '@/features/tickets/components/ticketList';
import styles from './[ticketId]/page.module.scss';

console.log(styles);

export const metadata: Metadata = {
  title: 'Headroom | Tickets',
};

const Tickets = () => {
  return (
    <div className={styles.Anything}>
      <TicketForm />
      <TicketList />
    </div>
  );
};

export default Tickets;
