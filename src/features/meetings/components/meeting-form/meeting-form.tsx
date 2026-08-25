'use client';

import {useActionState, useEffect, useRef} from 'react';
import {Button} from '@/components/button';
import {Field, fieldStyles} from '@/components/field';
import {FormMessage} from '@/components/form-message';
import type {RoleOption} from '@/features/calendar/types';
import {RoleRequired} from '@/features/roles/components/role-required';
import {saveMeetingAction} from '@/features/meetings/actions/meeting-actions';
import {deleteMeeting, skipMeetingOccurrence} from '@/features/meetings/actions/quick-actions';
import type {MeetingRecord} from '@/features/meetings/queries/get-meetings';
import {RECURRENCE_OPTIONS} from '@/features/meetings/recurrence';
import {idleResult} from '@/lib/action-result';
import type {DateKey} from '@/lib/dates';
import {formatTime} from '@/lib/time';
import {useDismiss} from '@/lib/use-dismiss';
import styles from './meeting-form.module.scss';

/**
 * A part-filled new meeting. Every field is optional because the draft is
 * assembled from wherever the user clicked: a gap in a day carries a time, a
 * duplicated meeting carries almost everything.
 */
export type MeetingDraft = {
  date: DateKey;
  startMinutes?: number;
  endMinutes?: number;
  title?: string;
  roleId?: string | null;
  notes?: string | null;
};

type MeetingFormProps = {
  roles: RoleOption[];
  /** Present when editing an existing meeting. */
  meeting?: MeetingRecord | null;
  /** Present when creating, optionally pre-filled from a gap in the day. */
  draft?: MeetingDraft;
  /** The day being edited, so one occurrence of a series can be cancelled. */
  occurrenceDate?: DateKey;
  /** The role to pre-select when the draft does not name one. */
  defaultRoleId?: string | null;
  /** Overrides the heading, e.g. 'Duplicate meeting'. */
  legend?: string;
  /** Suppresses the heading where the surrounding panel already carries it. */
  hideLegend?: boolean;
  onDone: () => void;
};

