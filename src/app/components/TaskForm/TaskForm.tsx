import React, { useState, useCallback, FormEvent, ChangeEvent } from "react";
import { Button, Fieldset, Input, Select, Textarea } from "@/app/ui";
import styles from "./TaskForm.module.scss";
import {
  FormValues,
  UpdateFormValues,
  AddFormValues,
  TaskType,
} from "@/app/types";

function isNotEmpty(obj: {
  title: string;
  description: string;
  [key: string]: string;
}): boolean {
  return Object.keys(obj).some((key) => obj[key]?.length > 0);
}

function validateTitle(title: string) {
  return title.trim() === "" ? "Title is required" : "";
}

function validateDescription(description: string) {
  return description.trim().length > 500
    ? "Description should be below 500 characters"
    : "";
}

interface TaskFormProps {
  mode?: "add" | "edit";
  task?: TaskType;
  formAction: (task: FormValues) => void;
  callback?: () => void;
}

export const TaskForm = ({
  mode = "add",
  task,
  formAction,
  callback,
}: TaskFormProps) => {
  const emptyFormValues: AddFormValues = {
    title: "",
    description: "",
  };

  const defaultFormValues = mode === "edit" && task ? task : emptyFormValues;

  const [formValues, setFormValues] = useState(defaultFormValues);
  const [errors, setErrors] = useState<AddFormValues | UpdateFormValues>(
    emptyFormValues,
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      console.log(formValues);
      event.preventDefault();
      const newErrors = {
        title: validateTitle(formValues.title),
        description: validateDescription(formValues.description || ""),
      };
      if (isNotEmpty(newErrors)) {
        setErrors(newErrors);
      } else {
        formAction(formValues);
        setErrors(emptyFormValues);
        setFormValues(emptyFormValues);
        if (callback) {
          callback();
        }
      }
    },
    [formValues, formAction, callback, emptyFormValues],
  );

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  }

  return (
    <div className={styles.wrap}>
      <form onSubmit={handleSubmit}>
        <Fieldset legend="Add a new task">
          <Input
            id="title"
            name="title"
            value={formValues.title}
            onChange={handleChange}
            label="Title"
            error={errors.title}
          />
          <Textarea
            id="description"
            name="description"
            value={formValues.description}
            onChange={handleChange}
            label="Description"
            error={errors.description}
          />
          {mode === "edit" && (
            <Select
              options={[
                {
                  value: "TODO",
                  text: "To do",
                },
                {
                  value: "DOING",
                  text: "Doing",
                },
                {
                  value: "DONE",
                  text: "Done",
                },
              ]}
              value={task?.status}
              label="Status"
              id="status"
              name="status"
              onChange={handleChange}
            />
          )}
          <Button
            testId={
              mode === "edit"
                ? `update-task-${"id" in formValues ? formValues.id : ""}-button`
                : "add-task-button"
            }
          >
            {mode === "edit" ? "Update" : "Add"} task
          </Button>
        </Fieldset>
      </form>
    </div>
  );
};
