"use client";
import React, { useEffect, useState } from "react";
import { TaskForm, TaskList } from "@/app/components";
import { StatusType, TaskType, FormValues } from "@/app/types";
import { Main, Modal } from "@/app/ui";

const statuses: StatusType[] = [
  {
    id: "TODO",
    title: "To do",
  },
  {
    id: "DOING",
    title: "Doing",
  },
  {
    id: "DONE",
    title: "Done",
  },
];

const defaultTasks: TaskType[] = [
  {
    id: "1",
    title: "Sign and post the paperwork",
    description: "Description 1",
    lastUpdated: new Date(),
    status: "TODO",
  },
  {
    id: "2",
    title: "Write tests for all the new components",
    description: "Description 2",
    lastUpdated: new Date(),
    status: "DOING",
  },
  {
    id: "3",
    title: "Pay VAT bill",
    description: "Description 2",
    lastUpdated: new Date(),
    status: "DONE",
  },
  {
    id: "4",
    title: "Go for a run",
    description: "Description 1",
    lastUpdated: new Date(),
    status: "TODO",
  },
];

export default function Home() {
  const [tasks, setTasks] = useState<TaskType[]>(defaultTasks);
  const addTask = (task: FormValues) => {
    const newTask: TaskType = {
      ...task,
      id: (tasks.length + 1).toString(),
      lastUpdated: new Date(),
      status: "TODO",
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const updateTask = (task: FormValues) => {
    if ("status" in task) {
      const updatedTask: TaskType = {
        ...task,
        lastUpdated: new Date(),
      };
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      );
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

  useEffect(() => {
    console.log("Tasks", tasks);
  }, [tasks]);

  return (
    <Main>
      <Modal>
        <TaskForm formAction={addTask} />
      </Modal>
      <TaskList
        tasks={tasks}
        statuses={statuses}
        deleteTask={deleteTask}
        updateTask={updateTask}
      />
    </Main>
  );
}

export const revalidate = 0;
