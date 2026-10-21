"use client";

import { useId, useState } from "react";
import { Dices, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "./field-error";
import {
  generateArrayPreset,
  parseNumberList,
} from "@/algorithms/shared/array-input";

const PRESETS = [
  { kind: "random", label: "Random" },
  { kind: "sorted", label: "Sorted" },
  { kind: "reversed", label: "Reversed" },
  { kind: "duplicates", label: "Many duplicates" },
];

/** Editor for `{ array }` inputs (sorting algorithms). */
export function NumberArrayInput({ definition, input, onApply, onReset }) {
  const fieldId = useId();
  const sizeId = useId();
  const { minLength, maxLength, minValue, maxValue } = definition.input.limits;
  const examples = definition.input.examples;
  const [text, setText] = useState(input.array.join(", "));
  const [size, setSize] = useState(Math.min(Math.max(input.array.length, 5), 12));
  const [errors, setErrors] = useState([]);

  // resync the draft when a new valid input arrives (React's "adjust state during render" pattern)
  const [syncedInput, setSyncedInput] = useState(input);
  if (syncedInput !== input) {
    setSyncedInput(input);
    setText(input.array.join(", "));
    setErrors([]);
  }

  function apply(array) {
    const res = onApply({ array });
    setErrors(res.ok ? [] : res.error.messages);
    return res;
  }

  function submit(event) {
    event.preventDefault();
    const parsed = parseNumberList(text);
    if (!parsed.ok) return setErrors(parsed.errors);
    apply(parsed.values);
  }

  function applyExample(example) {
    const res = onApply(example.build());
    setErrors(res.ok ? [] : res.error.messages);
  }

  function preset(kind) {
    const length = Math.min(Math.max(Number(size) || 8, minLength), maxLength);
    apply(generateArrayPreset(kind, length));
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium">
          Array values
        </label>
        <div className="flex gap-2">
          <Input
            id={fieldId}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="font-mono"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={errors.length > 0}
            aria-describedby={`${fieldId}-help ${fieldId}-error`}
          />
          <Button type="submit" size="lg">
            <Check data-icon="inline-start" aria-hidden="true" />
            Apply
          </Button>
        </div>
        <p id={`${fieldId}-help`} className="text-xs text-muted-foreground">
          {minLength}–{maxLength} whole numbers from {minValue} to {maxValue}, separated by commas.{definition.input.note ? ` ${definition.input.note}` : ""}
        </p>
        <FieldError id={`${fieldId}-error`} messages={errors} />
      </div>

      <div className="flex flex-wrap items-end gap-2">
        {examples ? (
          examples.map((example, i) => (
            <Button key={example.label} type="button" variant="outline" size="lg" onClick={() => applyExample(example)}>
              {i === 0 && <Dices data-icon="inline-start" aria-hidden="true" />}
              {example.label}
            </Button>
          ))
        ) : (
          <>
            <div className="space-y-1">
              <label htmlFor={sizeId} className="block text-xs text-muted-foreground">
                Size
              </label>
              <Input
                id={sizeId}
                type="number"
                min={minLength}
                max={maxLength}
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-20 font-mono"
              />
            </div>
            {PRESETS.map((p) => (
              <Button key={p.kind} type="button" variant="outline" size="lg" onClick={() => preset(p.kind)}>
                {p.kind === "random" && <Dices data-icon="inline-start" aria-hidden="true" />}
                {p.label}
              </Button>
            ))}
          </>
        )}
        <Button type="button" variant="ghost" size="lg" onClick={onReset}>
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          Default
        </Button>
      </div>
    </form>
  );
}
