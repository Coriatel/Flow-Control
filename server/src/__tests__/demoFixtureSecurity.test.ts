import fs from "fs";
import path from "path";

describe("demo readiness fixture credentials", () => {
  it("requires an injected demo password and contains no fallback credential", () => {
    const fixturePath = path.resolve(
      __dirname,
      "../../scripts/demo-readiness-fixture.ts",
    );
    const source = fs.readFileSync(fixturePath, "utf8");

    expect(source).toContain("process.env.FLOW_DEMO_PASSWORD");
    expect(source).toContain("FLOW_DEMO_PASSWORD is required");
    expect(source).not.toMatch(
      /process\.env\.FLOW_DEMO_PASSWORD\s*\|\|\s*["'][^"']+["']/,
    );
  });
});
