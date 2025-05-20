type TicketItemProps = {
  ticket: { title: string; id: string };
  isDetail?: boolean;
};

const TicketItem = ({ ticket }: TicketItemProps) => {
  return <div>{ticket.title}</div>;
};

export { TicketItem };
