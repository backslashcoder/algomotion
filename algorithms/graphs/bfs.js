export const GRAPH_LIMITS = Object.freeze({ maxNodes: 12, maxEdges: 30 });

/** Parse "A-B, B-C" into edge pairs. Returns `{ ok, edges }` or `{ ok: false, errors }`. */
export function parseEdgeList(text) {
  const tokens = String(text ?? "")
    .split(/[\s,;]+/)
    .filter(Boolean);
  const edges = [];
  for (const token of tokens) {
    const match = /^([A-Za-z0-9_]+)[-–>]+([A-Za-z0-9_]+)$/.exec(token);
    if (!match) {
      return {
        ok: false,
        errors: [`"${token}" is not an edge. Write edges like A-B, B-C.`],
      };
    }
    edges.push([match[1], match[2]]);
  }
  return { ok: true, edges };
}

/** Parse "A, B, C" into unique node ids. */
export function parseNodeList(text) {
  const tokens = String(text ?? "")
    .split(/[\s,;]+/)
    .filter(Boolean);
  const bad = tokens.find((t) => !/^[A-Za-z0-9_]{1,3}$/.test(t));
  if (bad) {
    return {
      ok: false,
      errors: [`"${bad}" is not a valid node name (use 1–3 letters or digits).`],
    };
  }
  return { ok: true, nodes: tokens };
}

/** Example graphs shown in the editor. Positions are in the unit square. */
export const GRAPH_PRESETS = [
  {
    id: "tree",
    label: "Layered tree",
    value: {
      nodes: ["A", "B", "C", "D", "E", "F", "G"],
      edges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"]],
      directed: false,
      start: "A",
      positions: {
        A: { x: 0.5, y: 0.1 },
        B: { x: 0.27, y: 0.43 },
        C: { x: 0.73, y: 0.43 },
        D: { x: 0.14, y: 0.8 },
        E: { x: 0.4, y: 0.8 },
        F: { x: 0.6, y: 0.8 },
        G: { x: 0.86, y: 0.8 },
      },
    },
  },
  {
    id: "cycle",
    label: "Cycles & shortcuts",
    value: {
      nodes: ["A", "B", "C", "D", "E", "F"],
      edges: [["A", "B"], ["A", "C"], ["B", "C"], ["B", "D"], ["C", "E"], ["D", "E"], ["E", "F"]],
      directed: false,
      start: "A",
      positions: {
        A: { x: 0.1, y: 0.5 },
        B: { x: 0.32, y: 0.15 },
        C: { x: 0.32, y: 0.85 },
        D: { x: 0.62, y: 0.15 },
        E: { x: 0.62, y: 0.85 },
        F: { x: 0.9, y: 0.5 },
      },
    },
  },
  {
    id: "disconnected",
    label: "Disconnected",
    value: {
      nodes: ["A", "B", "C", "D", "E", "F"],
      edges: [["A", "B"], ["A", "C"], ["B", "C"], ["D", "E"], ["E", "F"]],
      directed: false,
      start: "A",
      positions: {
        A: { x: 0.14, y: 0.25 },
        B: { x: 0.36, y: 0.75 },
        C: { x: 0.04, y: 0.8 },
        D: { x: 0.62, y: 0.2 },
        E: { x: 0.78, y: 0.55 },
        F: { x: 0.94, y: 0.85 },
      },
    },
  },
];

const NODE_PATTERN = /^[A-Za-z0-9_]{1,3}$/;

