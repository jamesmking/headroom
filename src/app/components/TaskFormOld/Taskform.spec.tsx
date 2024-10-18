import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TaskForm } from "./TaskForm";
import { TaskType } from "@/app/types";

describe("TaskForm component", () => {
  const mockFormAction = jest.fn();
  const mockCallback = jest.fn();

  const defaultProps = {
    formAction: mockFormAction,
    callback: mockCallback,
  };

  const task: TaskType = {
    id: "1",
    title: "Sample Task",
    description: "Sample Description",
    status: "TODO",
    lastUpdated: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders form with default values", () => {
    render(<TaskForm {...defaultProps} />);
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Description")).toHaveValue("");
  });

  test("renders form with task values in edit mode", () => {
    render(<TaskForm {...defaultProps} mode="edit" task={task} />);
    expect(screen.getByLabelText("Title")).toHaveValue("Sample Task");
    expect(screen.getByLabelText("Description")).toHaveValue(
      "Sample Description",
    );
    expect(screen.getByLabelText("Status")).toHaveValue("TODO");
  });

  test("calls formAction with form values on submit", () => {
    render(<TaskForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "New Task" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "New Description" },
    });
    fireEvent.click(screen.getByText("Add task"));
    expect(mockFormAction).toHaveBeenCalledWith({
      title: "New Task",
      description: "New Description",
    });
  });

  test("displays validation errors for empty fields", () => {
    render(<TaskForm {...defaultProps} />);
    fireEvent.click(screen.getByText("Add task"));
    expect(screen.getByText("Title is required")).toBeInTheDocument();
  });

  test("displays validation error for description exceeding 500 characters", () => {
    render(<TaskForm {...defaultProps} />);
    const longDescription = "a".repeat(501);
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: longDescription },
    });
    fireEvent.click(screen.getByText("Add task"));
    expect(
      screen.getByText("Description should be below 500 characters"),
    ).toBeInTheDocument();
  });

  test("calls callback with undefined after form submission", () => {
    render(<TaskForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "New Task" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "New Description" },
    });
    fireEvent.click(screen.getByText("Add task"));
    expect(mockCallback).toHaveBeenCalledWith(undefined);
  });
});
