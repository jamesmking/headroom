import styles from "./ticket.module.scss";

type TicketProps = {
  ticket: { title: string; id: string };
  isDetail?: boolean;
};

const Ticket = ({ ticket }: TicketProps) => {
  return <div className={styles.ticket}>{ticket.title}</div>;
};

export { Ticket };
