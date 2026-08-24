import {signIn} from '@/auth';
import {Button} from '@/components/button';
import {fieldStyles} from '@/components/field';
import {env} from '@/lib/env';
import {todayPath} from '@/routes';
import styles from './dev-sign-in.module.scss';

/**
 * Development-only shortcut past Google. Rendered only when
 * `isDevLoginEnabled()` is true; see `src/features/auth/dev-login.ts`.
 */
export const DevSignIn = () => {
  const suggested = env.allowedEmails[0] ?? '';

  const devSignInAction = async (formData: FormData) => {
    'use server';
    await signIn('dev-login', {
      email: String(formData.get('email') ?? ''),
      redirectTo: todayPath(),
    });
  };

  return (
    <form action={devSignInAction} className={styles.Dev}>
      <span className={styles.Label}>Development sign-in</span>
      <p className={styles.Hint}>
        Only available locally, and only for addresses on the allow-list.
      </p>
      <div className={styles.Row}>
        <label className="sr-only" htmlFor="dev-email">
          Email address
        </label>
        <input
          id="dev-email"
          name="email"
          type="email"
          className={fieldStyles.Input}
          defaultValue={suggested}
          required
        />
        <Button type="submit" variant="secondary">
          Continue
        </Button>
      </div>
    </form>
  );
};
