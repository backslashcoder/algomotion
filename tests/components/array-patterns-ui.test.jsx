import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArrayRenderer } from "@/visualizations/array/array-renderer";
import { resolveRoles } from "@/visualizations/array/roles";
import { ArrayParamInput } from "@/components/inputs/array-param-input";
import { NumberArrayInput } from "@/components/inputs/number-array-input";
import { AlgorithmExplorer } from "@/components/algorithm-library/algorithm-explorer";
import { fixedWindow } from "@/algorithms/arrays/fixed-window";
import { twoSumSorted } from "@/algorithms/arrays/two-sum-sorted";
import { dutchNationalFlag } from "@/algorithms/arrays/dutch-national-flag";
import { lowerBound } from "@/algorithms/searching/lower-bound";
import { listAlgorithms } from "@/algorithms/registry";
import { generateTrace, tryGenerateTrace } from "@/engine/trace-generator";
import { getFrame } from "@/engine/state-reconstruction";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function harness(def, input) {
  const onApply = vi.fn((raw) => {
    const res = tryGenerateTrace(def, raw);
    return res.ok ? { ok: true } : res;
  });
  return { onApply, props: { definition: def, input, onApply, onReset: vi.fn() } };
}

describe("window and best roles", () => {
  it("resolves best over window, window over default, and found accepts several indices", () => {
    const roles = resolveRoles(6, { window: { from: 1, to: 4 }, best: [3, 4], found: [0, 5] }, {});
    expect(roles.map((r) => r.role)).toEqual(["found", "window", "window", "best", "best", "found"]);
  });
});

describe("ArrayRenderer with sliding-window traces", () => {
  it("draws the window bracket with its live sum and tags the best window", () => {
    const trace = generateTrace(fixedWindow, { array: [2, 1, 5, 1, 3], k: 2 });
    const index = trace.steps.findIndex((s) => s.type === "slide");
    render(<ArrayRenderer frame={getFrame(trace, index)} config={fixedWindow.visualization.config} />);
    const svg = screen.getByRole("img");
    expect(within(svg).getByText("sum = 6")).toBeInTheDocument(); // 1 + 5
    expect(within(svg).getAllByText("best").length).toBeGreaterThan(0);
    expect(screen.getByRole("list", { name: "Legend" })).toHaveTextContent("Current window");
  });

  it("uses algorithm-specific legend labels", () => {
    const trace = generateTrace(lowerBound, lowerBound.input.defaultValue);
    render(<ArrayRenderer frame={getFrame(trace, 0)} config={lowerBound.visualization.config} />);
    expect(screen.getByRole("list", { name: "Legend" })).toHaveTextContent("Less than target");
  });
});

describe("ArrayParamInput (definition-driven)", () => {
  it("applies array + parameter, validates k, and builds examples from the definition", async () => {
    const user = userEvent.setup();
    const { props, onApply } = harness(fixedWindow, { array: [1, 2, 3, 4], k: 2 });
    render(<ArrayParamInput {...props} />);

    expect(screen.queryByRole("button", { name: /sort array/i })).toBeNull();
    const k = screen.getByLabelText("Window size k");
    await user.clear(k);
    await user.type(k, "9");
    await user.click(screen.getByRole("button", { name: /^apply/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/between 1 and the array length \(4\)/);

    await user.clear(k);
    await user.type(k, "3");
    await user.click(screen.getByRole("button", { name: /^apply/i }));
    expect(onApply).toHaveBeenLastCalledWith({ array: [1, 2, 3, 4], k: 3 });

    await user.click(screen.getByRole("button", { name: "Window = whole array" }));
    const raw = onApply.mock.calls.at(-1)[0];
    expect(raw.k).toBe(raw.array.length);
  });

  it("offers Sort array for sorted-input algorithms", async () => {
    const user = userEvent.setup();
    const { props, onApply } = harness(twoSumSorted, { array: [1, 2, 3], target: 5 });
    render(<ArrayParamInput {...props} />);
    const field = screen.getByLabelText("Sorted array");
    await user.clear(field);
    await user.type(field, "9, 1, 5");
    await user.click(screen.getByRole("button", { name: /sort array/i }));
    expect(onApply).toHaveBeenLastCalledWith({ array: [1, 5, 9], target: 5 });
  });

  it("the number-array editor uses definition examples (Dutch flag only produces 0, 1, 2)", async () => {
    const user = userEvent.setup();
    const { props, onApply } = harness(dutchNationalFlag, dutchNationalFlag.input.defaultValue);
    render(<NumberArrayInput {...props} />);
    expect(screen.queryByLabelText("Size")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Random" }));
    expect(onApply.mock.calls[0][0].array.every((v) => [0, 1, 2].includes(v))).toBe(true);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("example buttons", () => {
  it("every example of every definition passes validation (200 random draws each)", () => {
    for (const def of listAlgorithms()) {
      for (const example of def.input.examples ?? []) {
        for (let i = 0; i < 200; i += 1) {
          const res = def.input.validate(example.build());
          expect(res.ok, `${def.name} / ${example.label}: ${res.errors?.join(" ")}`).toBe(true);
        }
      }
    }
  });
});

describe("explorer technique filter", () => {
  it("filters by technique and combines with category", async () => {
    const user = userEvent.setup();
    render(<AlgorithmExplorer />);
    await user.click(screen.getByRole("button", { name: "Sliding window" }));
    expect(screen.getByTestId("result-count")).toHaveTextContent("2 of 13");
    await user.click(screen.getByRole("button", { name: "Two pointers" }));
    expect(screen.getByTestId("result-count")).toHaveTextContent("3 of 13");
    await user.click(screen.getByRole("button", { name: "Sorting" }));
    expect(screen.getByTestId("result-count")).toHaveTextContent("0 of 13");
    expect(screen.getByRole("heading", { name: /no algorithms match/i })).toBeInTheDocument();
  });

  it("search matches technique names", async () => {
    const user = userEvent.setup();
    render(<AlgorithmExplorer />);
    await user.type(screen.getByRole("searchbox"), "sliding window");
    expect(screen.getByTestId("result-count")).toHaveTextContent("2 of 13");
  });
});
