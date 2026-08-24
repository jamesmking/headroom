import clsx from 'clsx';
import {useId} from 'react';
import styles from './field.module.scss';

type FieldProps = {
  label: string;
  /** Marks the field as optional in the label rather than marking required. */
  optional?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  /** Receives the ids to wire up label, hint and error associations. */
  children: (ids: {
    id: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => React.ReactNode;
};

/**
 * Wraps a single form control with its label, hint and error text, and wires
 * up the aria-describedby relationships so screen readers announce all three.
 */
export const Field = ({label, optional, hint, error, className, children}: FieldProps) => {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={clsx(styles.Field, className)}>
      <label className={styles.Label} htmlFor={id}>
        {label}
        {optional && <span className={styles.Optional}> (optional)</span>}
      </label>
      {children({id, describedBy, invalid: Boolean(error)})}
      {error && (
        <p className={styles.Error} id={errorId}>
          {error}
        </p>
      )}
      {hint && (
        <p className={styles.Hint} id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
};

export {styles as fieldStyles};
