"use client";
import styles from "./TaskFormAdd.module.scss";
import { Button, Fieldset, Input, Textarea } from "@/app/ui";
import React from "react";
import { useFormStatus, useFormState } from "react-dom";
import { createTask } from "@/app/lib/actions";
import { EMPTY_FORM_STATE } from "@/app/utils/taskForm";
import { useFormReset } from "@/app/utils/resetForm";

type SubmitButtonProps = {
  label: string;
  loading: React.ReactNode;
};

const SubmitButton = ({ label, loading }: SubmitButtonProps) => {
  const { pending } = useFormStatus();
  return (
    <Button testId={"add-task-button"}>{pending ? loading : label}</Button>
  );
};

export const TaskFormAdd = () => {
  const [formState, action] = useFormState(createTask, EMPTY_FORM_STATE);
  const formRef = useFormReset(formState);
  return (
    <div className={styles.wrap}>
      <form action={action} ref={formRef}>
        <Fieldset legend="Add a new task">
          <Input
            id="title"
            name="title"
            label="Title"
            error={formState.fieldErrors["title"]?.[0]}
          />
          <Textarea
            id="description"
            name="description"
            label="Description"
            error={formState.fieldErrors["description"]?.[0]}
          />
          <SubmitButton label="Add task" loading="Adding..." />
        </Fieldset>
      </form>
    </div>
  );
};
