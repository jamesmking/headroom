'use client';

import {CornerDownRight} from 'lucide-react';
import {FormButton} from '@/components/form-button';
import {carryUnfinishedWork} from '@/features/tasks/actions/quick-actions';
import type {DateKey} from '@/lib/dates';
import styles from './carry-over.module.scss';

type CarryOverProps = {
  from: DateKey;
  to: DateKey;
  /** How many unfinished tasks would move, so the label states the stakes. */
  count: number;
  /** How the destination reads mid-sentence, e.g. 'tomorrow' or 'Thursday'. */
  toLabel: string;
};

/**
 * Move whatever is still unfinished onto the next day.
 *
 * No confirmation: the whole action is one click to undo from the other side,
 * and a dialog here would cost more than the mistake it prevents.
 */
export const CarryOver = ({from, to, count, toLabel}: CarryOverProps) => (
  <form action={carryUnfinishedWork}>
    <input type="hidden" name="from" value={from} />
    <input type="hidden" name="to" value={to} />
    <FormButton className={styles.Button}>
      <CornerDownRight size={12} aria-hidden="true" />
      {`Move ${count} unfinished to ${toLabel}`}
    </FormButton>
  </form>
);
