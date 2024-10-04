import { ReactNode } from "react";
import styles from "./FormGroup.module.scss";

interface Props {
  children?: ReactNode;
  testId?: string;
  id?: string;
}

export const FormGroup = ({ children, testId, id }: Props): JSX.Element => {
  return (
    <div className={styles.formGroup} data-testid={testId} id={id}>
      {children}
    </div>
  );
};
