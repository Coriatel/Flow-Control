// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ActivityDataGrid from "./ActivityDataGrid";

afterEach(cleanup);

const activities = [
  {
    id: "movement-2",
    date: "2026-07-20T10:00:00.000Z",
    action: "קליטת משלוח",
    description: "נקלטה אצווה B-20",
    details: "8 יחידות",
    user: "Demo Admin",
    impact: "+8",
    label: "תנועת מלאי",
  },
  {
    id: "order-1",
    date: "2026-07-19T10:00:00.000Z",
    action: "יצירת הזמנה",
    description: "נוצרה הזמנה PO-20",
    details: "20 יחידות",
    user: "Demo Admin",
    impact: "",
    label: "רכש",
  },
];

describe("ActivityDataGrid", () => {
  it("uses the shared searchable grid and publishes the exact export view", async () => {
    const user = userEvent.setup();
    const onViewRowsChange = vi.fn();
    render(
      <ActivityDataGrid
        activities={activities}
        onViewRowsChange={onViewRowsChange}
      />,
    );

    await user.type(
      screen.getByRole("searchbox", { name: "חיפוש בטבלה" }),
      "B-20",
    );

    expect(screen.getAllByText("נקלטה אצווה B-20").length).toBeGreaterThan(0);
    expect(screen.queryByText("נוצרה הזמנה PO-20")).not.toBeInTheDocument();
    expect(onViewRowsChange).toHaveBeenLastCalledWith([activities[0]]);
  });

  it("renders expandable mobile cards with 44px controls", () => {
    render(<ActivityDataGrid activities={activities} />);
    expect(screen.getByTestId("data-grid-mobile")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /הצג פרטים/ })[0],
    ).toHaveClass("min-h-11", "min-w-11");
  });
});
