import { ReactNode } from "react";
import Link from "next/link";
import styles from "./Button.module.scss";

interface Props {
  type?: "submit" | "reset" | "button";
  children?: ReactNode;
  text?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => Promise<void> | void;
  disabled?: boolean;
  testId?: string;
  id?: string;
}

export const Button = ({
  type,
  children,
  text,
  href,
  onClick,
  disabled,
  testId,
  id,
}: Props): JSX.Element => {
  if (href === undefined) {
    return (
      <button
        className={styles.button}
        data-testid={testId}
        type={type}
        onClick={onClick}
        disabled={disabled}
        id={id}
      >
        {text || children}
      </button>
    );
  } else {
    return (
      <Link href={href} className={styles.button} data-testid={testId} id={id}>
        {text || children}
      </Link>
    );
  }
};
