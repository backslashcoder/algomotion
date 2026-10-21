import { NumberArrayInput } from "./number-array-input";
import { SortedArrayTargetInput } from "./sorted-array-target-input";
import { GraphInput } from "./graph-input";

/**
 * Input editor registry: maps `definition.inputEditor` to an editor component.
 * Editor props: { definition, input, onApply(rawInput) -> {ok, error?}, onReset() }
 */
export const EDITORS = {
  "number-array": NumberArrayInput,
  "sorted-array-target": SortedArrayTargetInput,
  graph: GraphInput,
};

export function getInputEditor(id) {
  return EDITORS[id] ?? null;
}
