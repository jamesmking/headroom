import type {Metadata} from 'next';
import {TicketForm} from '@/features/tickets/components/ticketForm';
import {TicketList} from '@/features/tickets/components/ticketList';

export const metadata: Metadata = {
  title: 'Headroom | Tickets',
};

const Tickets = () => {
  return (
    <>
      <TicketForm />
      <TicketList />
    </>
  );
};

export default Tickets;
