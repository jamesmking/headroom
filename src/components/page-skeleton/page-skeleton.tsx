import styles from './page-skeleton.module.scss';

/**
 * What a screen looks like while its data is on its way.
 *
 * These exist for two reasons, and the second matters more. The obvious one is
 * that a navigation with no loading state freezes the page you are leaving,
 * which reads as broken rather than busy. The less obvious one is that Next
 * only prefetches a dynamic route as far as its nearest loading boundary — with
 * no boundary at all, `<Link>` prefetching does nothing, and every navigation
 * pays for a cold round trip. Adding these turns prefetching back on.
 *
 * The shapes deliberately match the real layouts closely enough that nothing
 * jumps when the content arrives.
 */

const Bar = ({width, height = '0.75rem'}: {width: string; height?: string}) => (
  <span className={styles.Bar} style={{width, height, display: 'block'}} />
);

const Masthead = () => (
  <div className={styles.Masthead}>
    <Bar width="4rem" height="0.6875rem" />
    <Bar width="14rem" height="1.375rem" />
    <div className={styles.Nav}>
      <Bar width="7rem" height="1.75rem" />
      <Bar width="4.5rem" height="1.75rem" />
      <Bar width="5.5rem" height="1.75rem" />
    </div>
  </div>
);

const Panel = ({rows}: {rows: number}) => (
  <div className={styles.Panel}>
    <Bar width="8rem" height="0.6875rem" />
    {Array.from({length: rows}, (_, index) => (
      <Bar key={index} width={index % 3 === 2 ? '65%' : '100%'} height="2.25rem" />
    ))}
  </div>
);

export const DaySkeleton = () => (
  <div className={styles.Page} aria-hidden="true">
    <Masthead />
    <div className={styles.Band} />
    <div className={styles.Columns}>
      <Panel rows={5} />
      <div className={styles.Side}>
        <Panel rows={3} />
        <Panel rows={2} />
      </div>
    </div>
  </div>
);

export const WeekSkeleton = () => (
  <div className={styles.Page} aria-hidden="true">
    <Masthead />
    <div className={styles.Week}>
      {Array.from({length: 7}, (_, index) => (
        <div key={index} className={styles.WeekDay}>
          <Bar width="3rem" height="0.6875rem" />
          <Bar width="1.5rem" height="1.125rem" />
          <Bar width="100%" height="2.5rem" />
          {index % 2 === 0 && <Bar width="100%" height="2.5rem" />}
        </div>
      ))}
    </div>
  </div>
);

export const BoardSkeleton = () => (
  <div className={styles.Page} aria-hidden="true">
    <Masthead />
    <div className={styles.Board}>
      <Panel rows={5} />
      <Panel rows={3} />
      <Panel rows={2} />
    </div>
  </div>
);

export const StackSkeleton = () => (
  <div className={styles.Page} aria-hidden="true">
    <Masthead />
    <Panel rows={4} />
    <Panel rows={3} />
    <Panel rows={2} />
  </div>
);
