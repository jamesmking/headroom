import {notFound} from 'next/navigation';
import {getTicket} from '@/features/tickets/queries/get-ticket';

type TicketEditPageProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

const TicketEditPage = async ({params}: TicketEditPageProps) => {
  const {ticketId} = await params;
  const ticket = await getTicket(ticketId);

  if (!ticket) {
    notFound();
  }

  return <div>{ticket.title}</div>;
};

export default TicketEditPage;
