'use client';

import {Plus, X} from 'lucide-react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Button} from '@/components/button';
import {Panel} from '@/components/panel';
import {WeekGrid} from '@/features/calendar/components/week-grid';
import type {CalendarEvent, RoleOption, WorkingHours} from '@/features/calendar/types';
import {MeetingDetails} from '@/features/meetings/components/meeting-details';
import {MeetingForm, type MeetingDraft} from '@/features/meetings/components/meeting-form';
import type {MeetingRecord} from '@/features/meetings/queries/get-meetings';
import type {DateKey} from '@/lib/dates';
import {useDismiss} from '@/lib/use-dismiss';
import styles from './week-board.module.scss';

type Context =
  | {mode: 'details'; eventId: string}
  | {mode: 'edit'; meetingId: string; occurrenceDate: DateKey}
  | {mode: 'create'; draft: MeetingDraft; legend?: string}
  | null;

type WeekBoardProps = {
  title: string;
  dateKeys: DateKey[];
  eventsByDate: Record<DateKey, CalendarEvent[]>;
  meetings: MeetingRecord[];
  roles: RoleOption[];
  defaultRoleId: string | null;
  workingHours: WorkingHours;
  today: DateKey;
  timeZone: string;
  initialMinutes: number;
};

/** Half an hour is the default a new meeting starts life as. */
const DEFAULT_MEETING_MINUTES = 30;

/**
 * The week grid plus one docked context panel beneath it.
 *
 * Details, editing and adding all land in the same place rather than in
 * popovers hung off 150px-wide columns or in a modal over the top. It matches
 * how the Day screen already works — everything opens in the page, nothing
 * covers what you were looking at — and it is the only option that behaves the
 * same at every width, since a column is far too narrow to hold notes and
 * recurrence.
 */
export const WeekBoard = ({
  title,
  dateKeys,
  eventsByDate,
  meetings,
  roles,
  defaultRoleId,
  workingHours,
  today,
  timeZone,
  initialMinutes,
}: WeekBoardProps) => {
  const [context, setContext] = useState<Context>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setContext(null), []);
  useDismiss(close, {active: context !== null});

  const eventsById = useMemo(() => {
    const index = new Map<string, CalendarEvent>();
    for (const key of dateKeys) {
      for (const event of eventsByDate[key] ?? []) index.set(event.id, event);
    }
    return index;
  }, [dateKeys, eventsByDate]);

  const meetingsById = useMemo(
    () => new Map(meetings.map(meeting => [meeting.id, meeting])),
    [meetings]
  );

  const selectedEvent =
    context?.mode === 'details' ? (eventsById.get(context.eventId) ?? null) : null;
  const selectedMeeting = selectedEvent?.meetingId
    ? (meetingsById.get(selectedEvent.meetingId) ?? null)
    : null;
  const editing = context?.mode === 'edit' ? (meetingsById.get(context.meetingId) ?? null) : null;

  // Bring the panel into view when it opens, and put focus in it, so acting on
  // a chip near the top of a tall grid does not silently change something off
  // screen.
  useEffect(() => {
    if (!context) return;
    const node = panelRef.current;
    if (!node) return;
    node.scrollIntoView({block: 'nearest', behavior: 'smooth'});
    if (context.mode === 'details') node.querySelector('h3')?.scrollIntoView({block: 'nearest'});
  }, [context]);

  const openCreate = (date: DateKey, startMinutes?: number, endMinutes?: number) =>
    setContext({
      mode: 'create',
      draft: {
        date,
        startMinutes: startMinutes ?? workingHours.startMinutes,
        endMinutes:
          startMinutes === undefined
            ? workingHours.startMinutes + DEFAULT_MEETING_MINUTES
            : // Default to half an hour, or the whole gap when it is shorter.
              Math.min(endMinutes ?? Infinity, startMinutes + DEFAULT_MEETING_MINUTES),
      },
    });

  // The panel header's own add control: today when today is in view, otherwise
  // the first day of the week being looked at.
  const addAnchor = dateKeys.includes(today) ? today : dateKeys[0];

  const panelTitle =
    context?.mode === 'create'
      ? (context.legend ?? 'New meeting')
      : context?.mode === 'edit'
        ? 'Edit meeting'
        : 'Meeting details';

  return (
    <div className={styles.Board}>
      <WeekGrid
        title={title}
        dateKeys={dateKeys}
        eventsByDate={eventsByDate}
        workingHours={workingHours}
        today={today}
        timeZone={timeZone}
        initialMinutes={initialMinutes}
        selectedEventId={context?.mode === 'details' ? context.eventId : null}
        onSelectEvent={eventId =>
          setContext(current =>
            current?.mode === 'details' && current.eventId === eventId
              ? null
              : {mode: 'details', eventId}
          )
        }
        onAddMeeting={openCreate}
        actions={
          <Button variant="secondary" size="small" onClick={() => openCreate(addAnchor)}>
            <Plus size={14} aria-hidden="true" />
            Add meeting
          </Button>
        }
      />

      {context && (
        <div ref={panelRef}>
          <Panel
            title={panelTitle}
            actions={
              <Button variant="ghost" size="small" onClick={close}>
                <X size={14} aria-hidden="true" />
                Close
              </Button>
            }
            flush={context.mode === 'details'}
          >
            {context.mode === 'details' && selectedEvent && (
              <MeetingDetails
                event={selectedEvent}
                meeting={selectedMeeting}
                onEdit={() =>
                  selectedMeeting &&
                  setContext({
                    mode: 'edit',
                    meetingId: selectedMeeting.id,
                    occurrenceDate: selectedEvent.date,
                  })
                }
                onDuplicate={() =>
                  selectedMeeting &&
                  setContext({
                    mode: 'create',
                    legend: 'Duplicate meeting',
                    draft: {
                      date: selectedEvent.date,
                      startMinutes: selectedMeeting.startMinutes,
                      endMinutes: selectedMeeting.endMinutes,
                      title: selectedMeeting.title,
                      roleId: selectedMeeting.roleId,
                      notes: selectedMeeting.notes,
                      optional: selectedMeeting.optional,
                    },
                  })
                }
              />
            )}

            {context.mode === 'edit' && editing && (
              <MeetingForm
                key={editing.id}
                roles={roles}
                meeting={editing}
                occurrenceDate={context.occurrenceDate}
                defaultRoleId={defaultRoleId}
                hideLegend
                onDone={close}
              />
            )}

            {context.mode === 'create' && (
              <MeetingForm
                key={`create-${context.draft.date}-${context.draft.startMinutes}`}
                roles={roles}
                draft={context.draft}
                defaultRoleId={defaultRoleId}
                hideLegend
                onDone={close}
              />
            )}
          </Panel>
        </div>
      )}
    </div>
  );
};
