import clsx from 'clsx';
import type {ActionResult} from '@/lib/action-result';
import styles from './form-message.module.scss';

/**
 * Renders the outcome of a Server Action. Errors are assertive so they are
 * announced immediately; successes are polite.
 */
export const FormMessage = ({result}: {result: ActionResult}) => {
  if (!result.message || result.status === 'idle') return null;

  const isError = result.status === 'error';

  return (
    <p
      className={clsx(styles.Message, isError ? styles.Error : styles.Success)}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      {result.message}
    </p>
  );
};

export const Notice = ({
  tone = 'warning',
  children,
}: {
  tone?: 'warning' | 'error' | 'success';
  children: React.ReactNode;
}) => (
  <p
    className={clsx(
      styles.Message,
      tone === 'error' && styles.Error,
      tone === 'success' && styles.Success,
      tone === 'warning' && styles.Warning
    )}
    role="status"
  >
    {children}
  </p>
);
