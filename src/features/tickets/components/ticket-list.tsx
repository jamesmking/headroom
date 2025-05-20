import { TicketItem } from "@/features/tickets/components/ticket-item";
import { getTickets } from "@/features/tickets/queries/get-tickets";

const TicketList = async () => {
  const tickets = await getTickets();
  return (
    <div>
      {tickets.length === 0 && <div>No tickets found</div>}
      {tickets.map((ticket) => (
        <TicketItem key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
};

export { TicketList };
