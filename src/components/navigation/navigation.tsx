'use client';

import clsx from 'clsx';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {homePath, settingsPath, ticketsPath} from '@/routes';
import styles from './navigation.module.scss';

const Navigation = () => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const links = [
    {
      href: homePath(),
      label: 'Home',
    },
    {
      href: ticketsPath(),
      label: 'Tickets',
    },
    {
      href: settingsPath(),
      label: 'Settings',
    },
  ];

  return (
    <nav className={styles.Navigation}>
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={clsx(styles.Link, isActive(link.href) && styles.LinkActive)}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
};

export {Navigation};
