import { ReactNode } from "react";
import Link from "next/link";
import styles from "./Button.module.scss";

interface Props {
  type?: "submit" | "reset" | "button";
  children?: ReactNode;
  secondary?: boolean;
  inverse?: boolean;
  start?: boolean;
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
  secondary,
  inverse,
  start,
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
        {start && (
          <svg
            className="govuk-button__start-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="17.5"
            height="19"
            viewBox="0 0 33 40"
            aria-hidden="true"
            focusable="false"
          >
            <path fill="currentColor" d="M0 0h13l20 20-20 20H0l20-20z" />
          </svg>
        )}
      </button>
    );
  } else {
    return (
      <Link
        href={href}
        className={`govuk-button ${secondary ? "govuk-button--secondary" : ""} ${
          inverse ? "govuk-button--inverse" : ""
        } ${start ? "govuk-button--start" : ""}`}
        data-testid={testId}
        id={id}
      >
        {text || children}
        {start && (
          <svg
            className="govuk-button__start-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="17.5"
            height="19"
            viewBox="0 0 33 40"
            aria-hidden="true"
            focusable="false"
          >
            <path fill="currentColor" d="M0 0h13l20 20-20 20H0l20-20z" />
          </svg>
        )}
      </Link>
    );
  }
};
