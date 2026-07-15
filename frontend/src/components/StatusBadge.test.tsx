import { render, screen } from "@testing-library/react";

import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the human-readable label for a status", () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("renders quality check label", () => {
    render(<StatusBadge status="QUALITY_CHECK" />);
    expect(screen.getByText("Quality Check")).toBeInTheDocument();
  });
});
