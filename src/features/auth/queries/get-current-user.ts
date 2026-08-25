import 'server-only';

import {redirect} from 'next/navigation';
import {cache} from 'react';
import {auth} from '@/auth';
import {signInPath} from '@/routes';

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

/** Memoised per request: the layout, the route and the view all ask for it. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };
});

/**
 * Every Server Component and Server Action that touches user data starts here.
 * It guarantees a user id is available so queries can always scope by owner.
 */
export const requireUser = async (): Promise<CurrentUser> => {
  const user = await getCurrentUser();
  if (!user) redirect(signInPath());
  return user;
};

export const requireUserId = async (): Promise<string> => (await requireUser()).id;
