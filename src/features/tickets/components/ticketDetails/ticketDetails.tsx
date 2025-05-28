import {AlertDialog} from '@base-ui-components/react/alert-dialog';
import {deleteTicket} from '@/features/tickets/actions/delete-ticket';
import styles from './ticketDetails.module.scss';
import {Ticket} from '@/generated/prisma';
import {format} from 'date-fns';
import {dateFormatWithTime} from '@/lib/constants';
import {TicketMenu} from '@/features/tickets/components/ticketMenu';
import {BackLink} from '@/components/back-link';
import {ticketsPath} from '@/routes';

type TicketDetailsProps = {
  ticket: Ticket;
};

const TicketDetails = ({ticket}: TicketDetailsProps) => {
  return (
    <>
      <div className={styles.Ticket}>
        <BackLink href={ticketsPath()} />
        <div className={styles.TicketTop}>
          <h1 className={styles.Title}>{ticket.title}</h1>
          <TicketMenu ticketId={ticket.id} />
        </div>
        <section className={styles.Meta}>
          <p>Created: {format(ticket.createdAt, dateFormatWithTime)}</p>
          <p>Updated: {format(ticket.updatedAt, dateFormatWithTime)}</p>
        </section>
        <div>
          <AlertDialog.Root>
            <AlertDialog.Trigger data-color="red" className={styles.DeleteButton}>
              Delete ticket
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Backdrop className={styles.Backdrop} />
              <AlertDialog.Popup className={styles.Popup}>
                <AlertDialog.Title className={styles.Title}>
                  Are you sure you want to delete this ticket?
                </AlertDialog.Title>
                <form action={deleteTicket.bind(null, ticket.id)}>
                  <div className={styles.Actions}>
                    <AlertDialog.Close className={styles.Button}>No, cancel</AlertDialog.Close>
                    <button data-color="red" className={styles.DeleteButton}>
                      Yes, delete
                    </button>
                  </div>
                </form>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
      </div>
    </>
  );
};

export {TicketDetails};
