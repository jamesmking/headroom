import styles from "./Task.module.scss";

export const Task = ({ task }) => {
  return (
    <div className={styles.task}>
      <div>{task.title}</div>
      <div>{task.description}</div>
    </div>
  );
};
