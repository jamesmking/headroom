"use client";
import { Field } from "@base-ui-components/react/field";
import { useActionState } from "react";
import { upsertTicket } from "@/features/tickets/actions/upsert-ticket";
import styles from "./form.module.scss";

type TicketUpsertFormProps = {
  ticket?: { title: string; id: string };
};

const Form = ({ ticket }: TicketUpsertFormProps) => {
  const [actionState, action] = useActionState(
    upsertTicket.bind(null, ticket?.id),
    {
      message: "",
    },
  );
  return (
    <form action={action} className={"flex flex-col gap-y-4"} noValidate={true}>
      <input type="hidden" name="ticketId" value={ticket?.id} />

      {actionState?.message && (
        <div className="text-sm text-green-500">{actionState.message}</div>
      )}

      <Field.Root className={styles.Field}>
        <Field.Label className={styles.Label}>Name</Field.Label>
        <Field.Control
          required
          placeholder="Required"
          className={styles.Input}
          id="title"
          name="title"
        />

        <Field.Error className={styles.Error} forceShow={!!actionState.message}>
          {actionState.message}
        </Field.Error>
      </Field.Root>

      <button type="submit">{ticket ? "Update" : "Create"}</button>
    </form>
  );
};

export { Form };
