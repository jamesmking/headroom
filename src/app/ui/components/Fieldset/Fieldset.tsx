import { ReactNode } from "react";
import styles from "./Fieldset.module.scss";
import { Legend } from "@/app/ui";

interface Props {
  children?: ReactNode;
  legend?: string | ReactNode;
  testId?: string;
}

export const Fieldset = ({ children, legend, testId }: Props): JSX.Element => {
  return (
    <fieldset className={styles.fieldset} data-testid={testId}>
      {legend && <Legend>{legend}</Legend>}
      {children}
    </fieldset>
  );
};
