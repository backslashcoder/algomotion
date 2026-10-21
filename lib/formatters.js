export const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : "";

/** Case-insensitive search across an algorithm's name, description and keywords. */
export function matchesQuery(definition, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    definition.name,
    definition.shortDescription,
    definition.category,
    (definition.technique ?? "").replace(/-/g, " "),
    ...(definition.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((term) => haystack.includes(term));
}
