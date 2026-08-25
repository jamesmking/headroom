import clsx from 'clsx';
import Link from 'next/link';
import styles from './button-link.module.scss';

type ButtonLinkProps = {
  href: string;
  variant?: 'primary' | 'secondary';
  className?: string;
  children: React.ReactNode;
};

/**
 * A link that looks like a button.
 *
 * Used where the action is a navigation rather than a mutation — "create a
 * role first" — so it stays a real anchor and keeps middle-click, open-in-new
 * -tab and the correct role for assistive technology.
 */
export const ButtonLink = ({href, variant = 'secondary', className, children}: ButtonLinkProps) => (
  <Link
    href={href}
    className={clsx(variant === 'primary' ? styles.Primary : styles.Secondary, className)}
  >
    {children}
  </Link>
);
