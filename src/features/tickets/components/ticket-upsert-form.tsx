"use client";
import { useActionState } from "react";
import { upsertTicket } from "@/features/tickets/actions/upsert-ticket";

type TicketUpsertFormProps = {
  ticket?: { title: string; id: string };
};

const TicketUpsertForm = ({ ticket }: TicketUpsertFormProps) => {
  const [actionState, action] = useActionState(
    upsertTicket.bind(null, ticket?.id),
    {
      message: "",
    },
  );
  return (
    <form action={action} className={"flex flex-col gap-y-4"}>
      <input type="hidden" name="ticketId" value={ticket?.id} />
      <label htmlFor="title">Title</label>
      <input
        type="text"
        id="title"
        name="title"
        defaultValue={
          (actionState.payload?.get("title") as string) ?? ticket?.title
        }
      />

      {actionState?.message && (
        <div className="text-sm text-green-500">{actionState.message}</div>
      )}

      <button type="submit">{ticket ? "Update" : "Create"}</button>
    </form>
  );
};

export { TicketUpsertForm };
