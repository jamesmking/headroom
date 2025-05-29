import {Field as FormField} from '@base-ui-components/react/field';
import styles from './field.module.scss';
import {ReactElement} from 'react';

type FieldProps = {
  name: string;
  id: string;
  label: string;
  hideLabel?: boolean;
  error?: string;
  defaultValue?: string;
  render?: ReactElement;
};

const Field = ({name, id, label, hideLabel, error, defaultValue, render}: FieldProps) => {
  return (
    <>
      <FormField.Root className={styles.Field}>
        <FormField.Label className={styles.Label} aria-hidden={hideLabel ? 'true' : 'false'}>
          {label}
        </FormField.Label>
        {error && (
          <FormField.Error className={styles.Error} forceShow={!!error}>
            {error}
          </FormField.Error>
        )}
        <FormField.Control
          required
          className={styles.Input}
          id={id}
          name={name}
          placeholder={hideLabel ? label : ''}
          defaultValue={defaultValue}
          render={render || <input type="text" />}
        />
      </FormField.Root>
    </>
  );
};

export {Field};
