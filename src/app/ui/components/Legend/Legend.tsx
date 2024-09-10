import { ReactNode } from "react";
import styles from "./Legend.module.scss";

interface Props {
  children?: ReactNode;
  testId?: string;
}

export const Legend = ({ children, testId }: Props): JSX.Element => {
  return (
    <legend className={styles.legend} data-testid={testId}>
      {children}
    </legend>
  );
};
