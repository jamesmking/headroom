import { InputType, InputModeType } from "../../types";
import styles from "./TextInput.module.scss";

interface Props {
  type?: InputType;
  id: string;
  name: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  ariaDescribedBy?: boolean;
  inputMode?: InputModeType;
  testId?: string;
  spellCheck?: boolean;
}

export const TextInput = ({
  type = "text",
  id,
  name,
  value,
  onChange,
  autoComplete,
  ariaDescribedBy,
  inputMode,
  testId,
  spellCheck,
}: Props): JSX.Element => {
  return (
    <input
      className={styles.textInput}
      id={id}
      name={name}
      type={type}
      defaultValue={value}
      autoComplete={autoComplete}
      aria-describedby={ariaDescribedBy ? `${id}-hint` : undefined}
      onChange={onChange}
      data-testid={testId}
      inputMode={inputMode ? inputMode : undefined}
      spellCheck={spellCheck}
    />
  );
};
