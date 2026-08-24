import {LogOut} from 'lucide-react';
import {signOutAction} from '@/features/auth/actions/sign-out-action';
import type {CurrentUser} from '@/features/auth/queries/get-current-user';
import styles from './account-menu.module.scss';

const initials = (user: CurrentUser): string => {
  const source = user.name ?? user.email ?? '?';
  return source
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
};

export const AccountMenu = ({user}: {user: CurrentUser}) => (
  <div className={styles.Account}>
    <div className={styles.Identity}>
      {user.name && <span className={styles.Name}>{user.name}</span>}
      {user.email && <span className={styles.Email}>{user.email}</span>}
    </div>
    <span className={styles.Avatar} aria-hidden="true">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.Image} src={user.image} alt="" width={32} height={32} />
      ) : (
        initials(user)
      )}
    </span>
    <form action={signOutAction}>
      <button type="submit" className={styles.SignOut}>
        <LogOut className={styles.Icon} aria-hidden="true" />
        <span>Sign out</span>
      </button>
    </form>
  </div>
);
