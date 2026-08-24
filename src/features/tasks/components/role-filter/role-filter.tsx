import clsx from 'clsx';
import Link from 'next/link';
import type {RoleSummary} from '@/features/calendar/types';
import styles from './role-filter.module.scss';

type RoleFilterProps = {
  roles: RoleSummary[];
  /** Currently selected role id, or null for "All". */
  selected: string | null;
  /** Builds the href for a given role id. */
  hrefFor: (roleId: string | null) => string;
};

/** Links rather than buttons, so filters are shareable and work without JS. */
export const RoleFilter = ({roles, selected, hrefFor}: RoleFilterProps) => (
  <nav className={styles.Filter} aria-label="Filter by role">
    <span className={styles.Legend}>Role</span>
    <Link
      href={hrefFor(null)}
      className={clsx(styles.Chip, selected === null && styles.Active)}
      aria-current={selected === null ? 'true' : undefined}
    >
      All
    </Link>
    {roles.map(role => (
      <Link
        key={role.id}
        href={hrefFor(role.id)}
        className={clsx(styles.Chip, selected === role.id && styles.Active)}
        aria-current={selected === role.id ? 'true' : undefined}
      >
        <span
          className={styles.Dot}
          style={{'--role-colour': role.colour} as React.CSSProperties}
          aria-hidden="true"
        />
        {role.name}
      </Link>
    ))}
  </nav>
);
