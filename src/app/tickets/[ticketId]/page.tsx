import styles from './page.module.scss';
import {notFound} from 'next/navigation';
import {TicketDetails} from '@/features/tickets/components/ticketDetails';
import {getTicket} from '@/features/tickets/queries/get-ticket';
import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: `Headroom - Ticket`,
};

type TicketViewPageProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

const TicketViewPage = async ({params}: TicketViewPageProps) => {
  const {ticketId} = await params;
  const ticket = await getTicket(ticketId);

  if (!ticket) {
    notFound();
  }

  return (
    <div className={styles.Page}>
      <TicketDetails ticket={ticket} />
    </div>
  );
};

export default TicketViewPage;
