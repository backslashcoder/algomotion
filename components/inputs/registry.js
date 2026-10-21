import { NumberArrayInput } from "./number-array-input";
import { SortedArrayTargetInput } from "./sorted-array-target-input";
import { GraphInput } from "./graph-input";
import { ArrayParamInput } from "./array-param-input";

/**
 * Input editor registry: maps `definition.inputEditor` to an editor component.
 * Editor props: { definition, input, onApply(rawInput) -> {ok, error?}, onReset() }
 */
export const EDITORS = {
  "number-array": NumberArrayInput,
  "sorted-array-target": SortedArrayTargetInput,
  "array-param": ArrayParamInput,
  graph: GraphInput,
};

export function getInputEditor(id) {
  return EDITORS[id] ?? null;
}
