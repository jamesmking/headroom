import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {DevSignIn} from '@/features/auth/components/dev-sign-in';
import {isDevLoginEnabled} from '@/features/auth/dev-login';
import {signInWithGoogleAction} from '@/features/auth/actions/sign-in-action';
import {getCurrentUser} from '@/features/auth/queries/get-current-user';
import {todayPath} from '@/routes';
import styles from './page.module.scss';

export const metadata: Metadata = {title: 'Sign in'};

/**
 * Auth.js appends `?error=` when a sign-in attempt fails. `AccessDenied` is the
 * code returned when the allow-list rejects an otherwise valid Google account.
 */
const ERROR_MESSAGES: Record<string, {title: string; detail: string}> = {
  AccessDenied: {
    title: 'That account cannot be used',
    detail:
      'You signed in to Google successfully, but this email address is not on the allow-list for this installation.',
  },
  Configuration: {
    title: 'Sign-in is not configured',
    detail:
      'The Google OAuth credentials are missing or invalid. Check AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.',
  },
  Verification: {
    title: 'That sign-in link has expired',
    detail: 'Start again to get a new one.',
  },
};

const DEFAULT_ERROR = {
  title: 'Sign-in did not complete',
  detail: 'Something went wrong on the way back from Google. Try again.',
};

const SignInPage = async ({searchParams}: {searchParams: Promise<{error?: string}>}) => {
  if (await getCurrentUser()) redirect(todayPath());

  const {error} = await searchParams;
  const message = error ? (ERROR_MESSAGES[error] ?? DEFAULT_ERROR) : null;

  return (
    <div className={styles.Screen}>
      <main className={styles.Card}>
        <div className={styles.Brand}>
          <h1 className={styles.Wordmark}>headroom</h1>
          <span className={styles.Bracket} aria-hidden="true">
            []
          </span>
        </div>

        <p className={styles.Lede}>
          Your meetings, availability and tasks across every team, on one screen.
        </p>

        {message && (
          <div className={styles.Error} role="alert">
            <strong className={styles.ErrorTitle}>{message.title}</strong>
            {message.detail}
          </div>
        )}

        <form action={signInWithGoogleAction}>
          <button type="submit" className={styles.Submit}>
            <svg className={styles.Icon} viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#fff"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
              />
              <path
                fill="#fff"
                fillOpacity=".85"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
              />
              <path
                fill="#fff"
                fillOpacity=".7"
                d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
              />
              <path
                fill="#fff"
                fillOpacity=".55"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
              />
            </svg>
            Sign in with Google
          </button>
        </form>

        <p className={styles.Note}>
          Google is used for sign-in only. Headroom never reads your Google calendar, mail or files.
        </p>

        {isDevLoginEnabled() && <DevSignIn />}
      </main>
    </div>
  );
};

export default SignInPage;
