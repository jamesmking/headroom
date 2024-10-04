import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TaskList } from "./TaskList";
import { TaskType, StatusType } from "@/app/types";

describe("TaskList component", () => {
  const mockDeleteTask = jest.fn();
  const mockUpdateTask = jest.fn();

  const tasks: TaskType[] = [
    {
      id: "1",
      title: "Task 1",
      description: "Description 1",
      status: "TODO",
      lastUpdated: new Date(),
    },
    {
      id: "2",
      title: "Task 2",
      description: "Description 2",
      status: "DOING",
      lastUpdated: new Date(),
    },
  ];

  const statuses: StatusType[] = [
    { id: "TODO", title: "To Do" },
    { id: "DOING", title: "Doing" },
    { id: "DONE", title: "Done" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders task columns based on statuses", () => {
    render(
      <TaskList
        tasks={tasks}
        statuses={statuses}
        deleteTask={mockDeleteTask}
        updateTask={mockUpdateTask}
      />,
    );
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("Doing")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  test("calls deleteTask when delete button is clicked and confirm link is clicked", () => {
    render(
      <TaskList
        tasks={tasks}
        statuses={statuses}
        deleteTask={mockDeleteTask}
        updateTask={mockUpdateTask}
      />,
    );

    fireEvent.click(screen.getByTestId("delete-task-1"));
    fireEvent.click(screen.getByTestId("confirm-delete-task-1"));
    expect(mockDeleteTask).toHaveBeenCalledWith("1");
  });

  test("calls updateTask when task is updated", () => {
    render(
      <TaskList
        tasks={tasks}
        statuses={statuses}
        deleteTask={mockDeleteTask}
        updateTask={mockUpdateTask}
      />,
    );
    fireEvent.click(screen.getByTestId("edit-task-1"));
    fireEvent.click(screen.getByTestId("update-task-1-button"));
    expect(mockUpdateTask).toHaveBeenCalledWith(tasks[0]);
  });

  test("renders no tasks message when there are no tasks", () => {
    render(
      <TaskList
        tasks={[]}
        statuses={statuses}
        deleteTask={mockDeleteTask}
        updateTask={mockUpdateTask}
      />,
    );
    expect(screen.getAllByText("Nothing to see here"));
  });
});
