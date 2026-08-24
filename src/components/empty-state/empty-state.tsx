import clsx from 'clsx';
import styles from './empty-state.module.scss';

type EmptyStateProps = {
  /** What is empty, stated plainly. */
  message: string;
  /** What to do about it. */
  hint?: string;
  action?: React.ReactNode;
  centred?: boolean;
};

export const EmptyState = ({message, hint, action, centred}: EmptyStateProps) => (
  <div className={clsx(styles.Empty, centred && styles.Centred)}>
    <p className={styles.Message}>{message}</p>
    {hint && <p>{hint}</p>}
    {action}
  </div>
);
