import React, { useState, FormEvent, ChangeEvent } from "react";
import { Button, Fieldset, Input, Textarea } from "@/app/ui";

interface FormValues {
  title: string;
  description: string;
}

const defaultFormValues: FormValues = {
  title: "",
  description: "",
};

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
  return description.trim() === "" ? "Description is required" : "";
}

interface AddTaskFormProps {
  addTask: (task: FormValues) => void;
}

export const AddTaskForm = ({ addTask }: AddTaskFormProps) => {
  const [formValues, setFormValues] = useState<FormValues>(defaultFormValues);
  const [errors, setErrors] = useState<FormValues>(defaultFormValues);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newErrors = {
      title: validateTitle(formValues.title),
      description: validateDescription(formValues.description),
    };
    if (isNotEmpty(newErrors)) {
      setErrors(newErrors);
    } else {
      setErrors(defaultFormValues);
      setFormValues(defaultFormValues);
      addTask(formValues);
    }
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Fieldset legend="Add Task">
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
        <Button>Submit</Button>
      </Fieldset>
    </form>
  );
};
