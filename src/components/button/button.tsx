'use client';

import clsx from 'clsx';
import {LoaderCircle} from 'lucide-react';
import {useSubmitState} from '@/lib/use-submit-state';
import styles from './button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'default' | 'small';
  block?: boolean;
  /**
   * Acknowledge a press while the enclosing form is submitting.
   *
   * Defaults to on for submit buttons: waiting without feedback is what makes
   * an application feel broken rather than busy, so it should have to be
   * switched off deliberately rather than remembered every time.
   */
  pendingAware?: boolean;
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: styles.Primary,
  secondary: styles.Secondary,
  ghost: styles.Ghost,
  danger: styles.Danger,
};

export const Button = ({
  variant = 'primary',
  size = 'default',
  block = false,
  pendingAware,
  className,
  children,
  disabled,
  type = 'button',
  onClick,
  ...props
}: ButtonProps) => {
  const {busy, formPending, onPress} = useSubmitState();

  const aware = pendingAware ?? type === 'submit';
  const showSpinner = aware && busy;
  // Every control in a working form is locked, not just the pressed one, so a
  // second action cannot be fired into a request that is already in flight.
  const locked = aware && formPending;

  return (
    <button
      {...props}
      type={type}
      disabled={disabled || locked}
      aria-busy={showSpinner || undefined}
      onClick={event => {
        onPress();
        onClick?.(event);
      }}
      className={clsx(
        VARIANTS[variant],
        size === 'small' && styles.Small,
        block && styles.Block,
        className
      )}
    >
      {showSpinner && <LoaderCircle className={styles.Spinner} aria-hidden="true" />}
      {children}
    </button>
  );
};
