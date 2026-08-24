'use client';

import clsx from 'clsx';
import {LoaderCircle} from 'lucide-react';
import {useFormStatus} from 'react-dom';
import styles from './button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'default' | 'small';
  block?: boolean;
  /** Show a spinner while the enclosing form is submitting. */
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
  pendingAware = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) => {
  const {pending} = useFormStatus();
  const busy = pendingAware && pending;

  return (
    <button
      {...props}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={clsx(
        VARIANTS[variant],
        size === 'small' && styles.Small,
        block && styles.Block,
        className
      )}
    >
      {busy && <LoaderCircle className={styles.Spinner} aria-hidden="true" />}
      {children}
    </button>
  );
};
