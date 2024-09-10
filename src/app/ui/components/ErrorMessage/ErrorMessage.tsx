import { ReactNode } from "react";
import styles from "./ErrorMessage.module.scss";

interface Props {
  text?: string;
  children?: ReactNode;
  testId?: string;
}

export const ErrorMessage = ({
  text,
  children,
  testId,
}: Props): JSX.Element => {
  return (
    <p className={styles.errorMessage} data-testid={testId}>
      {text || children}
    </p>
  );
};
