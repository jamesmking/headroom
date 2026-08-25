'use client';

import {useActionState} from 'react';
import {Button} from '@/components/button';
import {Field, fieldStyles} from '@/components/field';
import {FormMessage} from '@/components/form-message';
import {saveWorkingDayAction} from '@/features/settings/actions/settings-actions';
import {idleResult} from '@/lib/action-result';
import {formatTime} from '@/lib/time';
import styles from './working-day-form.module.scss';

type WorkingDayFormProps = {
  startMinutes: number;
  endMinutes: number;
  timeZone: string;
  timeZones: string[];
};

export const WorkingDayForm = ({
  startMinutes,
  endMinutes,
  timeZone,
  timeZones,
}: WorkingDayFormProps) => {
  const [result, formAction] = useActionState(saveWorkingDayAction, idleResult);
  const errors = result.fieldErrors ?? {};

  return (
    <form action={formAction} className={styles.Form}>
      <FormMessage result={result} />

      <div className={styles.Row}>
        <Field label="Day starts" error={errors.start}>
          {({id, describedBy, invalid}) => (
            <input
              id={id}
              name="start"
              type="time"
              className={fieldStyles.Time}
              defaultValue={formatTime(startMinutes)}
              required
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field label="Day ends" error={errors.end}>
          {({id, describedBy, invalid}) => (
            <input
              id={id}
              name="end"
              type="time"
              className={fieldStyles.Time}
              defaultValue={formatTime(endMinutes)}
              required
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field label="Timezone" error={errors.timeZone}>
          {({id, describedBy, invalid}) => (
            <select
              id={id}
              name="timeZone"
              className={fieldStyles.Select}
              defaultValue={timeZone}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            >
              {timeZones.map(zone => (
                <option key={zone} value={zone}>
                  {zone.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <div className={styles.Footer}>
        <Button type="submit">Save working day</Button>
      </div>
    </form>
  );
};
