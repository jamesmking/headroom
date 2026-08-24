import Link from 'next/link';
import {AccountMenu} from '@/components/account-menu';
import {MainNav} from '@/components/main-nav';
import type {CurrentUser} from '@/features/auth/queries/get-current-user';
import {todayPath} from '@/routes';
import styles from './app-header.module.scss';

export const AppHeader = ({user}: {user: CurrentUser}) => (
  <header className={styles.Header}>
    <a href="#main" className={styles.SkipLink}>
      Skip to content
    </a>
    <div className={styles.Inner}>
      <Link href={todayPath()} className={styles.Brand}>
        <span className={styles.Wordmark}>headroom</span>
        <span className={styles.Bracket} aria-hidden="true">
          []
        </span>
      </Link>
      <div className={styles.Nav}>
        <MainNav />
      </div>
      <AccountMenu user={user} />
    </div>
  </header>
);
