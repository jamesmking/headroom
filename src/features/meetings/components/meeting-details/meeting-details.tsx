'use client';

import clsx from 'clsx';
import {CircleDashed, Copy, Lock, Pencil, Trash2} from 'lucide-react';
import Link from 'next/link';
import {Button} from '@/components/button';
import {RoleBadge} from '@/components/role-badge';
import type {CalendarEvent} from '@/features/calendar/types';
import {deleteMeeting, skipMeetingOccurrence} from '@/features/meetings/actions/quick-actions';
import type {MeetingRecord} from '@/features/meetings/queries/get-meetings';
import {describeRecurrence} from '@/features/meetings/recurrence';
import {formatLongDate} from '@/lib/dates';
import {formatDuration, formatTimeRange} from '@/lib/time';
import {dayPath} from '@/routes';
import styles from './meeting-details.module.scss';

type MeetingDetailsProps = {
  event: CalendarEvent;
  /** The editable record behind the event. Absent for read-only sources. */
  meeting: MeetingRecord | null;
  onEdit: () => void;
  onDuplicate: () => void;
  /** Omitted when the details already sit on the day being shown. */
  showDayLink?: boolean;
};

/**
 * Everything known about one occurrence, with the actions that apply to it.
 *
 * Family calendar events reach here too. They render identically minus the
 * actions: the point of showing them is that they are part of your day, not
 * that you can do anything about them from inside this application.
 */
export const MeetingDetails = ({
  event,
  meeting,
  onEdit,
  onDuplicate,
  showDayLink = true,
}: MeetingDetailsProps) => {
  const duration = event.endMinutes - event.startMinutes;

  return (
    <div
      className={clsx(styles.Details, event.source === 'family' && styles.Family)}
      style={event.role ? ({'--role-colour': event.role.colour} as React.CSSProperties) : undefined}
    >
      <div>
        <h3 className={styles.Title}>{event.title}</h3>
        <p className={styles.When}>
          {event.allDay ? (
            'All day'
          ) : (
            <>
              {formatTimeRange(event.startMinutes, event.endMinutes)}{' '}
              <span className={styles.Duration}>({formatDuration(duration)})</span>
            </>
          )}
        </p>
      </div>

      <div className={styles.Meta}>
        <RoleBadge role={event.role} long hollow={event.source === 'family'} />
        {event.claim === 'optional' && (
          <span className={styles.Optional}>
            <CircleDashed size={12} aria-hidden="true" />
            Optional
          </span>
        )}
        {showDayLink ? (
          <Link href={dayPath(event.date)}>{formatLongDate(event.date)}</Link>
        ) : (
          <span>{formatLongDate(event.date)}</span>
        )}
      </div>

      <dl className={styles.Facts}>
        {event.claim === 'optional' && (
          <>
            <dt className={styles.Term}>Attendance</dt>
            <dd className={styles.Value}>
              Optional — shown in full, but it never counts against your available time.
            </dd>
          </>
        )}
        {event.claim === 'informational' && (
          <>
            <dt className={styles.Term}>Attendance</dt>
            <dd className={styles.Value}>
              For information — not yours to attend, so it never counts against your available
              time or appears in the day&rsquo;s totals.
            </dd>
          </>
        )}
        {meeting && meeting.recurrence !== 'NONE' && (
          <>
            <dt className={styles.Term}>Repeats</dt>
            <dd className={styles.Value}>
              {describeRecurrence(meeting.recurrence)}
              {meeting.recurrenceEndDate
                ? `, until ${formatLongDate(meeting.recurrenceEndDate)}`
                : ', with no end date'}
            </dd>
          </>
        )}
        {event.notes && (
          <>
            <dt className={styles.Term}>Notes</dt>
            <dd className={styles.Value}>{event.notes}</dd>
          </>
        )}
      </dl>

      {meeting ? (
        <div className={styles.Actions}>
          <Button variant="secondary" size="small" onClick={onEdit}>
            <Pencil size={13} aria-hidden="true" />
            Edit
          </Button>
          <Button variant="secondary" size="small" onClick={onDuplicate}>
            <Copy size={13} aria-hidden="true" />
            Duplicate
          </Button>

          <span className={styles.Spacer} />

          {meeting.recurrence !== 'NONE' && (
            <form action={skipMeetingOccurrence}>
              <input type="hidden" name="id" value={meeting.id} />
              <input type="hidden" name="occurrenceDate" value={event.date} />
              <Button type="submit" variant="secondary" size="small">
                Cancel just this one
              </Button>
            </form>
          )}

          <form action={deleteMeeting}>
            <input type="hidden" name="id" value={meeting.id} />
            <Button type="submit" variant="danger" size="small">
              <Trash2 size={13} aria-hidden="true" />
              {meeting.recurrence === 'NONE' ? 'Delete' : 'Delete the series'}
            </Button>
          </form>
        </div>
      ) : (
        <p className={styles.ReadOnly}>
          <Lock size={13} className={styles.Icon} aria-hidden="true" />
          From your family calendar. It is shown here so your day is complete, but it can only be
          changed where it was created.
        </p>
      )}
    </div>
  );
};
