// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ResizableTable from "./ResizableTable";

afterEach(cleanup);

const columns = [
  {
    key: "order_number_temp",
    label: "דרישה",
    defaultWidth: 140,
    sortable: true,
    alwaysVisible: true,
  },
  { key: "supplier", label: "ספק", defaultWidth: 140, sortable: true },
  {
    key: "actions",
    label: "פעולות",
    defaultWidth: 100,
    sortable: false,
    alwaysVisible: true,
  },
];

describe("ResizableTable compatibility adapter", () => {
  it("adds the shared namespaced grid without changing cell renderers", async () => {
    const user = userEvent.setup();
    render(
      <ResizableTable
        columns={columns}
        data={[
          { id: "2", order_number_temp: "REQ-2", supplier: "Beta" },
          { id: "1", order_number_temp: "REQ-1", supplier: "Alpha" },
        ]}
        visibleColumns={columns.map((column) => column.key)}
        sortField="order_number_temp"
        sortDirection="desc"
        renderCell={(row, key) =>
          key === "actions" ? (
            <button aria-label={`פתח ${row.order_number_temp}`}>פתח</button>
          ) : (
            row[key]
          )
        }
      />,
    );

    expect(screen.getByRole("searchbox", { name: "חיפוש בטבלה" })).toBeVisible();
    await user.type(screen.getByRole("searchbox", { name: "חיפוש בטבלה" }), "REQ-1");
    expect(screen.getAllByText("REQ-1").length).toBeGreaterThan(0);
    expect(screen.queryByText("REQ-2")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "פתח REQ-1" })[0])
      .toHaveClass("min-h-11");
  });

  it("preserves a custom selection header", () => {
    render(
      <ResizableTable
        columns={[
          {
            key: "selection",
            label: "בחירה",
            defaultWidth: 60,
            sortable: false,
          },
          ...columns,
        ]}
        data={[{ id: "1", order_number_temp: "REQ-1", supplier: "Alpha" }]}
        visibleColumns={["selection", ...columns.map((column) => column.key)]}
        renderHeader={(column) =>
          column.key === "selection" ? (
            <input type="checkbox" aria-label="בחר הכל" />
          ) : null
        }
        renderCell={(row, key) => row[key]}
      />,
    );
    expect(
      within(screen.getByRole("columnheader", { name: /בחר הכל/ }))
        .getByRole("checkbox", { name: "בחר הכל" }),
    ).toBeInTheDocument();
  });
});
