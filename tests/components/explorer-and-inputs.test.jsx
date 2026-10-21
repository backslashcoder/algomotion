import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlgorithmExplorer } from "@/components/algorithm-library/algorithm-explorer";
import { NumberArrayInput } from "@/components/inputs/number-array-input";
import { SortedArrayTargetInput } from "@/components/inputs/sorted-array-target-input";
import { GraphInput } from "@/components/inputs/graph-input";
import { shouldIgnoreShortcut } from "@/hooks/use-playback-shortcuts";
import { matchesQuery } from "@/lib/formatters";
import { bubbleSort } from "@/algorithms/sorting/bubble-sort";
import { binarySearch } from "@/algorithms/searching/binary-search";
import { bfs } from "@/algorithms/graphs/bfs";
import { tryGenerateTrace } from "@/engine/trace-generator";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("AlgorithmExplorer", () => {
  it("lists every algorithm and filters by search text", async () => {
    const user = userEvent.setup();
    render(<AlgorithmExplorer />);
    expect(screen.getByTestId("result-count")).toHaveTextContent("5 of 5");
    await user.type(screen.getByRole("searchbox", { name: /search algorithms/i }), "queue");
    expect(screen.getByTestId("result-count")).toHaveTextContent("1 of 5");
    expect(screen.getByRole("link", { name: /breadth-first search/i })).toHaveAttribute(
      "href",
      "/algorithms/breadth-first-search",
    );
  });

  it("combines category and difficulty filters", async () => {
    const user = userEvent.setup();
    render(<AlgorithmExplorer />);
    await user.click(screen.getByRole("button", { name: "Sorting" }));
    expect(screen.getByTestId("result-count")).toHaveTextContent("3 of 5");
    await user.click(screen.getByRole("button", { name: "Intermediate" }));
    expect(screen.getByTestId("result-count")).toHaveTextContent("1 of 5");
    expect(screen.getByRole("link", { name: /merge sort/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sorting" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows an empty state that can be cleared", async () => {
    const user = userEvent.setup();
    render(<AlgorithmExplorer />);
    await user.type(screen.getByRole("searchbox"), "zzzzzz");
    expect(screen.getByRole("heading", { name: /no algorithms match/i })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /clear filters/i })[0]);
    expect(screen.getByTestId("result-count")).toHaveTextContent("5 of 5");
  });

  it("matchesQuery needs every term to match", () => {
    expect(matchesQuery(bubbleSort, "stable swap")).toBe(true);
    expect(matchesQuery(bubbleSort, "stable zebra")).toBe(false);
    expect(matchesQuery(bubbleSort, "   ")).toBe(true);
  });
});

function harness(def, input) {
  const onApply = vi.fn((raw) => {
    const res = tryGenerateTrace(def, raw);
    return res.ok ? { ok: true } : res;
  });
  const onReset = vi.fn();
  return { onApply, onReset, props: { definition: def, input, onApply, onReset } };
}

describe("NumberArrayInput", () => {
  it("applies a valid array", async () => {
    const user = userEvent.setup();
    const { props, onApply } = harness(bubbleSort, { array: [3, 1, 2] });
    render(<NumberArrayInput {...props} />);
    const field = screen.getByLabelText("Array values");
    await user.clear(field);
    await user.type(field, "9, 8, 7");
    await user.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith({ array: [9, 8, 7] });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows inline errors for non-numbers, too many values and empty input", async () => {
    const user = userEvent.setup();
    const { props, onApply } = harness(bubbleSort, { array: [3, 1, 2] });
    render(<NumberArrayInput {...props} />);
    const field = screen.getByLabelText("Array values");

    await user.clear(field);
    await user.type(field, "1, two, 3");
    await user.click(screen.getByRole("button", { name: /apply/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/"two" is not a whole number/);
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(onApply).not.toHaveBeenCalled();

    await user.clear(field);
    await user.type(field, Array.from({ length: 30 }, (_, i) => i).join(","));
    await user.click(screen.getByRole("button", { name: /apply/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/at most 24/);

    await user.clear(field);
    await user.click(screen.getByRole("button", { name: /apply/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/at least 1/);
  });

  it("generates presets and resets", async () => {
    const user = userEvent.setup();
    const { props, onApply, onReset } = harness(bubbleSort, { array: [3, 1, 2] });
    render(<NumberArrayInput {...props} />);
    await user.click(screen.getByRole("button", { name: "Reversed" }));
    const { array } = onApply.mock.calls.at(-1)[0];
    expect([...array].sort((a, b) => b - a)).toEqual(array);
    await user.click(screen.getByRole("button", { name: "Default" }));
    expect(onReset).toHaveBeenCalled();
  });
});

describe("SortedArrayTargetInput", () => {
  it("rejects unsorted input and the Sort array button fixes it", async () => {
    const user = userEvent.setup();
    const { props, onApply } = harness(binarySearch, { array: [1, 2, 3], target: 2 });
    render(<SortedArrayTargetInput {...props} />);
    const field = screen.getByLabelText("Sorted array");
    await user.clear(field);
    await user.type(field, "5, 1, 3");
    await user.click(screen.getByRole("button", { name: /^apply/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/sorted in ascending order/i);
    await user.click(screen.getByRole("button", { name: /sort array/i }));
    expect(onApply).toHaveBeenLastCalledWith({ array: [1, 3, 5], target: 2 });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("validates the target", async () => {
    const user = userEvent.setup();
    const { props } = harness(binarySearch, { array: [1, 2, 3], target: 2 });
    render(<SortedArrayTargetInput {...props} />);
    const target = screen.getByLabelText("Target");
    await user.clear(target);
    await user.type(target, "abc");
    await user.click(screen.getByRole("button", { name: /^apply/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/target must be a whole number/i);
  });
});

describe("GraphInput", () => {
  it("loads presets", async () => {
    const user = userEvent.setup();
    const { props, onApply } = harness(bfs, bfs.input.defaultValue);
    render(<GraphInput {...props} />);
    await user.click(screen.getByRole("button", { name: "Disconnected" }));
    expect(onApply.mock.calls[0][0].nodes).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("reports unknown nodes in edges", async () => {
    const user = userEvent.setup();
    const { props } = harness(bfs, bfs.input.defaultValue);
    render(<GraphInput {...props} />);
    const edges = screen.getByLabelText("Edges");
    await user.clear(edges);
    await user.type(edges, "A-Z");
    await user.click(screen.getByRole("button", { name: /^apply/i }));
    expect(within(screen.getByRole("alert")).getByText(/not in the node list/)).toBeInTheDocument();
  });

  it("reports malformed edges", async () => {
    const user = userEvent.setup();
    const { props } = harness(bfs, bfs.input.defaultValue);
    render(<GraphInput {...props} />);
    const edges = screen.getByLabelText("Edges");
    await user.clear(edges);
    await user.type(edges, "A+B");
    await user.click(screen.getByRole("button", { name: /^apply/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/is not an edge/);
  });
});

describe("keyboard shortcut guard", () => {
  const eventOn = (el, init = {}) => {
    const event = new KeyboardEvent("keydown", { key: " ", bubbles: true, ...init });
    Object.defineProperty(event, "target", { value: el });
    return event;
  };

  it("ignores typing contexts and modified keys but not the page body", () => {
    expect(shouldIgnoreShortcut(eventOn(document.createElement("input")))).toBe(true);
    expect(shouldIgnoreShortcut(eventOn(document.createElement("textarea")))).toBe(true);
    expect(shouldIgnoreShortcut(eventOn(document.createElement("select")))).toBe(true);
    const editable = document.createElement("div");
    Object.defineProperty(editable, "isContentEditable", { value: true });
    expect(shouldIgnoreShortcut(eventOn(editable))).toBe(true);
    expect(shouldIgnoreShortcut(eventOn(document.body, { ctrlKey: true }))).toBe(true);
    expect(shouldIgnoreShortcut(eventOn(document.body))).toBe(false);
  });

  it("leaves Space to focused buttons but still allows arrows", () => {
    const button = document.createElement("button");
    expect(shouldIgnoreShortcut(eventOn(button, { key: " " }))).toBe(true);
    expect(shouldIgnoreShortcut(eventOn(button, { key: "ArrowRight" }))).toBe(false);
    const slider = document.createElement("div");
    slider.setAttribute("role", "slider");
    expect(shouldIgnoreShortcut(eventOn(slider, { key: "ArrowRight" }))).toBe(true);
  });
});
