import { ReactNode } from "react";
import styles from "./Main.module.scss";

interface Props {
  children?: ReactNode;
  testId?: string;
  id?: string;
}

export const Main = ({
  children,
  testId,
  id = "main-content",
}: Props): JSX.Element => {
  return (
    <main className={styles.main} data-testid={testId} id={id}>
      {children}
    </main>
  );
};
