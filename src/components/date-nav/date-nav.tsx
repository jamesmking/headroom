'use client';

import clsx from 'clsx';
import {CalendarDays, ChevronLeft, ChevronRight} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useCallback, useRef, useState} from 'react';
import {Button} from '@/components/button';
import {type DateKey, addDays, isDateKey} from '@/lib/dates';
import {useDismiss} from '@/lib/use-dismiss';
import {fillDate} from '@/routes';
import styles from './date-nav.module.scss';

type DateNavProps = {
  /** Names the control for assistive technology, e.g. 'Change day'. */
  label: string;
  /** The date the view is currently showing. */
  selected: DateKey;
  /** Today, so the shortcuts and the anchor link know where home is. */
  today: DateKey;
  previousHref: string;
  nextHref: string;
  /** Spoken names for the arrows: 'Previous day', 'Previous week'. */
  previousLabel: string;
  nextLabel: string;
  /** The anchor: '/' for Today, '/week' for this week. */
  anchorHref: string;
  anchorLabel: string;
  /** True when the view is already showing the anchor. */
  atAnchor: boolean;
  /**
   * Route template for a chosen date, e.g. '/day/:date'. A template rather
   * than a function because functions cannot cross the server boundary.
   */
  hrefTemplate: string;
};

/**
 * Previous / anchor / next, plus a date picker.
 *
 * Shared by the Day and Week screens so moving through time works and looks
 * identical in both. The arrows are real links, so they are middle-clickable,
 * bookmarkable and work before hydration; only the picker needs JavaScript.
 */
export const DateNav = ({
  label,
  selected,
  today,
  previousHref,
  nextHref,
  previousLabel,
  nextLabel,
  anchorHref,
  anchorLabel,
  atAnchor,
  hrefTemplate,
}: DateNavProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(close, {active: open, ref: containerRef});

  const go = (date: DateKey) => {
    close();
    router.push(fillDate(hrefTemplate, date));
  };

  return (
    <div className={styles.Nav} ref={containerRef}>
      <nav className={styles.Group} aria-label={label}>
        <Link className={styles.Link} href={previousHref}>
          <ChevronLeft size={13} aria-hidden="true" />
          {previousLabel}
        </Link>

        <Link
          className={clsx(styles.Link, atAnchor && styles.Current)}
          href={anchorHref}
          aria-current={atAnchor ? 'page' : undefined}
        >
          {anchorLabel}
        </Link>

        <Link className={styles.Link} href={nextHref}>
          {nextLabel}
          <ChevronRight size={13} aria-hidden="true" />
        </Link>
      </nav>

      <button
        type="button"
        className={styles.Link}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(current => !current);
          // Land the caret in the picker so it is usable without a second click.
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        <CalendarDays size={13} aria-hidden="true" />
        Jump to…
      </button>

      {open && (
        <div className={styles.Popover} role="dialog" aria-label="Jump to a date">
          <form
            onSubmit={event => {
              event.preventDefault();
              const value = inputRef.current?.value ?? '';
              if (isDateKey(value)) go(value);
            }}
          >
            <label className={styles.PopoverLabel} htmlFor="date-nav-jump">
              Go to date
            </label>
            <div className={styles.Row}>
              <input
                ref={inputRef}
                id="date-nav-jump"
                type="date"
                className={styles.Input}
                defaultValue={selected}
              />
              <Button type="submit" size="small">
                Go
              </Button>
            </div>
          </form>

          <div className={styles.Shortcuts}>
            <button type="button" className={styles.Shortcut} onClick={() => go(today)}>
              Today
            </button>
            <button type="button" className={styles.Shortcut} onClick={() => go(addDays(today, 1))}>
              Tomorrow
            </button>
            <button type="button" className={styles.Shortcut} onClick={() => go(addDays(today, 7))}>
              This time next week
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
