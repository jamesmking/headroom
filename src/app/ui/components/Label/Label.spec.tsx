import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Label } from "./Label";

describe("Label component", () => {
  test("renders with text and testId", () => {
    const testId = "labelTestId";
    render(<Label text="Label Text" inputId="inputId" testId={testId} />);
    const labelElement = screen.getByTestId(testId);
    expect(labelElement).toBeInTheDocument();
    expect(labelElement).toHaveTextContent("Label Text");
  });

  test("renders with children and testId", () => {
    const testId = "labelTestId";
    render(
      <Label inputId="inputId" testId={testId}>
        <span>Child Element</span>
      </Label>,
    );
    const labelElement = screen.getByTestId(testId);
    expect(labelElement).toBeInTheDocument();
    expect(labelElement).toHaveTextContent("Child Element");
  });

  test("renders with text when both text and children are provided", () => {
    render(
      <Label text="Label Text" inputId="inputId">
        <span>Child Element</span>
      </Label>,
    );
    const labelElement = screen.getByText("Label Text");
    expect(labelElement).toBeInTheDocument();
    expect(labelElement).not.toHaveTextContent("Child Element");
  });

  test("renders with correct htmlFor attribute", () => {
    render(<Label text="Label Text" inputId="inputId" />);
    const labelElement = screen.getByText("Label Text");
    expect(labelElement).toHaveAttribute("for", "inputId");
  });
});
