import { ReactNode } from "react";
import styles from "./FormGroup.module.scss";

interface Props {
  children?: ReactNode;
  error?: boolean;
  testId?: string;
  id?: string;
}

export const FormGroup = ({
  children,
  error,
  testId,
  id,
}: Props): JSX.Element => {
  return (
    <div className={styles.formGroup} data-testid={testId} id={id}>
      {children}
    </div>
  );
};
