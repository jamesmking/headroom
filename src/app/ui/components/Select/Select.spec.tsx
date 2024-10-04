import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select } from "./Select";

describe("Select component", () => {
  test("renders with testId", () => {
    const testId = "testId";
    const options = [
      { text: "Option 1", value: "1" },
      { text: "Option 2", value: "2" },
    ];
    render(<Select id={testId} testId={testId} options={options} />);
    const element = screen.getByTestId(testId);
    expect(element).toBeTruthy();
  });

  test("renders options correctly", () => {
    const options = [
      { text: "Option 1", value: "1" },
      { text: "Option 2", value: "2" },
    ];
    render(<Select id="select" options={options} />);
    options.forEach((option) => {
      expect(screen.getByText(option.text)).toBeTruthy();
    });
  });

  test("calls onChange when an option is selected", () => {
    const handleChange = jest.fn();
    const options = [
      { text: "Option 1", value: "1" },
      { text: "Option 2", value: "2" },
    ];
    render(<Select id="select" options={options} onChange={handleChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    expect(handleChange).toHaveBeenCalled();
  });

  test("displays label when provided", () => {
    const options = [
      { text: "Option 1", value: "1" },
      { text: "Option 2", value: "2" },
    ];
    render(<Select id="select" options={options} label="Select Label" />);
    expect(screen.getByText("Select Label")).toBeTruthy();
  });

  test("displays error message when provided", () => {
    const options = [
      { text: "Option 1", value: "1" },
      { text: "Option 2", value: "2" },
    ];
    render(<Select id="select" options={options} error="Error message" />);
    expect(screen.getByText("Error message")).toBeTruthy();
  });

  test("selects the correct option based on value prop", () => {
    const options = [
      { text: "Option 1", value: "1" },
      { text: "Option 2", value: "2" },
    ];
    render(<Select id="select" options={options} value="2" />);
    expect(screen.getByDisplayValue("Option 2")).toBeTruthy();
  });
});
