import {TicketForm} from '@/features/tickets/components/ticketForm';
import {TicketList} from '@/features/tickets/components/ticketList';

const Tickets = () => {
  return (
    <div>
      <h1>Tickets</h1>
      <TicketForm />
      <TicketList />
    </div>
  );
};

export default Tickets;
