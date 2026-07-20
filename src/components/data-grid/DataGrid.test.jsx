/* eslint-disable react/prop-types */
// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DataGrid from "./DataGrid";
import { createDefaultGridState } from "@/lib/data-grid/gridState";

afterEach(cleanup);

const columns = [
  {
    id: "name",
    header: "שם",
    accessorKey: "name",
    defaultWidth: 160,
    mobilePrimary: true,
  },
  {
    id: "status",
    header: "סטטוס",
    accessorKey: "status",
    defaultWidth: 120,
    filter: { type: "text", label: "סינון סטטוס" },
  },
  {
    id: "quantity",
    header: "כמות",
    accessorKey: "quantity",
    type: "number",
    defaultWidth: 100,
  },
  {
    id: "actions",
    header: "פעולות",
    enableSorting: false,
    alwaysVisible: true,
    cell: (row) => <button aria-label={`פתח ${row.name}`}>פתח</button>,
  },
];

const rows = [
  { id: "a", name: "Alpha", status: "PENDING", quantity: 4 },
  { id: "b", name: "Beta", status: "RELEASED", quantity: 8 },
];

function Harness({ initialState, ...props }) {
  const [state, setState] = React.useState(
    initialState || createDefaultGridState(columns, { pageSize: 1 }),
  );
  return (
    <DataGrid
      ariaLabel="בדיקת אצוות"
      columns={columns}
      rows={rows}
      state={state}
      onStateChange={setState}
      {...props}
    />
  );
}

describe("DataGrid", () => {
  it("uses semantic sortable headers with a three-state sort cycle", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const nameHeader = screen.getByRole("columnheader", { name: /שם/ });
    const sortButton = within(nameHeader).getByRole("button", { name: /מיין לפי שם/ });

    expect(nameHeader).toHaveAttribute("aria-sort", "none");
    await user.click(sortButton);
    expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
    await user.click(sortButton);
    expect(nameHeader).toHaveAttribute("aria-sort", "descending");
    await user.click(sortButton);
    expect(nameHeader).toHaveAttribute("aria-sort", "none");
  });

  it("supports global search, column filters, and filtered/sorted pagination", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole("searchbox", { name: "חיפוש בטבלה" }), "Beta");
    expect(screen.getAllByText("Beta").length).toBeGreaterThan(0);
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox", { name: "חיפוש בטבלה" }));
    await user.type(screen.getByLabelText("סינון סטטוס"), "pending");
    expect(screen.getAllByText("Alpha").length).toBeGreaterThan(0);
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });

  it("supports keyboard reorder and RTL keyboard resize", () => {
    render(<Harness />);
    const nameHeader = screen.getByRole("columnheader", { name: /שם/ });
    const reorder = within(nameHeader).getByRole("button", { name: /הזז עמודה שם/ });
    fireEvent.keyDown(reorder, { key: "ArrowLeft", altKey: true });

    const headers = screen.getAllByRole("columnheader");
    expect(headers[1]).toHaveTextContent("שם");

    const separator = within(screen.getByRole("columnheader", { name: /שם/ }))
      .getByRole("separator", { name: /שנה רוחב עמודה שם/ });
    expect(separator).toHaveAttribute("aria-valuenow", "160");
    fireEvent.keyDown(separator, { key: "ArrowLeft" });
    expect(separator).toHaveAttribute("aria-valuenow", "168");
  });

  it("pins critical columns in the requested RTL edge", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole("button", { name: "הצמד עמודה שם לימין" }),
    );
    expect(screen.getByRole("columnheader", { name: /שם/ })).toHaveStyle({
      position: "sticky",
      right: "0px",
    });
  });

  it("provides mobile expandable cards with 44px actions", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const cards = screen.getByTestId("data-grid-mobile");
    const expand = within(cards).getByRole("button", { name: /הצג פרטים Alpha/ });
    expect(expand.className).toContain("min-h-11");
    await user.click(expand);
    expect(within(cards).getByText("PENDING")).toBeInTheDocument();
    expect(within(cards).getByRole("button", { name: "פתח Alpha" }).className)
      .toContain("min-h-11");
  });

  it.each([
    ["loading", "טוען נתונים"],
    ["empty", "אין נתונים להצגה"],
    ["error", "שגיאה בטעינת הנתונים"],
    ["unauthorized", "אין הרשאה לצפות בנתונים"],
  ])("renders the %s state without a blank shell", (status, expected) => {
    render(
      <Harness
        rows={status === "empty" ? [] : rows}
        status={status}
        error={status === "error" ? new Error("failed") : null}
      />,
    );
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("shows stale data non-destructively and exposes reset", async () => {
    const user = userEvent.setup();
    const onResetPreferences = vi.fn();
    render(
      <Harness stale onResetPreferences={onResetPreferences} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("ייתכן שהנתונים אינם מעודכנים");
    await user.click(screen.getByRole("button", { name: "איפוס תצוגת הטבלה" }));
    expect(onResetPreferences).toHaveBeenCalledOnce();
  });
});
