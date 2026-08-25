import clsx from 'clsx';
import type {RoleSummary} from '@/features/calendar/types';
import styles from './role-badge.module.scss';

type RoleBadgeProps = {
  role: RoleSummary;
  /** Use a hollow marker for roles that are not the user's own, i.e. Family. */
  hollow?: boolean;
  /** Show the full role name rather than the short name. */
  long?: boolean;
};

export const RoleBadge = ({role, hollow = false, long = false}: RoleBadgeProps) => (
  <span className={styles.Badge}>
    <span
      className={clsx(styles.Dot, hollow && styles.Hollow)}
      style={{'--role-colour': role.colour} as React.CSSProperties}
      aria-hidden="true"
    />
    {long ? role.name : role.shortName}
  </span>
);
