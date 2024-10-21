import { Fieldset, FormGroup, Legend } from "@/app/ui";
import styles from "./Radios.module.scss";

export interface Option {
  text: string;
  value: string;
}

interface Props {
  name: string;
  id: string;
  value?: string;
  legendText?: string | React.ReactNode;
  options: Option[];
  inline?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  testId?: string;
}

export const Radios = ({
  name,
  id,
  value,
  legendText,
  options,
  inline,
  onChange,
  testId,
}: Props): JSX.Element => {
  return (
    <FormGroup>
      <Fieldset>
        {legendText && <Legend>{legendText}</Legend>}

        <div
          data-testid={testId}
          className={`${styles.radios}
          ${inline && styles.inline}
          `}
        >
          {options.map((option, index) => {
            const radioId = `${id.replace(" ", "").toLowerCase()}-radio-${index + 1}`;
            return (
              <div key={`radio-option-${index}`} className={styles.item}>
                <input
                  className={styles.input}
                  type="radio"
                  name={name}
                  value={option.value}
                  id={radioId}
                  onChange={onChange}
                  defaultChecked={option.value === value}
                />
                <label className={styles.label} htmlFor={radioId}>
                  {option.text}
                </label>
              </div>
            );
          })}
        </div>
      </Fieldset>
    </FormGroup>
  );
};
