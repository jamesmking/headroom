import {AlertDialog} from '@base-ui-components/react/alert-dialog';
import {deleteTicket} from '@/features/tickets/actions/delete-ticket';
import styles from './ticket.module.scss';
import {TicketMenu} from '../ticketMenu';

type TicketProps = {
  ticket: {title: string; id: string};
  isDetail?: boolean;
};

const Ticket = ({ticket}: TicketProps) => {
  return (
    <div className={styles.Ticket}>
      <div className={styles.TicketTop}>
        <h3 className={styles.TicketTitle}>{ticket.title}</h3>
        <TicketMenu ticketId={ticket.id} />
      </div>
      {/*<div>*/}
      {/*  <AlertDialog.Root>*/}
      {/*    <AlertDialog.Trigger data-color="red" className={styles.Button}>*/}
      {/*      Delete ticket*/}
      {/*    </AlertDialog.Trigger>*/}
      {/*    <AlertDialog.Portal>*/}
      {/*      <AlertDialog.Backdrop className={styles.Backdrop} />*/}
      {/*      <AlertDialog.Popup className={styles.Popup}>*/}
      {/*        <AlertDialog.Title className={styles.Title}>*/}
      {/*          Are you sure you want to delete this ticket?*/}
      {/*        </AlertDialog.Title>*/}
      {/*        <form action={deleteTicket.bind(null, ticket.id)}>*/}
      {/*          <div className={styles.Actions}>*/}
      {/*            <AlertDialog.Close className={styles.Button}>No, cancel</AlertDialog.Close>*/}
      {/*            <button data-color="red" className={styles.Button}>*/}
      {/*              Yes, delete*/}
      {/*            </button>*/}
      {/*          </div>*/}
      {/*        </form>*/}
      {/*      </AlertDialog.Popup>*/}
      {/*    </AlertDialog.Portal>*/}
      {/*  </AlertDialog.Root>*/}
      {/*</div>*/}
    </div>
  );
};

export {Ticket};
