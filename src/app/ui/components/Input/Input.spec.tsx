import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Input } from "./Input";

describe("Input component", () => {
  test("renders with testId", () => {
    const testId = "testId";
    render(<Input id="firstName" name="firstName" testId={testId} />);
    const element = screen.getByTestId(testId);
    expect(element).toBeTruthy();
  });

  test("displays label when provided", () => {
    render(<Input id="firstName" name="firstName" label="First Name" />);
    expect(screen.getByText("First Name")).toBeInTheDocument();
  });

  test("displays error message when provided", () => {
    render(<Input id="firstName" name="firstName" error="Error message" />);
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  test("does not display error message when not provided", () => {
    render(<Input id="firstName" name="firstName" />);
    expect(screen.queryByText("Error message")).not.toBeInTheDocument();
  });

  test("calls onChange when input value changes", () => {
    const handleChange = jest.fn();
    render(<Input id="firstName" name="firstName" onChange={handleChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "new value" },
    });
    expect(handleChange).toHaveBeenCalled();
  });

  test("renders with correct value", () => {
    render(<Input id="firstName" name="firstName" value="initial value" />);
    expect(screen.getByDisplayValue("initial value")).toBeInTheDocument();
  });
});
