import clsx from 'clsx';
import styles from './time-text.module.scss';

/**
 * Every time, duration and countdown in the application renders through here,
 * which is what keeps times aligned in a single scannable column.
 */
export const TimeText = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <span className={clsx(styles.Time, className)}>{children}</span>;
