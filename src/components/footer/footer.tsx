import styles from './footer.module.scss';
import Link from 'next/link';
import {creditsPath} from '@/routes';

const Footer = () => {
  return (
    <footer className={styles.Footer}>
      <span>&copy; James Michael King Ltd</span>
      <Link href={creditsPath()} className={styles.Link}>
        Credits
      </Link>
    </footer>
  );
};

export {Footer};
