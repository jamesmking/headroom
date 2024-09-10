import { ReactNode } from "react";
import styles from "./Label.module.scss";

interface Props {
  text?: string;
  children?: ReactNode;
  inputId: string;
  testId?: string;
}

export const Label = ({
  text,
  children,
  inputId,
  testId,
}: Props): JSX.Element => {
  return (
    <label className={styles.label} htmlFor={inputId} data-testid={testId}>
      {text || children}
    </label>
  );
};
