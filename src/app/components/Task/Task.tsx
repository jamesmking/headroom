"use client";
import React, { useState } from "react";
import styles from "./Task.module.scss";
import { TaskType } from "@/app/types";
import { TaskFormEdit } from "@/app/components";
import { deleteTask } from "@/app/lib/actions";

interface TaskProps {
  task: TaskType;
}

type TaskAction = "edit" | "delete" | undefined;

export const Task = ({ task }: TaskProps) => {
  const [action, setAction] = useState<TaskAction>(undefined);
  const resetTaskCard = () => setAction(undefined);
  const handleDelete = async (id: string) => {
    await deleteTask(id);
  };

  return (
    <div
      className={`${styles.task} ${styles[`task-${task.status.toLowerCase()}`]}`}
    >
      {action === undefined && (
        <>
          <h3 className={styles.title}>{task.title}</h3>
          <p className={styles.description}>{task.description}</p>
          <hr className={styles.spacer} />
          <div className={styles.actions}>
            <button
              className={styles.button}
              onClick={() => setAction("edit")}
              data-testid={`edit-task-${task.id}`}
            >
              Edit<span className={styles.vh}> {task.title}</span>
            </button>
            <button
              className={styles.button}
              onClick={() => setAction("delete")}
              data-testid={`delete-task-${task.id}`}
            >
              Delete<span className={styles.vh}> {task.title}</span>
            </button>
          </div>
        </>
      )}

      {action === "edit" && (
        <TaskFormEdit task={task} callBack={resetTaskCard} />
      )}

      {action === "delete" && (
        <>
          <h3 className={styles.title}>
            Are you sure you want to delete this task?
          </h3>
          <hr className={styles.spacer} />
          <div className={styles.actions}>
            <button
              className={styles.button}
              onClick={() => handleDelete(task.id)}
              data-testid={`confirm-delete-task-${task.id}`}
            >
              Yes, delete
            </button>
            <button className={styles.button} onClick={resetTaskCard}>
              No, cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};
