'use client';

import clsx from 'clsx';
import {CalendarDays, ListChecks, Settings, Sun} from 'lucide-react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {settingsPath, tasksPath, todayPath, weekPath} from '@/routes';
import styles from './main-nav.module.scss';

const LINKS = [
  {href: todayPath(), label: 'Today', Icon: Sun},
  {href: weekPath(), label: 'Week', Icon: CalendarDays},
  {href: tasksPath(), label: 'Tasks', Icon: ListChecks},
  {href: settingsPath(), label: 'Settings', Icon: Settings},
];

export const MainNav = () => {
  const pathname = usePathname();

  return (
    <nav className={styles.Nav} aria-label="Main">
      {LINKS.map(({href, label, Icon}) => {
        const active = href === todayPath() ? pathname === href : pathname.startsWith(href);
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
