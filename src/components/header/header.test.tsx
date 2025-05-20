import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Header } from "./header";

jest.mock("@/routes", () => ({
  homePath: jest.fn(() => "/home"),
  ticketsPath: jest.fn(() => "/tickets"),
}));

describe("Header", () => {
  it("renders the header with the correct title", () => {
    render(<Header />);
    expect(screen.getByText("My App")).toBeInTheDocument();
  });

  it("renders the navigation links with correct paths", () => {
    render(<Header />);
    expect(screen.getByText("Home").closest("a")).toHaveAttribute(
      "href",
      "/home",
    );
    expect(screen.getByText("Tickets").closest("a")).toHaveAttribute(
      "href",
      "/tickets",
    );
  });

  it("applies the correct styles to the header", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass(
      "flex justify-between items-center p-4 bg-gray-800 text-white",
    );
  });

  it("renders navigation links in a list", () => {
    render(<Header />);
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveTextContent("Home");
    expect(listItems[1]).toHaveTextContent("Tickets");
  });
});
