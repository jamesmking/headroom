import { FormGroup, Label, ErrorMessage } from "@/app/ui";
import styles from "./Textarea.module.scss";

interface Props {
  id: string;
  name: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  label?: string;
  error?: string;
  testId?: string;
}

export const Textarea = ({
  id,
  name,
  value,
  rows = 5,
  label,
  onChange,
  error,
  testId,
}: Props): JSX.Element => {
  return (
    <FormGroup error={!!error}>
      {label && <Label text={label} inputId={id} />}
      {error && <ErrorMessage text={error} />}
      <textarea
        className={styles.textarea}
        id={id}
        name={name}
        rows={rows}
        data-testid={testId}
        title={label}
        onChange={onChange}
        value={value}
      />
    </FormGroup>
  );
};
