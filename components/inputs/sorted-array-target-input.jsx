"use client";

import { useId, useState } from "react";
import { ArrowUpAZ, Check, Dices, RotateCcw, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "./field-error";
import { parseNumberList } from "@/algorithms/shared/array-input";

function randomSorted(length, random = Math.random) {
  const set = new Set();
  while (set.size < length) set.add(1 + Math.floor(random() * 99));
  return [...set].sort((a, b) => a - b);
}

/** Editor for `{ array, target }` inputs (searching algorithms on sorted data). */
export function SortedArrayTargetInput({ definition, input, onApply, onReset }) {
  const fieldId = useId();
  const targetId = useId();
  const { minLength, maxLength } = definition.input.limits;
  const [text, setText] = useState(input.array.join(", "));
  const [target, setTarget] = useState(String(input.target));
  const [errors, setErrors] = useState([]);

  const [syncedInput, setSyncedInput] = useState(input);
  if (syncedInput !== input) {
    setSyncedInput(input);
    setText(input.array.join(", "));
    setTarget(String(input.target));
    setErrors([]);
  }

  function apply(array, targetValue) {
    const res = onApply({ array, target: targetValue });
    setErrors(res.ok ? [] : res.error.messages);
  }

  function read() {
    const parsed = parseNumberList(text);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return null;
    }
    if (!/^-?\d+$/.test(target.trim())) {
      setErrors(["Target must be a whole number."]);
      return null;
    }
    return { array: parsed.values, target: Number(target) };
  }

  function submit(event) {
    event.preventDefault();
    const value = read();
    if (value) apply(value.array, value.target);
  }

  function sortArray() {
    const parsed = parseNumberList(text);
    if (!parsed.ok) return setErrors(parsed.errors);
    const sorted = [...parsed.values].sort((a, b) => a - b);
    setText(sorted.join(", "));
    const targetNumber = /^-?\d+$/.test(target.trim()) ? Number(target) : 0;
    apply(sorted, targetNumber);
  }

  function randomise(pick) {
    const array = randomSorted(Math.min(Math.max(input.array.length, 8), 14));
    const chosen =
      pick === "present"
        ? array[Math.floor(Math.random() * array.length)]
        : (() => {
            let t;
            do t = 1 + Math.floor(Math.random() * 99);
            while (array.includes(t));
            return t;
          })();
    apply(array, chosen);
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium">
          Sorted array
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
          {minLength}–{maxLength} whole numbers in ascending order.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <label htmlFor={targetId} className="block text-sm font-medium">
            Target
          </label>
          <Input
            id={targetId}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-28 font-mono"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <Button type="submit" size="lg">
          <Check data-icon="inline-start" aria-hidden="true" />
          Apply
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={sortArray}>
          <ArrowUpAZ data-icon="inline-start" aria-hidden="true" />
          Sort array
        </Button>
      </div>
      <FieldError id={`${fieldId}-error`} messages={errors} />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="lg" onClick={() => randomise("present")}>
          <Dices data-icon="inline-start" aria-hidden="true" />
          Random (target present)
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => randomise("missing")}>
          <Target data-icon="inline-start" aria-hidden="true" />
          Random (target missing)
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={onReset}>
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          Default
        </Button>
      </div>
    </form>
  );
}
