import { render, screen } from "@testing-library/react";

import { ProductionLineTracker } from "./ProductionLineTracker";

describe("ProductionLineTracker", () => {
  it("shows all four stations for an in-progress order", () => {
    render(<ProductionLineTracker status="IN_PROGRESS" />);
    expect(screen.getByTitle("Pending")).toBeInTheDocument();
    expect(screen.getByTitle("In Progress")).toBeInTheDocument();
    expect(screen.getByTitle("Quality Check")).toBeInTheDocument();
    expect(screen.getByTitle("Completed")).toBeInTheDocument();
  });

  it("shows a stalled message for a cancelled order", () => {
    render(<ProductionLineTracker status="CANCELLED" />);
    expect(screen.getByText(/line stopped/i)).toBeInTheDocument();
  });
});
