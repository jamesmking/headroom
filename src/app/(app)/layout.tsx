import {AppHeader} from '@/components/app-header';
import {requireUser} from '@/features/auth/queries/get-current-user';
import styles from './layout.module.scss';

/**
 * Layout for every authenticated screen. `requireUser` is a second line of
 * defence behind the middleware: if a request ever reaches a page without a
 * session, it is redirected here rather than rendering with no owner.
 */
const AppLayout = async ({children}: {children: React.ReactNode}) => {
  const user = await requireUser();

  return (
    <>
      <AppHeader user={user} />
      <main className={styles.Main} id="main">
        {children}
      </main>
    </>
  );
};

export default AppLayout;
