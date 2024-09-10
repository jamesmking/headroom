import { Task } from "@/app/components";
import { TaskType, ColumnType } from "@/app/types";
import styles from "./TaskList.module.scss";

interface TaskListProps {
  tasks: TaskType[];
  columns: ColumnType[];
}

export const TaskList = ({ tasks, columns }: TaskListProps) => {
  return (
    <div>
      <div className={styles.columnWrap}>
        {columns.map((column) => (
          <div key={column.id} className={styles.column}>
            <h2 className={styles.columnTitle}>{column.title}</h2>
          </div>
        ))}
      </div>

      {!tasks && <p>No tasks added yet</p>}

      {tasks && tasks.map((task) => <Task key={task.id} task={task} />)}
    </div>
  );
};
