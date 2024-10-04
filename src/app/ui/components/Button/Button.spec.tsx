import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "./Button";

describe("Button component", () => {
  test("renders button with text and testId", () => {
    const testText = "Click me";
    const testId = "customTestId";
    render(<Button text={testText} testId={testId} />);
    const buttonElement = screen.getByText(testText);
    expect(buttonElement).toBeTruthy();
  });

  test("renders button with children and testId", () => {
    const testChildren = <span>Child element</span>;
    const testId = "customTestId";
    render(<Button testId={testId}>{testChildren}</Button>);
    const buttonElement = screen.getByText("Child element");
    expect(buttonElement).toBeTruthy();
  });

  test("calls onClick when button is clicked", () => {
    const handleClick = jest.fn();
    render(<Button text="Click me" onClick={handleClick} />);
    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalled();
  });

  test("renders button with disabled state", () => {
    render(<Button text="Click me" disabled />);
    const buttonElement = screen.getByText("Click me");
    expect(buttonElement).toBeDisabled();
  });

  test("renders link when href is provided", () => {
    const testHref = "/test";
    render(<Button text="Click me" href={testHref} />);
    const linkElement = screen.getByText("Click me");
    expect(linkElement).toHaveAttribute("href", testHref);
  });

  test("renders link with text and testId", () => {
    const testText = "Click me";
    const testId = "customTestId";
    const testHref = "/test";
    render(
      <Button
        text={testText}
        href={testHref}
        testId={testId}
        id={"button123"}
      />,
    );
    const linkElement = screen.getByTestId(testId);
    expect(linkElement).toBeTruthy();
  });
});
