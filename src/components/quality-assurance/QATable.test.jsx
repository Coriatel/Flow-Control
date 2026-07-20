// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import QATable from "./QATable";

afterEach(cleanup);

const authoritativeRows = [
  {
    id: "released",
    reagent_batch_id: "released",
    reagent_name: "Released reagent",
    batch_number: "LOT-REL",
    current_quantity: 10,
    qaStatus: "RELEASED",
    canDispense: true,
    blockedReasons: [],
    coa_documents: [{ coa_document_url: "/coa/released.pdf" }],
  },
  {
    id: "held",
    reagent_batch_id: "held",
    reagent_name: "Held reagent",
    batch_number: "LOT-HOLD",
    current_quantity: 10,
    qaStatus: "ON_HOLD",
    canDispense: false,
    blockedReasons: ["QA_ON_HOLD"],
    coa_documents: [],
  },
];

function renderTable(overrides = {}) {
  const props = {
    data: authoritativeRows,
    visibleColumns: [
      { accessor: "reagent_name", Header: "ריאגנט", width: 150 },
      { accessor: "batch_number", Header: "אצווה", width: 120 },
      { accessor: "qaStatus", Header: "סטטוס QA", width: 120 },
      { accessor: "current_quantity", Header: "כמות", width: 100 },
      { accessor: "actions", Header: "פעולות", width: 160 },
    ],
    sortField: null,
    sortDirection: null,
    onSortStateChange: vi.fn(),
    onHandleItem: vi.fn(),
    onCOAUpload: vi.fn(),
    onCOAView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(
    <MemoryRouter>
      <QATable {...props} />
    </MemoryRouter>,
  );
  return props;
}

describe("QATable authoritative actions", () => {
  it("allows the released row and blocks the held row without quantity inference", async () => {
    const user = userEvent.setup();
    const props = renderTable();
    const mobile = screen.getByTestId("data-grid-mobile");

    await user.click(
      within(mobile).getByRole("button", { name: /הצג פרטים Released reagent/ }),
    );
    await user.click(
      within(mobile).getByRole("button", { name: /הצג פרטים Held reagent/ }),
    );

    expect(
      within(mobile).getByRole("button", { name: "טפל באצווה LOT-REL" }),
    ).toBeEnabled();
    expect(
      within(mobile).queryByRole("button", { name: "טפל באצווה LOT-HOLD" }),
    ).not.toBeInTheDocument();
    expect(within(mobile).getByText("QA_ON_HOLD")).toBeInTheDocument();

    await user.click(
      within(mobile).getByRole("button", { name: "טפל באצווה LOT-REL" }),
    );
    expect(props.onHandleItem).toHaveBeenCalledWith(authoritativeRows[0]);
  });

  it("exposes COA upload/view and row actions with 44px targets", () => {
    renderTable();
    const view = screen.getAllByRole("button", { name: "צפה ב-COA LOT-REL" })[0];
    const upload = screen.getAllByRole("button", { name: "העלה COA LOT-HOLD" })[0];
    expect(view).toHaveClass("min-h-11", "min-w-11");
    expect(upload).toHaveClass("min-h-11", "min-w-11");
  });
});
