'use client';

import {LogOut} from 'lucide-react';
import {FormButton} from '@/components/form-button';
import styles from './account-menu.module.scss';

/**
 * Signing out is the slowest thing in the application — a round trip, a
 * cleared session and then a fresh render of the sign-in page — so it is the
 * control that most needs to say it heard you.
 */
export const SignOutButton = () => (
  <FormButton className={styles.SignOut} spinner>
    <LogOut className={styles.Icon} aria-hidden="true" />
    <span>Sign out</span>
  </FormButton>
);
