'use client';

import clsx from 'clsx';
import {LoaderCircle} from 'lucide-react';
import {useSubmitState} from '@/lib/use-submit-state';
import styles from './form-button.module.scss';

type FormButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * Swap the content for a spinner while submitting, rather than only dimming.
   * Right for icon-only controls, where there is nothing else to show as busy.
   */
  spinner?: boolean;
};

/**
 * A submit button that knows when its own form is working.
 *
 * The bespoke controls — task status, the plan toggle, role reordering — are
 * styled by their own modules rather than by `Button`, but they are the ones
 * pressed most often and so most need to acknowledge a press. This keeps their
 * markup and classes exactly as they were and only adds the busy behaviour.
 *
 * It exists as a separate component because `useFormStatus` reads the form it
 * is rendered *inside*: a component that renders both the `<form>` and its
 * button sees no form at all.
 */
export const FormButton = ({
  spinner = false,
  className,
  children,
  disabled,
  onClick,
  ...props
}: FormButtonProps) => {
  const {busy, formPending, onPress} = useSubmitState();

  return (
    <button
      {...props}
      type="submit"
      className={clsx(className, busy && styles.Busy)}
      disabled={disabled || formPending}
      aria-busy={busy || undefined}
      onClick={event => {
        onPress();
        onClick?.(event);
      }}
    >
      {busy && spinner && <LoaderCircle className={styles.Spinner} aria-hidden="true" />}
      {/*
        The label is hidden, never removed. Several of these are icon buttons
        whose only accessible name lives in an `.sr-only` span inside children,
        so swapping the content out for a spinner left them announcing nothing
        at the exact moment they were doing something.
      */}
      <span className={busy && spinner ? styles.LabelHidden : styles.Label}>{children}</span>
    </button>
  );
};