export const MeetingForm = ({
  roles,
  meeting,
  draft,
  occurrenceDate,
  defaultRoleId,
  legend,
  hideLegend = false,
  onDone,
}: MeetingFormProps) => {
  const [result, formAction] = useActionState(saveMeetingAction, idleResult);
  const titleRef = useRef<HTMLInputElement>(null);

  // Escape closes the editor. Deliberately no close-on-click-outside: losing a
  // half-written meeting because you clicked the page would be far worse than
  // the cost of reaching for Cancel.
  useDismiss(onDone);

  // Move focus into the form when it opens so keyboard users land in the right
  // place without hunting.
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (result.status === 'success') onDone();
  }, [result, onDone]);

  const errors = result.fieldErrors ?? {};
  const date = meeting?.date ?? draft?.date ?? '';
  const startTime = formatTime(meeting?.startMinutes ?? draft?.startMinutes ?? 9 * 60);
  const endTime = formatTime(meeting?.endMinutes ?? draft?.endMinutes ?? 9 * 60 + 30);

  const currentRoleId = meeting?.roleId ?? draft?.roleId ?? null;

  // Archived roles are offered only when one is already the current value, so
  // editing an old meeting never silently reassigns it and nothing new can be
  // filed under a role that has been put away.
  const options = roles.filter(role => role.active || role.id === currentRoleId);

  // A remembered role is only ever a suggestion, and only a valid one: an id
  // left over from an archived or deleted role falls through to no selection.
  const suggested =
    defaultRoleId && options.some(role => role.id === defaultRoleId && role.active)
      ? defaultRoleId
      : options.length === 1
        ? options[0].id
        : '';
  const selectedRoleId = currentRoleId ?? suggested;

  // All hooks above run unconditionally; only the render branches.
  if (options.length === 0) return <RoleRequired noun="meeting" />;

  return (
    <form action={formAction} className={styles.Form}>
      {!hideLegend && (
        <p className={styles.Legend}>{legend ?? (meeting ? 'Edit meeting' : 'New meeting')}</p>
      )}

      {meeting && <input type="hidden" name="id" value={meeting.id} />}
      {/* Named distinctly so it cannot shadow the meeting's own date field. */}
      {occurrenceDate && <input type="hidden" name="occurrenceDate" value={occurrenceDate} />}

      <FormMessage result={result} />

      <div className={styles.Grid}>
        <Field label="Title" error={errors.title} className={styles.Full}>
          {({id, describedBy, invalid}) => (
            <input
              ref={titleRef}
              id={id}
              name="title"
              className={fieldStyles.Input}
              defaultValue={meeting?.title ?? draft?.title ?? ''}
              placeholder="Team A stand-up"
              maxLength={140}
              required
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field label="Date" error={errors.date}>
          {({id, describedBy, invalid}) => (
            <input
              id={id}
              name="date"
              type="date"
              className={fieldStyles.Time}
              defaultValue={date}
              required
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field label="Role" error={errors.roleId}>
          {({id, describedBy, invalid}) => (
            <select
              id={id}
              name="roleId"
              className={fieldStyles.Select}
              defaultValue={selectedRoleId}
              required
              aria-describedby={describedBy}
              aria-invalid={invalid}
            >
              <option value="" disabled>
                Choose a role…
              </option>
              {options.map(role => (
                <option key={role.id} value={role.id}>
                  {role.active ? role.name : `${role.name} (archived)`}
                </option>
              ))}
            </select>
          )}
        </Field>

        <div className={`${styles.Times} ${styles.Full}`}>
          <Field label="Starts" error={errors.startTime}>
            {({id, describedBy, invalid}) => (
              <input
                id={id}
                name="startTime"
                type="time"
                className={fieldStyles.Time}
                defaultValue={startTime}
                required
                aria-describedby={describedBy}
                aria-invalid={invalid}
              />
            )}
          </Field>

          <Field label="Ends" error={errors.endTime}>
            {({id, describedBy, invalid}) => (
              <input
                id={id}
                name="endTime"
                type="time"
                className={fieldStyles.Time}
                defaultValue={endTime}
                required
                aria-describedby={describedBy}
                aria-invalid={invalid}
              />
            )}
          </Field>
        </div>

        <Field label="Repeats" error={errors.recurrence}>
          {({id, describedBy}) => (
            <select
              id={id}
              name="recurrence"
              className={fieldStyles.Select}
              defaultValue={meeting?.recurrence ?? 'NONE'}
              aria-describedby={describedBy}
            >
              {RECURRENCE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="Repeat until"
          optional
          hint="Leave empty to repeat indefinitely."
          error={errors.recurrenceEndDate}
        >
          {({id, describedBy, invalid}) => (
            <input
              id={id}
              name="recurrenceEndDate"
              type="date"
              className={fieldStyles.Time}
              defaultValue={meeting?.recurrenceEndDate ?? ''}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field label="Notes" optional error={errors.notes} className={styles.Full}>
          {({id, describedBy, invalid}) => (
            <textarea
              id={id}
              name="notes"
              className={fieldStyles.Textarea}
              defaultValue={meeting?.notes ?? draft?.notes ?? ''}
              rows={2}
              maxLength={2000}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>
      </div>

      <div className={styles.Footer}>
        <Button type="submit" pendingAware>
          {meeting ? 'Save meeting' : 'Add meeting'}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <span className={styles.Spacer} />
        {meeting && meeting.recurrence !== 'NONE' && occurrenceDate && (
          <Button type="submit" variant="secondary" formAction={skipMeetingOccurrence}>
            Cancel just this one
          </Button>
        )}
        {meeting && (
          <Button type="submit" variant="danger" formAction={deleteMeeting}>
            {meeting.recurrence === 'NONE' ? 'Delete' : 'Delete the series'}
          </Button>
        )}
      </div>
    </form>
  );
};
