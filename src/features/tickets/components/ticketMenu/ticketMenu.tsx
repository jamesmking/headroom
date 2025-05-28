'use client';

import {Menu} from '@base-ui-components/react/menu';
import {LucideEllipsisVertical} from 'lucide-react';
import Link from 'next/link';
import {ticketEditPath, ticketsPath} from '@/routes';
import styles from './ticketMenu.module.scss';

type TicketMenuProps = {
  ticketId: string;
};

const TicketMenu = ({ticketId}: TicketMenuProps) => {
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        <LucideEllipsisVertical />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.Item className={styles.Item}>
              <Link href={ticketEditPath(ticketId)}>Edit</Link>
            </Menu.Item>
            <Menu.Item className={styles.Item}>Delete</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};

export {TicketMenu};
