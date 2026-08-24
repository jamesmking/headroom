'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireUserId} from '@/features/auth/queries/get-current-user';
import {clearFamilyCalendarCache, testFamilyCalendar} from '@/features/family-calendar/ical';
import {type ActionResult, errorResult, fromZodError, successResult} from '@/lib/action-result';
import {prisma} from '@/lib/prisma';
import {parseTime} from '@/lib/time';

const timeField = (message: string) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      const minutes = parseTime(value);
      if (minutes === null) {
        ctx.addIssue({code: z.ZodIssueCode.custom, message});
        return z.NEVER;
      }
      return minutes;
    });

const isValidTimeZone = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat('en', {timeZone: value});
    return true;
  } catch {
    return false;
  }
};

const workingDaySchema = z
  .object({
    start: timeField('Enter a start time, such as 09:00.'),
    end: timeField('Enter an end time, such as 17:30.'),
    timeZone: z.string().trim().refine(isValidTimeZone, 'Choose a valid timezone.'),
  })
  .refine(data => data.end > data.start, {
    message: 'The working day must end after it starts.',
    path: ['end'],
  });

export const saveWorkingDayAction = async (
  _previous: ActionResult,
  formData: FormData
): Promise<ActionResult> => {
  const userId = await requireUserId();

  const parsed = workingDaySchema.safeParse({
    start: formData.get('start') ?? '',
    end: formData.get('end') ?? '',
    timeZone: formData.get('timeZone') ?? '',
  });

  if (!parsed.success) return fromZodError(parsed.error);

  await prisma.userSettings.upsert({
    where: {userId},
    update: {
      workdayStartMinutes: parsed.data.start,
      workdayEndMinutes: parsed.data.end,
      timeZone: parsed.data.timeZone,
    },
    create: {
      userId,
      workdayStartMinutes: parsed.data.start,
      workdayEndMinutes: parsed.data.end,
      timeZone: parsed.data.timeZone,
    },
  });

  revalidatePath('/', 'layout');
  return successResult('Working day updated.');
};

/**
 * Save the family calendar feed.
 *
 * The URL is verified before it is stored, so a typo is reported immediately
 * rather than showing up as a silently empty calendar. Submitting an empty URL
 * keeps whatever is already stored, which is what lets the form avoid ever
 * rendering the secret back to the browser.
 */
export const saveFamilyCalendarAction = async (
  _previous: ActionResult,
  formData: FormData
): Promise<ActionResult> => {
  const userId = await requireUserId();

  const icalUrl = String(formData.get('icalUrl') ?? '').trim();
  const enabled = formData.get('icalEnabled') === 'on';

  const existing = await prisma.userSettings.findUnique({
    where: {userId},
    select: {icalUrl: true},
  });

  if (!icalUrl && !existing?.icalUrl) {
    if (enabled) {
      return errorResult('Add a calendar URL before switching the family calendar on.', {
        icalUrl: 'Enter the iCal feed address.',
      });
    }
    await prisma.userSettings.upsert({
      where: {userId},
      update: {icalEnabled: false},
      create: {userId, icalEnabled: false},
    });
    revalidatePath('/', 'layout');
    return successResult('Family calendar is off.');
  }

  if (icalUrl) {
    const check = await testFamilyCalendar(icalUrl);
    if (!check.ok) {
      return errorResult('That calendar could not be read.', {icalUrl: check.message});
    }

    clearFamilyCalendarCache(existing?.icalUrl);
    await prisma.userSettings.upsert({
      where: {userId},
      update: {icalUrl, icalEnabled: enabled},
      create: {userId, icalUrl, icalEnabled: enabled},
    });

    revalidatePath('/', 'layout');
    return successResult(
      `Family calendar saved — ${check.eventCount} ${check.eventCount === 1 ? 'event' : 'events'} found.`
    );
  }

  // Keep the stored URL, just change whether it is used.
  await prisma.userSettings.update({where: {userId}, data: {icalEnabled: enabled}});
  revalidatePath('/', 'layout');
  return successResult(enabled ? 'Family calendar is on.' : 'Family calendar is off.');
};

/** Single-click action: takes FormData directly and returns nothing. */
export const removeFamilyCalendar = async (): Promise<void> => {
  const userId = await requireUserId();

  const existing = await prisma.userSettings.findUnique({
    where: {userId},
    select: {icalUrl: true},
  });

  clearFamilyCalendarCache(existing?.icalUrl);
  await prisma.userSettings.upsert({
    where: {userId},
    update: {icalUrl: null, icalEnabled: false},
    create: {userId, icalUrl: null, icalEnabled: false},
  });

  revalidatePath('/', 'layout');
};