export const bfs = {
  id: "bfs",
  slug: "breadth-first-search",
  name: "Breadth-First Search",
  category: "graphs",
  technique: "graph-traversal",
  difficulty: "intermediate",
  keywords: ["bfs", "graph", "traversal", "queue", "shortest path", "level order"],
  shortDescription:
    "Explores a graph level by level from a start node, using a queue to visit nearer nodes first.",
  problem:
    "Starting from one node, visit every node reachable from it in order of increasing distance (number of edges).",
  whenToUse:
    "Finding shortest paths in unweighted graphs, level-order traversal, connected components, and any search where closer solutions should be found first.",
  complexity: {
    time: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
    space: "O(V)",
  },
  visualization: { type: "graph", config: {} },
  inputEditor: "graph",
  pseudocode: [
    { id: "proc", text: "procedure BFS(G, start)", indent: 0 },
    { id: "start", text: "mark start discovered; enqueue(Q, start)", indent: 1 },
    { id: "while", text: "while Q is not empty", indent: 1 },
    { id: "dequeue", text: "u ← dequeue(Q)", indent: 2 },
    { id: "visit", text: "visit(u)", indent: 2 },
    { id: "for", text: "for each neighbour v of u", indent: 2 },
    { id: "if", text: "if v is not discovered", indent: 3 },
    { id: "discover", text: "mark v discovered; enqueue(Q, v)", indent: 4 },
    { id: "done", text: "return visit order", indent: 1 },
  ],
  metrics: [
    { key: "discovered", label: "Discovered", description: "Nodes that have been added to the queue (including the start)." },
    { key: "visited", label: "Visited", description: "Nodes that have been dequeued and processed." },
    { key: "edgesExamined", label: "Edges examined", description: "Edge checks from a visited node to a neighbour." },
    { key: "queueSize", label: "Queue size", description: "Nodes currently waiting in the queue." },
  ],
  input: {
    defaultValue: GRAPH_PRESETS[0].value,
    limits: GRAPH_LIMITS,
    validate(raw) {
      const errors = [];
      const nodes = raw?.nodes;
      if (!Array.isArray(nodes) || nodes.length === 0) {
        return { ok: false, errors: ["Add at least one node."] };
      }
      if (nodes.length > GRAPH_LIMITS.maxNodes) {
        errors.push(`Use at most ${GRAPH_LIMITS.maxNodes} nodes (you entered ${nodes.length}).`);
      }
      if (nodes.some((n) => typeof n !== "string" || !NODE_PATTERN.test(n))) {
        errors.push("Node names must be 1–3 letters or digits.");
      }
      if (new Set(nodes).size !== nodes.length) errors.push("Node names must be unique.");
      const known = new Set(nodes);
      const edges = Array.isArray(raw.edges) ? raw.edges : [];
      if (edges.length > GRAPH_LIMITS.maxEdges) {
        errors.push(`Use at most ${GRAPH_LIMITS.maxEdges} edges.`);
      }
      for (const edge of edges) {
        const [a, b] = edge ?? [];
        if (!known.has(a) || !known.has(b)) {
          errors.push(`Edge ${a}-${b} uses a node that is not in the node list.`);
          break;
        }
        if (a === b) {
          errors.push(`Edge ${a}-${b} connects a node to itself, which BFS does not need.`);
          break;
        }
      }
      if (!known.has(raw.start)) {
        errors.push(`Start node "${raw.start}" is not in the node list.`);
      }
      if (errors.length) return { ok: false, errors };

      // drop duplicate edges (undirected: A-B equals B-A)
      const seen = new Set();
      const unique = [];
      for (const [a, b] of edges) {
        const key = raw.directed ? `${a}>${b}` : [a, b].sort().join("-");
        if (!seen.has(key)) {
          seen.add(key);
          unique.push([a, b]);
        }
      }
      return {
        ok: true,
        value: {
          nodes: [...nodes],
          edges: unique,
          directed: Boolean(raw.directed),
          start: raw.start,
          ...(raw.positions ? { positions: raw.positions } : {}),
        },
      };
    },
  },
  describeInput: ({ nodes, edges, start }) =>
    `Graph with ${nodes.length} nodes and ${edges.length} edges. Breadth-first search will start from node ${start}.`,
  createInitialState: ({ nodes, edges, directed, start, positions }) => ({
    graph: { nodes, edges, directed, start, positions: positions ?? null },
    status: Object.fromEntries(nodes.map((id) => [id, "unvisited"])),
    queue: [],
    order: [],
    dist: {},
    treeEdges: [],
  }),

  run({ nodes, edges, directed, start }, tracer) {
    const index = new Map(nodes.map((id, i) => [id, i]));
    const adjacency = new Map(nodes.map((id) => [id, []]));
    for (const [a, b] of edges) {
      adjacency.get(a).push(b);
      if (!directed) adjacency.get(b).push(a);
    }
    for (const list of adjacency.values()) list.sort((x, y) => index.get(x) - index.get(y));

    const status = Object.fromEntries(nodes.map((id) => [id, "unvisited"]));
    const dist = {};
    const queue = [];
    const order = [];
    const treeEdges = [];
    const snapshot = () => ({
      status: { ...status },
      queue: [...queue],
      order: [...order],
      dist: { ...dist },
      treeEdges: treeEdges.map((e) => [...e]),
    });
    const vars = (extra = {}) => ({
      queue: `[${queue.join(", ")}]`,
      order: `[${order.join(", ")}]`,
      ...extra,
    });

    status[start] = "queued";
    dist[start] = 0;
    queue.push(start);
    tracer.count("discovered");
    tracer.setMetric("queueSize", queue.length);
    tracer.emit({
      type: "discover-start",
      line: "start",
      explanation: `Mark ${start} as discovered (distance 0) and put it in the queue.`,
      patch: snapshot(),
      focus: { current: start },
      variables: vars(),
    });

    while (queue.length > 0) {
      const u = queue.shift();
      tracer.setMetric("queueSize", queue.length);
      status[u] = "current";
      tracer.emit({
        type: "dequeue",
        line: "dequeue",
        explanation: `Take ${u} from the front of the queue. It is ${dist[u]} edge${dist[u] === 1 ? "" : "s"} from ${start}.`,
        patch: snapshot(),
        focus: { current: u },
        variables: vars({ u }),
      });

      status[u] = "visited";
      order.push(u);
      tracer.count("visited");
      tracer.emit({
        type: "visit",
        line: "visit",
        explanation: `Visit ${u}: it is number ${order.length} in the traversal order.`,
        patch: snapshot(),
        focus: { current: u },
        variables: vars({ u }),
      });

      const neighbours = adjacency.get(u);
      if (neighbours.length === 0) {
        tracer.emit({
          type: "no-neighbours",
          line: "for",
          explanation: `${u} has no ${directed ? "outgoing edges" : "neighbours"}, so there is nothing to explore from it.`,
          focus: { current: u },
          variables: vars({ u }),
        });
      }
      for (const v of neighbours) {
        tracer.count("edgesExamined");
        const isNew = status[v] === "unvisited";
        tracer.emit({
          type: "examine-edge",
          line: "if",
          explanation: isNew
            ? `Examine the edge ${u} → ${v}. ${v} has not been discovered yet.`
            : `Examine the edge ${u} → ${v}. ${v} is already ${status[v] === "queued" ? "in the queue" : "visited"}, so skip it.`,
          focus: { current: u, examining: [u, v] },
          variables: vars({ u, v }),
        });
        if (isNew) {
          status[v] = "queued";
          dist[v] = dist[u] + 1;
          queue.push(v);
          treeEdges.push([u, v]);
          tracer.count("discovered");
          tracer.setMetric("queueSize", queue.length);
          tracer.emit({
            type: "discover",
            line: "discover",
            explanation: `${v} is discovered through ${u}, so its distance is ${dist[v]}. Add it to the back of the queue.`,
            patch: snapshot(),
            focus: { current: u, examining: [u, v], discovering: v },
            variables: vars({ u, v }),
          });
        }
      }
    }

    const unreachable = nodes.filter((id) => status[id] === "unvisited");
    tracer.emit({
      type: "complete",
      line: "done",
      explanation:
        unreachable.length === 0
          ? `The queue is empty. Traversal order: ${order.join(" → ")}. Every node was reached.`
          : `The queue is empty. Traversal order: ${order.join(" → ")}. ${unreachable.join(", ")} cannot be reached from ${start}.`,
      patch: snapshot(),
      variables: vars(),
    });
    return { order, dist, unreachable };
  },
};
