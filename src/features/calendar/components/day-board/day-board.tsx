'use client';

import {Plus} from 'lucide-react';
import {useCallback, useState} from 'react';
import {Button} from '@/components/button';
import {Panel} from '@/components/panel';
import {TimeText} from '@/components/time-text';
import {buildDaySummary} from '@/features/availability/availability';
import {DayTimeline} from '@/features/calendar/components/day-timeline';
import type {CalendarEvent, RoleOption, WorkingHours} from '@/features/calendar/types';
import {MeetingForm, type MeetingDraft} from '@/features/meetings/components/meeting-form';
import type {MeetingRecord} from '@/features/meetings/queries/get-meetings';
import type {DateKey} from '@/lib/dates';
import {formatDuration} from '@/lib/time';
import styles from './day-board.module.scss';

type Editor = {mode: 'create'; draft: MeetingDraft} | {mode: 'edit'; meetingId: string} | null;

type DayBoardProps = {
  title: string;
  date: DateKey;
  /** Draws the live now-line and keeps the wording in the present tense. */
  isToday: boolean;
  events: CalendarEvent[];
  meetings: MeetingRecord[];
  roles: RoleOption[];
  defaultRoleId: string | null;
  workingHours: WorkingHours;
  timeZone: string;
  initialMinutes: number;
};

/**
 * The day's timeline plus the inline meeting editor.
 *
 * Adding and editing happen in place at the top of the panel rather than in a
 * modal, so the day stays visible while you type.
 */
export const DayBoard = ({
  title,
  date,
  isToday,
  events,
  meetings,
  roles,
  defaultRoleId,
  workingHours,
  timeZone,
  initialMinutes,
}: DayBoardProps) => {
  const [editor, setEditor] = useState<Editor>(null);

  const close = useCallback(() => setEditor(null), []);

  const startCreate = (startMinutes?: number, endMinutes?: number) =>
    setEditor({
      mode: 'create',
      draft: {
        date,
        startMinutes,
        // Default to half an hour, or the whole gap when it is shorter.
        endMinutes:
          startMinutes === undefined
            ? undefined
            : Math.min(endMinutes ?? Infinity, startMinutes + 30),
      },
    });

  const summary = buildDaySummary(events, workingHours);
  const meetingCount = events.filter(event => !event.allDay).length;

  const editing =
    editor?.mode === 'edit'
      ? (meetings.find(meeting => meeting.id === editor.meetingId) ?? null)
      : null;

  return (
    <Panel
      title={title}
      meta={meetingCount > 0 ? `${meetingCount} booked` : undefined}
      flush
      actions={
        <Button variant="secondary" size="small" onClick={() => startCreate()}>
          <Plus size={14} aria-hidden="true" />
          Add meeting
        </Button>
      }
    >
      {editor?.mode === 'create' && (
        <MeetingForm
          key={`create-${editor.draft.startMinutes ?? 'default'}`}
          roles={roles}
          draft={editor.draft}
          defaultRoleId={defaultRoleId}
          onDone={close}
        />
      )}
      {editor?.mode === 'edit' && editing && (
        <MeetingForm
          key={editing.id}
          roles={roles}
          meeting={editing}
          occurrenceDate={date}
          defaultRoleId={defaultRoleId}
          onDone={close}
        />
      )}

      {events.length === 0 ? (
        <div className={styles.Empty}>
          <p className={styles.EmptyHeadline}>Nothing in the diary.</p>
          <p className={styles.EmptyBody}>
            The whole working day is yours —{' '}
            <TimeText>{formatDuration(summary.totalFreeMinutes)}</TimeText> of it.
          </p>
          {/* The one action this state invites, offered where the eye already is. */}
          <Button
            variant="secondary"
            size="small"
            onClick={() => startCreate(workingHours.startMinutes, workingHours.endMinutes)}
          >
            <Plus size={14} aria-hidden="true" />
            Add a meeting
          </Button>
        </div>
      ) : (
        <DayTimeline
          events={events}
          workingHours={workingHours}
          timeZone={timeZone}
          initialMinutes={initialMinutes}
          showNow={isToday}
          onEditMeeting={meetingId => setEditor({mode: 'edit', meetingId})}
          onAddMeetingAt={startCreate}
        />
      )}

      {events.length > 0 && (
        <div className={styles.Summary}>
          <span>
            {isToday ? 'Free today' : 'Free'}{' '}
            <TimeText className={styles.SummaryValue}>
              {formatDuration(summary.totalFreeMinutes)}
            </TimeText>
          </span>
          <span>
            In meetings{' '}
            <TimeText className={styles.SummaryValue}>
              {formatDuration(summary.totalBusyMinutes)}
            </TimeText>
          </span>
          <span>
            Longest gap{' '}
            <TimeText className={styles.SummaryValue}>
              {formatDuration(
                summary.freePeriods.reduce(
                  (longest, period) => Math.max(longest, period.durationMinutes),
                  0
                )
              )}
            </TimeText>
          </span>
        </div>
      )}
    </Panel>
  );
};
