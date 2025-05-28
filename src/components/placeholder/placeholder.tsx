import styles from './placeholder.module.scss';

type PlaceholderProps = {
  label: string;
};

const Placeholder = ({label}: PlaceholderProps) => {
  return <div className={styles.Placeholder}>{label}</div>;
};

export {Placeholder};
