import { FormGroup, TextInput, Label, ErrorMessage } from "@/app/ui";
import { InputType, InputModeType } from "../../types";

interface Props {
  type?: InputType;
  id: string;
  name: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  hint?: string;
  error?: string;
  inputAutoComplete?: string;
  ariaDescribedBy?: boolean;
  testId?: string;
  inputMode?: InputModeType;
  spellCheck?: boolean;
  ref?: React.RefObject<HTMLInputElement>;
}

export const Input = ({
  type = "text",
  id,
  name,
  value,
  onChange,
  label,
  error,
  testId,
  ariaDescribedBy,
  inputMode,
  spellCheck,
  ref,
}: Props): JSX.Element => {
  return (
    <FormGroup testId={testId}>
      {label && <Label text={label} inputId={id} />}
      {error && <ErrorMessage text={error} />}
      <TextInput
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        ariaDescribedBy={ariaDescribedBy}
        inputMode={inputMode}
        spellCheck={spellCheck}
        ref={ref}
      />
    </FormGroup>
  );
};
