import {signOutAction} from '@/features/auth/actions/sign-out-action';
import {avatarBackground} from '@/features/auth/avatar-url';
import type {CurrentUser} from '@/features/auth/queries/get-current-user';
import {SignOutButton} from './sign-out-button';
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

export const AccountMenu = ({user}: {user: CurrentUser}) => {
  const background = avatarBackground(user.image);

  return (
    <div className={styles.Account}>
      <div className={styles.Identity}>
        {user.name && <span className={styles.Name}>{user.name}</span>}
        {user.email && <span className={styles.Email}>{user.email}</span>}
      </div>

      {/*
        The photo is painted over the initials as a background rather than as
        an <img>. A broken <img> draws the browser's own placeholder icon on
        top of them, which is exactly the case worth handling well — a
        provider's photo URL can expire or be revoked. A background that fails
        to load paints nothing at all, so the initials simply remain, with no
        client-side error handling and no flash of a broken glyph.
      */}
      <span
        className={styles.Avatar}
        aria-hidden="true"
        style={background ? ({'--avatar-image': background} as React.CSSProperties) : undefined}
      >
        {initials(user)}
      </span>

      <form action={signOutAction}>
        <SignOutButton />
      </form>
    </div>
  );
};
