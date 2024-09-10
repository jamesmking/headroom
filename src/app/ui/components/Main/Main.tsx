import { ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  testId?: string;
}

export const Main = ({ children, testId }: Props): JSX.Element => {
  return (
    <main
      className={`govuk-main-wrapper`}
      data-testid={testId}
      id={`main-content`}
    >
      {children}
    </main>
  );
};
