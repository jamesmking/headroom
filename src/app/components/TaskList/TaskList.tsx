import { Task } from "@/app/components";
import { TaskType, StatusType } from "@/app/types";
import styles from "./TaskList.module.scss";

interface TaskListProps {
  tasks: TaskType[] | undefined;
  statuses: StatusType[];
}

export const TaskList = ({ tasks, statuses }: TaskListProps) => {
  return (
    <div className={styles.wrap}>
      {statuses.map((status) => (
        <div
          key={status.id}
          className={`${styles.column} ${styles[`status-${status.id.toLowerCase()}`]}`}
        >
          <h2 className={styles.title}>{status.title}</h2>
          {tasks &&
            tasks
              .filter((task) => task.status === status.id)
              .map((task) => <Task key={task.id} task={task} />)}
          {!tasks ||
            (tasks.filter((task) => task.status === status.id).length === 0 && (
              <span className={styles.empty}>
                There are no tasks in the {status.title} column
              </span>
            ))}
        </div>
      ))}
    </div>
  );
};
