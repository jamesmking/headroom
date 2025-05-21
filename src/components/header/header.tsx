import {Navigation} from '@/components/navigation';
import styles from './header.module.scss';

const Header = () => {
  return (
    <header className={styles.Header}>
      <h1 className={styles.Brand}>Head Room</h1>
      <Navigation />
    </header>
  );
};

export {Header};
