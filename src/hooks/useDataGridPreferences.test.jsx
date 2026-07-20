// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import useDataGridPreferences from "./useDataGridPreferences";
import { createGridPreferenceKey } from "@/lib/data-grid/preferences";

const columns = [{ id: "name", header: "שם", accessorKey: "name" }];

describe("useDataGridPreferences identity isolation", () => {
  it("reloads the next user's preferences without overwriting them", () => {
    const adminKey = createGridPreferenceKey({ userId: "admin", gridId: "qa", version: 1 });
    const reviewerKey = createGridPreferenceKey({ userId: "reviewer", gridId: "qa", version: 1 });
    localStorage.setItem(adminKey, JSON.stringify({ version: 1, pageSize: 10 }));
    localStorage.setItem(reviewerKey, JSON.stringify({ version: 1, pageSize: 50 }));

    const { result, rerender } = renderHook(
      ({ userId }) =>
        useDataGridPreferences({ gridId: "qa", userId, columns, storage: localStorage }),
      { initialProps: { userId: "admin" } },
    );
    expect(result.current.state.pageSize).toBe(10);

    act(() => rerender({ userId: "reviewer" }));

    expect(result.current.state.pageSize).toBe(50);
    expect(JSON.parse(localStorage.getItem(reviewerKey)).pageSize).toBe(50);
  });
});
