import {Field as FormField} from '@base-ui-components/react/field';
import styles from './field.module.scss';

type FieldProps = {
  name: string;
  id: string;
  label: string;
  hideLabel?: boolean;
  error?: string;
};

const Field = ({name, id, label, hideLabel, error}: FieldProps) => {
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
        />
      </FormField.Root>
    </>
  );
};

export {Field};
