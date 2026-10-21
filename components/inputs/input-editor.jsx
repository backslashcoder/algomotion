"use client";

import { EDITORS } from "./registry";

/** Renders the editor an algorithm declared via `inputEditor`, or nothing if unknown. */
export function InputEditor({ editor, ...props }) {
  const Editor = EDITORS[editor];
  return Editor ? <Editor {...props} /> : null;
}
