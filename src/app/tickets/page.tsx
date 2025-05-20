import { TicketList } from "@/features/tickets/components/ticket-list";
import { TicketUpsertForm } from "@/features/tickets/components/ticket-upsert-form";

const Tickets = () => {
  return (
    <div>
      <h1>Tickets</h1>
      <TicketUpsertForm />
      <TicketList />
    </div>
  );
};

export default Tickets;
