import {Collapsible} from '@base-ui-components/react/collapsible';
import styles from './collapse.module.scss';

type CollapseProps = {
  title: string;
  children: React.ReactNode;
};

const Collapse = ({title, children}: CollapseProps) => {
  return (
    <Collapsible.Root className={styles.Collapsible}>
      <Collapsible.Trigger className={styles.Trigger}>
        <ChevronIcon className={styles.Icon} />
        {title}
      </Collapsible.Trigger>
      <Collapsible.Panel className={styles.Panel}>
        <div className={styles.Content}>{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
};

export {Collapse};

function ChevronIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentcolor" />
    </svg>
  );
}
