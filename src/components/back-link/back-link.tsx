import styles from './back-link.module.scss';
import Link from 'next/link';

type BackLinkProps = {
  href: string;
  label?: string;
};

const BackLink = ({href, label = 'Back'}: BackLinkProps) => {
  return (
    <Link href={href} className={styles.BackLink}>
      {label}
    </Link>
  );
};

export {BackLink};
