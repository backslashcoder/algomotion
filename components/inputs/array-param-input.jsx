"use client";

import { useId, useState } from "react";
import { ArrowUpAZ, Check, Dices, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "./field-error";
import { parseNumberList } from "@/algorithms/shared/array-input";

/**
 * Editor for `{ array, [param.key]: number }` inputs (two pointers, sliding window, lower bound…).
 * Configured entirely by the definition:
 *   input.param          { key, label, help }   the extra numeric parameter
 *   input.requiresSorted shows a "Sort array" button
 *   input.examples       [{ label, build() → raw input }] example buttons
 */
export function ArrayParamInput({ definition, input, onApply, onReset }) {
  const fieldId = useId();
  const paramId = useId();
  const { param, requiresSorted, examples = [], limits } = definition.input;
  const [text, setText] = useState(input.array.join(", "));
  const [paramText, setParamText] = useState(String(input[param.key]));
  const [errors, setErrors] = useState([]);

  const [syncedInput, setSyncedInput] = useState(input);
  if (syncedInput !== input) {
    setSyncedInput(input);
    setText(input.array.join(", "));
    setParamText(String(input[param.key]));
    setErrors([]);
  }

  function apply(array, paramValue) {
    const res = onApply({ array, [param.key]: paramValue });
    setErrors(res.ok ? [] : res.error.messages);
  }

  function read() {
    const parsed = parseNumberList(text);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return null;
    }
    if (!/^-?\d+$/.test(paramText.trim())) {
      setErrors([`${param.label} must be a whole number.`]);
      return null;
    }
    return { array: parsed.values, value: Number(paramText) };
  }

  function submit(event) {
    event.preventDefault();
    const draft = read();
    if (draft) apply(draft.array, draft.value);
  }

  function sortArray() {
    const parsed = parseNumberList(text);
    if (!parsed.ok) return setErrors(parsed.errors);
    const sorted = [...parsed.values].sort((a, b) => a - b);
    const value = /^-?\d+$/.test(paramText.trim()) ? Number(paramText) : 0;
    setText(sorted.join(", "));
    apply(sorted, value);
  }

  function applyExample(example) {
    const raw = example.build();
    const res = onApply(raw);
    setErrors(res.ok ? [] : res.error.messages);
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium">
          {requiresSorted ? "Sorted array" : "Array values"}
        </label>
        <Input
          id={fieldId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="font-mono"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={errors.length > 0}
          aria-describedby={`${fieldId}-help ${fieldId}-error`}
        />
        <p id={`${fieldId}-help`} className="text-xs text-muted-foreground">
          {limits.minLength}–{limits.maxLength} whole numbers from {limits.minValue} to{" "}
          {limits.maxValue}
          {requiresSorted ? ", in ascending order" : ""}.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <label htmlFor={paramId} className="block text-sm font-medium">
            {param.label}
          </label>
          <Input
            id={paramId}
            value={paramText}
            onChange={(e) => setParamText(e.target.value)}
            className="w-28 font-mono"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <Button type="submit" size="lg">
          <Check data-icon="inline-start" aria-hidden="true" />
          Apply
        </Button>
        {requiresSorted && (
          <Button type="button" variant="outline" size="lg" onClick={sortArray}>
            <ArrowUpAZ data-icon="inline-start" aria-hidden="true" />
            Sort array
          </Button>
        )}
      </div>
      {param.help && <p className="text-xs text-muted-foreground">{param.help}</p>}
      <FieldError id={`${fieldId}-error`} messages={errors} />

      <div className="flex flex-wrap gap-2">
        {examples.map((example, i) => (
          <Button key={example.label} type="button" variant="outline" size="lg" onClick={() => applyExample(example)}>
            {i === 0 && <Dices data-icon="inline-start" aria-hidden="true" />}
            {example.label}
          </Button>
        ))}
        <Button type="button" variant="ghost" size="lg" onClick={onReset}>
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          Default
        </Button>
      </div>
    </form>
  );
}
