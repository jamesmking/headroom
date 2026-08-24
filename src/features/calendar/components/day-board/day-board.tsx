'use client';

import {Plus} from 'lucide-react';
import {useCallback, useState} from 'react';
import {Button} from '@/components/button';
import {Panel} from '@/components/panel';
import {TimeText} from '@/components/time-text';
import {buildDaySummary} from '@/features/availability/availability';
import {DayTimeline} from '@/features/calendar/components/day-timeline';
import type {CalendarEvent, RoleSummary, WorkingHours} from '@/features/calendar/types';
import {MeetingForm, type MeetingDraft} from '@/features/meetings/components/meeting-form';
import type {MeetingRecord} from '@/features/meetings/queries/get-meetings';
import type {DateKey} from '@/lib/dates';
import {formatDuration} from '@/lib/time';
import styles from './day-board.module.scss';

type Editor = {mode: 'create'; draft: MeetingDraft} | {mode: 'edit'; meetingId: string} | null;

type DayBoardProps = {
  title: string;
  date: DateKey;
  events: CalendarEvent[];
  meetings: MeetingRecord[];
  roles: RoleSummary[];
  workingHours: WorkingHours;
  timeZone: string;
  initialMinutes: number;
  showNow: boolean;
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
  events,
  meetings,
  roles,
  workingHours,
  timeZone,
  initialMinutes,
  showNow,
}: DayBoardProps) => {
  const [editor, setEditor] = useState<Editor>(null);

  const close = useCallback(() => setEditor(null), []);

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
        <Button
          variant="secondary"
          size="small"
          onClick={() => setEditor({mode: 'create', draft: {date}})}
        >
          <Plus size={14} aria-hidden="true" />
          Add meeting
        </Button>
      }
    >
      {editor?.mode === 'create' && (
        <MeetingForm key="create" roles={roles} draft={editor.draft} onDone={close} />
      )}
      {editor?.mode === 'edit' && editing && (
        <MeetingForm
          key={editing.id}
          roles={roles}
          meeting={editing}
          occurrenceDate={date}
          onDone={close}
        />
      )}

      {events.length === 0 ? (
        <div className={styles.Empty}>
          <p className={styles.EmptyHeadline}>Nothing in the diary.</p>
          <p>
            The whole working day is yours —{' '}
            <TimeText>{formatDuration(summary.totalFreeMinutes)}</TimeText> of it.
          </p>
        </div>
      ) : (
        <DayTimeline
          events={events}
          workingHours={workingHours}
          timeZone={timeZone}
          initialMinutes={initialMinutes}
          showNow={showNow}
          onEditMeeting={meetingId => setEditor({mode: 'edit', meetingId})}
          onAddMeetingAt={(startMinutes, endMinutes) =>
            setEditor({
              mode: 'create',
              draft: {
                date,
                startMinutes,
                // Default to half an hour, or the whole gap when it is shorter.
                endMinutes: Math.min(endMinutes, startMinutes + 30),
              },
            })
          }
        />
      )}

      {events.length > 0 && (
        <div className={styles.Summary}>
          <span>
            Free today{' '}
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
