import clsx from 'clsx';
import {useId} from 'react';
import styles from './panel.module.scss';

type PanelProps = {
  title: string;
  /** Small dimmed value beside the title, e.g. a count. */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  /** Remove body padding, for panels that render their own list rows. */
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
};

export const Panel = ({title, meta, actions, flush, className, children}: PanelProps) => {
  const titleId = useId();

  return (
    // Labelled by the heading rather than a copy of it, so the title is
    // announced once instead of twice.
    <section className={clsx(styles.Panel, className)} aria-labelledby={titleId}>
      <header className={styles.Header}>
        <h2 className={styles.Title} id={titleId}>
          {title}
          {meta !== undefined && <span className={styles.Count}>{meta}</span>}
        </h2>
        {actions && <div className={styles.Actions}>{actions}</div>}
      </header>
      <div className={clsx(styles.Body, flush && styles.Flush)}>{children}</div>
    </section>
  );
};
