'use server';

import {signOut} from '@/auth';
import {signInPath} from '@/routes';

export const signOutAction = async (): Promise<void> => {
  await signOut({redirectTo: signInPath()});
};
