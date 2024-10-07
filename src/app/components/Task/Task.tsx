import React, { useState } from "react";
import styles from "./Task.module.scss";
import { TaskType, FormValues } from "@/app/types";
import { TaskForm } from "@/app/components";

interface TaskProps {
  task: TaskType;
  handleDelete: (id: string) => void;
  updateTask: (task: FormValues) => void;
}

type TaskAction = "edit" | "delete" | undefined;

export const Task = ({ task, handleDelete, updateTask }: TaskProps) => {
  const [action, setAction] = useState<TaskAction>(undefined);
  const resetAction = () => setAction(undefined);
  return (
    <div
      className={`${styles.task} ${styles[`task-${task.status.toLowerCase()}`]}`}
    >
      {action === undefined && (
        <div>
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
        </div>
      )}

      {action === "edit" && (
        <div>
          <TaskForm
            mode="edit"
            task={task}
            formAction={updateTask}
            callback={resetAction}
          />
        </div>
      )}

      {action === "delete" && (
        <div>
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

            <button
              className={styles.button}
              onClick={() => setAction(undefined)}
            >
              No, cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
