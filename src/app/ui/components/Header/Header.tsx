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
      <h1 className={styles.logo}>
        <Image
          src="/HeadRoomLogo.svg"
          alt="Head Room - De-clutter your mind"
          className={styles.logoImage}
          width={150}
          height={56}
        />
      </h1>
      <div className={styles.userInfo}>{children}</div>
    </header>
  );
};
