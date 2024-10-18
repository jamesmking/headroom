"use client";
import styles from "./TaskFormEdit.module.scss";
import { Button, Fieldset, Input, Select, Textarea } from "@/app/ui";
import React, { useEffect } from "react";

import { TaskType } from "@/app/types";
import { updateTask } from "@/app/lib/actions";
import { EMPTY_FORM_STATE } from "@/app/utils/taskForm";
import { useFormState } from "react-dom";

interface TaskFormEditProps {
  task: TaskType;
  callBack: (formData: FormData) => void;
}

export const TaskFormEdit = ({ task, callBack }: TaskFormEditProps) => {
  const [formState, action] = useFormState(updateTask, EMPTY_FORM_STATE);

  useEffect(() => {
    console.log(formState.status);
    if (formState.status === "SUCCESS" && callBack) {
      callBack(new FormData());
    }
  }, [formState.status, callBack]);

  return (
    <div className={styles.wrap}>
      <form action={action}>
        <Fieldset legend="Edit task">
          <p>{formState.message}</p>
          <input id="taskId" name="taskId" value={task.id} type="hidden" />
          <Input
            id="title"
            name="title"
            label="Title"
            value={task.title}
            error={formState.fieldErrors["title"]?.[0]}
          />
          <Textarea
            id="description"
            name="description"
            label="Description"
            value={task.description || ""}
            error={formState.fieldErrors["description"]?.[0]}
          />
          <Select
            options={[
              { value: "TODO", text: "To do" },
              { value: "DOING", text: "Doing" },
              { value: "DONE", text: "Done" },
            ]}
            value={task?.status}
            label="Status"
            id="status"
            name="status"
          />
          <Button testId={"update-task-button"}>Update task</Button>
        </Fieldset>
      </form>
    </div>
  );
};
