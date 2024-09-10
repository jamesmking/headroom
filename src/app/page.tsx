"use client";
import React, { useState } from "react";
import styles from "./page.module.scss";
import { AddTaskForm, TaskList } from "@/app/components";
import { ColumnType, TaskType } from "@/app/types";

const columns: ColumnType[] = [
  {
    id: "1",
    title: "To do",
  },
  {
    id: "2",
    title: "Doing",
  },
  {
    id: "3",
    title: "Done",
  },
];

const defaultTasks: TaskType[] = [
  {
    id: "1",
    title: "Task 1",
    description: "Description 1",
    completed: false,
    lastUpdated: new Date(),
  },
  {
    id: "2",
    title: "Task 2",
    description: "Description 2",
    completed: true,
    lastUpdated: new Date(),
  },
];

export default function Home() {
  const [tasks, setTasks] = useState<TaskType[]>(defaultTasks);
  const addTask = (task: TaskType) => {
    const newTask = {
      ...task,
      id: (tasks.length + 1).toString(),
      lastUpdated: new Date(),
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  return (
    <main className={styles.main}>
      <AddTaskForm addTask={addTask} />
      <TaskList tasks={tasks} columns={columns} />
    </main>
  );
}
