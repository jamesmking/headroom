'use client';

import {CheckCircle2, CircleOff} from 'lucide-react';
import {useActionState} from 'react';
import {Button} from '@/components/button';
import {Field, fieldStyles} from '@/components/field';
import {FormMessage} from '@/components/form-message';
import {
  removeFamilyCalendar,
  saveFamilyCalendarAction,
} from '@/features/settings/actions/settings-actions';
import {idleResult} from '@/lib/action-result';
import styles from './family-calendar-form.module.scss';

type FamilyCalendarFormProps = {
  /** Whether a URL is stored. The URL itself is never sent to the browser. */
  hasIcalUrl: boolean;
  icalHost: string | null;
  enabled: boolean;
};

export const FamilyCalendarForm = ({hasIcalUrl, icalHost, enabled}: FamilyCalendarFormProps) => {
  const [result, formAction] = useActionState(saveFamilyCalendarAction, idleResult);
  const errors = result.fieldErrors ?? {};

  return (
    <form action={formAction} className={styles.Form}>
      <FormMessage result={result} />

      <p className={styles.Status}>
        {hasIcalUrl ? (
          <>
            <CheckCircle2 size={15} aria-hidden="true" />A calendar is configured at{' '}
            <span className={styles.Host}>{icalHost}</span>
          </>
        ) : (
          <>
            <CircleOff size={15} aria-hidden="true" />
            No family calendar is configured.
          </>
        )}
      </p>

      <Field
        label={hasIcalUrl ? 'Replace the calendar URL' : 'Calendar URL'}
        optional={hasIcalUrl}
        hint={
          hasIcalUrl
            ? 'Leave empty to keep the current feed. The stored address is never shown here.'
            : 'The private iCal/ICS address of your shared family calendar. https:// or webcal://'
        }
        error={errors.icalUrl}
      >
        {({id, describedBy, invalid}) => (
          <input
            id={id}
            name="icalUrl"
            type="url"
            className={fieldStyles.Input}
            placeholder="https://calendar.example.com/private/feed.ics"
            autoComplete="off"
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>

      <label className={styles.Toggle}>
        <input
          className={styles.Checkbox}
          type="checkbox"
          name="icalEnabled"
          defaultChecked={enabled}
        />
        <span>Show family calendar events alongside my meetings</span>
      </label>

      <div className={styles.Footer}>
        <Button type="submit" pendingAware>
          Save calendar
        </Button>
        <span className={styles.Spacer} />
        {hasIcalUrl && (
          <Button type="submit" variant="danger" formAction={removeFamilyCalendar}>
            Remove calendar
          </Button>
        )}
      </div>

      <p className={styles.Privacy}>
        The feed is fetched by the server only, cached for a few minutes, and its address is never
        sent to your browser. Family events are read-only in Headroom, and if the feed is
        unavailable the rest of the application carries on working.
      </p>
    </form>
  );
};
