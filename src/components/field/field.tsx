import {Field as FormField} from '@base-ui-components/react/field';
import styles from './field.module.scss';

type FieldProps = {
  name: string;
  id: string;
  value: string;
  label: string;
};

const Field = ({name, id, value, label}: FieldProps) => {
  return (
    <>
      <FormField.Root className={styles.Field}>
        <FormField.Label className={styles.Label}>{label}</FormField.Label>
        <FormField.Error className={styles.Error}>Text</FormField.Error>
        <FormField.Control
          required
          className={styles.Input}
          id={id}
          name={name}
          defaultValue={value}
        />
      </FormField.Root>
    </>
  );
};

export {Field};
