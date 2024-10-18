import { ReactNode } from "react";
import styles from "./Header.module.scss";
import Image from "next/image";

interface Props {
  children?: ReactNode;
  testId?: string;
  id?: string;
}

export const Header = ({
  children,
  testId,
  id = "main-content",
}: Props): JSX.Element => {
  return (
    <header className={styles.header} data-testid={testId} id={id}>
      <div className={styles.logo}>
        <Image
          src="/HeadRoomLogo.svg"
          alt="Head Room Logo"
          className={styles.logoImage}
          width={150}
          height={56}
        />
      </div>
      {children}
    </header>
  );
};
