import { Ticket } from "@/features/tickets/components/ticket";
import { getTickets } from "@/features/tickets/queries/get-tickets";

const List = async () => {
  const tickets = await getTickets();
  return (
    <div>
      {tickets.length === 0 && <div>No tickets found</div>}
      {tickets.map((ticket) => (
        <Ticket key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
};

export { List };
