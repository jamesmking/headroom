'use server';

import {signIn} from '@/auth';
import {todayPath} from '@/routes';

export const signInWithGoogleAction = async (): Promise<void> => {
  await signIn('google', {redirectTo: todayPath()});
};
