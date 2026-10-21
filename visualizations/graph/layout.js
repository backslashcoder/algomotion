import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from "d3";

/**
 * Place nodes inside a width × height box.
 * Uses the supplied unit-square `positions` when every node has one; otherwise
 * runs a short d3-force simulation (synchronously, starting from a fixed circle
 * so the result is repeatable) and fits the result into the box.
 */
export function computeGraphLayout(graph, { width, height, padding = 48 }) {
  const { nodes, edges, positions } = graph;
  const place = (unit) => ({
    x: padding + unit.x * (width - padding * 2),
    y: padding + unit.y * (height - padding * 2),
  });

  if (positions && nodes.every((id) => positions[id])) {
    return Object.fromEntries(nodes.map((id) => [id, place(positions[id])]));
  }
  if (nodes.length === 1) {
    return { [nodes[0]]: { x: width / 2, y: height / 2 } };
  }

  const simNodes = nodes.map((id, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    return { id, x: Math.cos(angle) * 120, y: Math.sin(angle) * 120 };
  });
  const links = edges.map(([source, target]) => ({ source, target }));
  const simulation = forceSimulation(simNodes)
    .force("link", forceLink(links).id((d) => d.id).distance(110).strength(0.7))
    .force("charge", forceManyBody().strength(-320))
    .force("collide", forceCollide(34))
    .force("center", forceCenter(0, 0))
    .stop();
  for (let i = 0; i < 320; i += 1) simulation.tick();

  const xs = simNodes.map((d) => d.x);
  const ys = simNodes.map((d) => d.y);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  return Object.fromEntries(
    simNodes.map((d) => [
      d.id,
      place({ x: (d.x - minX) / spanX, y: (d.y - minY) / spanY }),
    ]),
  );
}
