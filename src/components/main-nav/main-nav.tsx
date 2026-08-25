'use client';

import clsx from 'clsx';
import {CalendarDays, ListChecks, Settings, Sun} from 'lucide-react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {settingsPath, tasksPath, todayPath, weekPath} from '@/routes';
import styles from './main-nav.module.scss';

/**
 * `match` exists because a section is no longer one path. Any date under
 * /day belongs to Today, and any week under /week belongs to Week, so the
 * highlight stays put while you page through dates.
 */
const LINKS = [
  {
    href: todayPath(),
    label: 'Today',
    Icon: Sun,
    match: (pathname: string) => pathname === todayPath() || pathname.startsWith('/day'),
  },
  {href: weekPath(), label: 'Week', Icon: CalendarDays, match: undefined},
  {href: tasksPath(), label: 'Tasks', Icon: ListChecks, match: undefined},
  {href: settingsPath(), label: 'Settings', Icon: Settings, match: undefined},
];

export const MainNav = () => {
  const pathname = usePathname();

  return (
    <nav className={styles.Nav} aria-label="Main">
      {LINKS.map(({href, label, Icon, match}) => {
        const active = match ? match(pathname) : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(styles.Link, active && styles.Active)}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className={styles.Icon} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};
