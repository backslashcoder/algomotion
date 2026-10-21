import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ArrayRenderer } from "@/visualizations/array/array-renderer";
import { GraphRenderer } from "@/visualizations/graph/graph-renderer";
import { getRenderer, listVisualizationTypes } from "@/visualizations/registry";
import { StatePanelRenderer } from "@/visualizations/state-panel/state-panel-renderer";
import { groupPointers, resolveRoles, barRatio } from "@/visualizations/array/roles";
import { computeGraphLayout } from "@/visualizations/graph/layout";
import { bubbleSort } from "@/algorithms/sorting/bubble-sort";
import { bfs } from "@/algorithms/graphs/bfs";
import { generateTrace } from "@/engine/trace-generator";
import { getFrame } from "@/engine/state-reconstruction";

describe("array roles", () => {
  it("lets transient focus beat persistent state", () => {
    const roles = resolveRoles(5, { sorted: [3, 4] }, { comparing: [0, 1], swapping: [3] });
    expect(roles.map((r) => r.role)).toEqual(["compare", "compare", "default", "swap", "sorted"]);
  });

  it("marks indices outside the active range", () => {
    const roles = resolveRoles(4, { range: [1, 2] }, {});
    expect(roles.map((r) => r.outsideRange)).toEqual([true, false, false, true]);
  });

  it("groups pointers and ignores invalid indices", () => {
    expect(groupPointers({ i: 2, j: 2, k: 9, m: -1, x: 0.5 }, 5)).toEqual({ 2: ["i", "j"] });
  });

  it("normalises bar heights, including equal values", () => {
    expect(barRatio(5, 0, 10)).toBe(0.5);
    expect(barRatio(7, 7, 7)).toBeGreaterThan(0);
  });
});

describe("ArrayRenderer with a real trace", () => {
  const trace = generateTrace(bubbleSort, { array: [4, 2, 7] });

  it("renders every value and labels the comparing pair (not by colour alone)", () => {
    const step = trace.steps.findIndex((s) => s.type === "compare");
    const { container } = render(<ArrayRenderer frame={getFrame(trace, step)} config={{ mode: "bars" }} />);
    const svg = screen.getByRole("img");
    expect(svg).toHaveAccessibleName(/4, 2, 7/);
    expect(within(svg).getAllByText("compare")).toHaveLength(2);
    ["4", "2", "7"].forEach((v) => expect(within(svg).getAllByText(v).length).toBeGreaterThan(0));
    expect(container.querySelector("[stroke-dasharray='6 4']")).not.toBeNull();
  });

  it("shows swapped order and swap tags after a swap step", () => {
    const step = trace.steps.findIndex((s) => s.type === "swap");
    render(<ArrayRenderer frame={getFrame(trace, step)} config={{ mode: "bars" }} />);
    const svg = screen.getByRole("img");
    expect(within(svg).getAllByText("swap")).toHaveLength(2);
    expect(svg).toHaveAccessibleName(/2, 4, 7/);
  });

  it("marks finished elements in the final frame", () => {
    render(<ArrayRenderer frame={getFrame(trace, trace.steps.length - 1)} config={{ mode: "bars" }} />);
    expect(within(screen.getByRole("img")).getAllByText("✓")).toHaveLength(3);
  });

  it("renders a legend", () => {
    render(<ArrayRenderer frame={getFrame(trace, 0)} config={{ mode: "bars" }} />);
    expect(screen.getByRole("list", { name: "Legend" })).toHaveTextContent("Comparing");
  });
});

describe("GraphRenderer with a real trace", () => {
  const trace = generateTrace(bfs, bfs.input.defaultValue);

  it("shows queue and traversal order from the current frame", () => {
    const index = trace.steps.findIndex((s) => s.type === "visit" && trace.states[trace.steps.indexOf(s)].order.length === 2);
    render(<GraphRenderer frame={getFrame(trace, index)} />);
    expect(screen.getByRole("list", { name: "Queue" })).toHaveTextContent("C");
    expect(screen.getByRole("list", { name: "Traversal order" })).toHaveTextContent("A");
    expect(screen.getByRole("list", { name: "Traversal order" })).toHaveTextContent("B");
    expect(screen.getByRole("img")).toHaveAccessibleName(/Visited: A, B/);
  });

  it("shows empty-state text before anything is visited", () => {
    render(<GraphRenderer frame={getFrame(trace, 0)} />);
    expect(screen.getByText("nothing visited yet")).toBeInTheDocument();
  });

  it("lays out nodes inside the box, with and without preset positions", () => {
    const preset = computeGraphLayout(bfs.input.defaultValue, { width: 600, height: 400 });
    const auto = computeGraphLayout({ nodes: ["A", "B", "C"], edges: [["A", "B"], ["B", "C"]] }, { width: 600, height: 400 });
    for (const layout of [preset, auto]) {
      for (const { x, y } of Object.values(layout)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(600);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(400);
      }
    }
    expect(Object.keys(auto)).toEqual(["A", "B", "C"]);
  });
});

describe("visualization registry", () => {
  it("maps known types and falls back to the state panel", () => {
    expect(getRenderer("array")).toBe(ArrayRenderer);
    expect(getRenderer("graph")).toBe(GraphRenderer);
    expect(getRenderer("something-new")).toBe(StatePanelRenderer);
    expect(listVisualizationTypes()).toEqual(expect.arrayContaining(["array", "graph", "state-panel"]));
  });

  it("the state panel can render any trace frame", () => {
    const trace = generateTrace(bfs, bfs.input.defaultValue);
    render(<StatePanelRenderer frame={getFrame(trace, 3)} />);
    expect(screen.getByText("queue")).toBeInTheDocument();
  });
});
