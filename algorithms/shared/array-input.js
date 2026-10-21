export const ARRAY_LIMITS = Object.freeze({
  minLength: 1,
  maxLength: 24,
  minValue: -99,
  maxValue: 999,
});

/** Parse "5, 3 8;1" into numbers. Returns `{ ok, values }` or `{ ok: false, errors }`. */
export function parseNumberList(text) {
  const tokens = String(text ?? "")
    .split(/[\s,;]+/)
    .filter(Boolean);
  const bad = tokens.filter((t) => !/^-?\d+$/.test(t));
  if (bad.length > 0) {
    return {
      ok: false,
      errors: [
        `"${bad[0]}" is not a whole number. Use integers separated by commas.`,
      ],
    };
  }
  return { ok: true, values: tokens.map(Number) };
}

/** Validate an array of integers against the shared limits. Returns a list of errors. */
export function validateIntegerArray(array, limits = ARRAY_LIMITS) {
  const errors = [];
  if (!Array.isArray(array)) return ["Input must be a list of numbers."];
  if (array.length < limits.minLength) {
    errors.push(`Enter at least ${limits.minLength} number.`);
  }
  if (array.length > limits.maxLength) {
    errors.push(
      `Use at most ${limits.maxLength} numbers so the visualization stays readable (you entered ${array.length}).`,
    );
  }
  if (array.some((v) => !Number.isInteger(v))) {
    errors.push("Every value must be a whole number.");
  } else if (
    array.some((v) => v < limits.minValue || v > limits.maxValue)
  ) {
    errors.push(
      `Values must be between ${limits.minValue} and ${limits.maxValue}.`,
    );
  }
  return errors;
}

/** Give each value a stable id so renderers can track elements as they move. */
export function makeItems(values) {
  return values.map((value, i) => ({ id: `e${i}`, value }));
}

export function isSortedAscending(array) {
  return array.every((v, i) => i === 0 || array[i - 1] <= v);
}

export function range(start, end) {
  const out = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

/** Sample inputs offered by the array editors. */
export function generateArrayPreset(kind, length = 10, random = Math.random) {
  const randInt = (lo, hi) => lo + Math.floor(random() * (hi - lo + 1));
  switch (kind) {
    case "random":
      return Array.from({ length }, () => randInt(1, 99));
    case "sorted":
      return Array.from({ length }, (_, i) => (i + 1) * 5);
    case "reversed":
      return Array.from({ length }, (_, i) => (length - i) * 5);
    case "duplicates":
      return Array.from({ length }, () => [10, 20, 30][randInt(0, 2)]);
    default:
      return [];
  }
}
