import { Task } from "@/app/components";
import { TaskType, StatusType, FormValues } from "@/app/types";
import styles from "./TaskList.module.scss";

interface TaskListProps {
  tasks: TaskType[];
  statuses: StatusType[];
  deleteTask: (id: string) => void;
  updateTask: (task: FormValues) => void;
}

export const TaskList = ({
  tasks,
  statuses,
  deleteTask,
  updateTask,
}: TaskListProps) => {
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
              .map((task) => (
                <Task
                  key={task.id}
                  task={task}
                  handleDelete={deleteTask}
                  updateTask={updateTask}
                />
              ))}
          {!tasks ||
            (tasks.filter((task) => task.status === status.id).length === 0 && (
              <span>Nothing to see here</span>
            ))}
        </div>
      ))}
    </div>
  );
};
