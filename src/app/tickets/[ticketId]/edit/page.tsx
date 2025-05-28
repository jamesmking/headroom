import {notFound} from 'next/navigation';
import {getTicket} from '@/features/tickets/queries/get-ticket';
import styles from './page.module.scss';
import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: `Headroom - Ticket - Edit`,
};

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

  return <div className={styles.Page}>{ticket.title}</div>;
};

export default TicketEditPage;
