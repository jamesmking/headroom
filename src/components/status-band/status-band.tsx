import clsx from 'clsx';
import styles from './status-band.module.scss';

type StatusBandProps = {
  /** Names the region for assistive technology, e.g. 'Right now'. */
  label: string;
  /** The headline block: a label, a large figure and a line of detail. */
  leading: React.ReactNode;
  /** The supporting block to its right. */
  trailing: React.ReactNode;
  /** Tints the figure to signal something time-critical. */
  alert?: boolean;
};

export const StatusBand = ({label, leading, trailing, alert}: StatusBandProps) => (
  <section className={clsx(styles.Band, alert && styles.Alert)} aria-label={label}>
    <div className={styles.Leading}>{leading}</div>
    <div className={styles.Trailing}>{trailing}</div>
  </section>
);

export {styles as bandStyles};
