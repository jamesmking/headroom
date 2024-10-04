import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextInput } from "@/app/ui";
import "@testing-library/jest-dom";

describe("Text Input component", () => {
  test("renders with testId", () => {
    const testId = "testId";
    render(<TextInput id="firstName" name="firstName" testId={testId} />);
    const element = screen.getByTestId(testId);
    expect(element).toBeTruthy();
  });

  test("renders with default type text", () => {
    render(<TextInput id="firstName" name="firstName" />);
    const element = screen.getByRole("textbox");
    expect(element).toHaveAttribute("type", "text");
  });

  test("renders with provided type", () => {
    render(<TextInput id="firstName" name="firstName" type="email" />);
    const element = screen.getByRole("textbox");
    expect(element).toHaveAttribute("type", "email");
  });

  test("calls onChange handler", () => {
    const handleChange = jest.fn();
    render(
      <TextInput id="firstName" name="firstName" onChange={handleChange} />,
    );
    const element = screen.getByRole("textbox");
    fireEvent.change(element, { target: { value: "new value" } });
    expect(handleChange).toHaveBeenCalled();
  });

  test("renders with autoComplete", () => {
    render(<TextInput id="firstName" name="firstName" autoComplete="on" />);
    const element = screen.getByRole("textbox");
    expect(element).toHaveAttribute("autoComplete", "on");
  });

  test("renders with aria-describedby", () => {
    render(
      <TextInput id="firstName" name="firstName" ariaDescribedBy={true} />,
    );
    const element = screen.getByRole("textbox");
    expect(element).toHaveAttribute("aria-describedby", "firstName-hint");
  });

  test("renders with inputMode", () => {
    render(<TextInput id="firstName" name="firstName" inputMode="numeric" />);
    const element = screen.getByRole("textbox");
    expect(element).toHaveAttribute("inputMode", "numeric");
  });

  test("renders with spellCheck", () => {
    render(<TextInput id="firstName" name="firstName" spellCheck={true} />);
    const element = screen.getByRole("textbox");
    expect(element).toHaveAttribute("spellcheck", "true");
  });
});
