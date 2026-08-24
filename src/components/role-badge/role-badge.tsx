import clsx from 'clsx';
import type {RoleSummary} from '@/features/calendar/types';
import styles from './role-badge.module.scss';

type RoleBadgeProps = {
  role: RoleSummary | null;
  /** Rendered when there is no role, e.g. 'Family' or 'No role'. */
  fallbackLabel?: string;
  /** Use a hollow marker, for sources that are not one of the user's roles. */
  hollow?: boolean;
  /** Show the full role name rather than the short name. */
  long?: boolean;
};

export const RoleBadge = ({
  role,
  fallbackLabel = 'No role',
  hollow = false,
  long = false,
}: RoleBadgeProps) => (
  <span className={clsx(styles.Badge, !role && styles.Unassigned)}>
    <span
      className={clsx(styles.Dot, hollow && styles.Hollow)}
      style={role ? ({'--role-colour': role.colour} as React.CSSProperties) : undefined}
      aria-hidden="true"
    />
    {role ? (long ? role.name : role.shortName) : fallbackLabel}
  </span>
);
