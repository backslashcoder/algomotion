import { describe, it, expect } from "vitest";
import { bfs, GRAPH_PRESETS, parseEdgeList, parseNodeList } from "@/algorithms/graphs/bfs";
import { generateTrace, tryGenerateTrace } from "@/engine/trace-generator";

const graph = (nodes, edges, start = nodes[0], directed = false) => ({
  nodes,
  edges,
  start,
  directed,
});

// independent reference implementation
function referenceDistances(nodes, edges, start, directed) {
  const adj = Object.fromEntries(nodes.map((n) => [n, []]));
  edges.forEach(([a, b]) => {
    adj[a].push(b);
    if (!directed) adj[b].push(a);
  });
  const dist = { [start]: 0 };
  const queue = [start];
  while (queue.length) {
    const u = queue.shift();
    adj[u].forEach((v) => {
      if (!(v in dist)) {
        dist[v] = dist[u] + 1;
        queue.push(v);
      }
    });
  }
  return dist;
}

describe("BFS", () => {
  it("traverses the layered tree level by level", () => {
    const trace = generateTrace(bfs, bfs.input.defaultValue);
    expect(trace.result.order).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
    expect(trace.result.dist).toEqual({ A: 0, B: 1, C: 1, D: 2, E: 2, F: 2, G: 2 });
  });

  it.each(GRAPH_PRESETS.map((p) => [p.label, p.value]))(
    "preset %s matches the reference distances",
    (_label, value) => {
      const trace = generateTrace(bfs, value);
      expect(trace.result.dist).toEqual(
        referenceDistances(value.nodes, value.edges, value.start, value.directed),
      );
    },
  );

  it("never visits a node twice and only visits reachable nodes", () => {
    const g = graph(["A", "B", "C", "D", "E"], [["A", "B"], ["B", "C"], ["C", "A"], ["D", "E"]]);
    const { result } = generateTrace(bfs, g);
    expect(new Set(result.order).size).toBe(result.order.length);
    expect([...result.order].sort()).toEqual(["A", "B", "C"]);
    expect(result.unreachable).toEqual(["D", "E"]);
  });

  it("handles disconnected graphs and says which nodes are unreachable", () => {
    const trace = generateTrace(bfs, GRAPH_PRESETS[2].value);
    expect(trace.result.unreachable).toEqual(["D", "E", "F"]);
    expect(trace.steps.at(-1).explanation).toContain("D, E, F cannot be reached");
    expect(trace.states.at(-1).status.D).toBe("unvisited");
  });

  it("handles a single node and an isolated start", () => {
    const trace = generateTrace(bfs, graph(["A"], []));
    expect(trace.result.order).toEqual(["A"]);
    expect(trace.steps.some((s) => s.type === "no-neighbours")).toBe(true);
    const isolated = generateTrace(bfs, graph(["A", "B"], [["B", "A"]], "A", true));
    expect(isolated.result.order).toEqual(["A"]);
    expect(isolated.result.unreachable).toEqual(["B"]);
  });

  it("respects edge direction", () => {
    const g = graph(["A", "B", "C"], [["A", "B"], ["C", "B"]], "A", true);
    expect(generateTrace(bfs, g).result.order).toEqual(["A", "B"]);
  });

  it("counts metrics consistently", () => {
    const trace = generateTrace(bfs, GRAPH_PRESETS[1].value);
    const { metrics, result } = trace;
    expect(metrics.visited).toBe(result.order.length);
    expect(metrics.discovered).toBe(result.order.length);
    // every undirected edge is examined once from each endpoint of a visited node
    expect(metrics.edgesExamined).toBe(GRAPH_PRESETS[1].value.edges.length * 2);
    expect(metrics.queueSize).toBe(0);
  });

  it("keeps queue and status consistent in every state", () => {
    const trace = generateTrace(bfs, GRAPH_PRESETS[1].value);
    for (const s of trace.states) {
      s.queue.forEach((id) => expect(s.status[id]).toBe("queued"));
      s.order.forEach((id) => expect(s.status[id]).toBe("visited"));
    }
  });

  it("explains why a neighbour is discovered or skipped", () => {
    const trace = generateTrace(bfs, GRAPH_PRESETS[1].value);
    const text = trace.steps.map((s) => s.explanation);
    expect(text.some((t) => /has not been discovered yet/.test(t))).toBe(true);
    expect(text.some((t) => /skip it/.test(t))).toBe(true);
    expect(text.some((t) => /discovered through A, so its distance is 1/.test(t))).toBe(true);
  });

  describe("input contract", () => {
    it.each([
      ["no nodes", { nodes: [], edges: [], start: "A" }],
      ["unknown edge endpoint", graph(["A"], [["A", "Z"]])],
      ["self loop", graph(["A", "B"], [["A", "A"]])],
      ["duplicate nodes", graph(["A", "A"], [])],
      ["unknown start", graph(["A"], [], "Q")],
      ["bad node name", graph(["TOOLONG"], [])],
      ["too many nodes", graph(Array.from({ length: 13 }, (_, i) => `N${i}`), [])],
    ])("rejects %s", (_label, input) => {
      expect(bfs.input.validate(input).ok).toBe(false);
      expect(tryGenerateTrace(bfs, input).error.kind).toBe("input");
    });

    it("drops duplicate undirected edges", () => {
      const res = bfs.input.validate(graph(["A", "B"], [["A", "B"], ["B", "A"]]));
      expect(res.value.edges).toHaveLength(1);
    });
  });

  describe("text parsing", () => {
    it("parses edge lists", () => {
      expect(parseEdgeList("A-B, B-C\nC-D")).toEqual({
        ok: true,
        edges: [["A", "B"], ["B", "C"], ["C", "D"]],
      });
      expect(parseEdgeList("A-B, nope").ok).toBe(false);
    });
    it("parses node lists", () => {
      expect(parseNodeList("A, B C").nodes).toEqual(["A", "B", "C"]);
      expect(parseNodeList("A, bad!").ok).toBe(false);
    });
  });
});
