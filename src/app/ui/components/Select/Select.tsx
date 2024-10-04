import styles from "./Select.module.scss";
import { ErrorMessage, FormGroup, Label } from "@/app/ui";

interface Props {
  options: { text: string; value: string }[];
  value?: string;
  testId?: string;
  id: string;
  name?: string;
  label?: string;
  error?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const Select = ({
  options,
  value,
  testId,
  id,
  name,
  label,
  error,
  onChange,
}: Props): JSX.Element => {
  return (
    <FormGroup>
      {label && <Label text={label} inputId={id} />}
      {error && <ErrorMessage text={error} />}
      <select
        className={styles.select}
        data-testid={testId}
        id={id}
        name={name}
        onChange={onChange}
        defaultValue={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.text}
          </option>
        ))}
      </select>
    </FormGroup>
  );
};
