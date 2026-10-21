"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Icon-only button with an accessible name and a tooltip (label + optional shortcut). */
export function IconButton({ label, shortcut, children, ...props }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button aria-label={label} {...props} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && (
          <kbd className="rounded bg-background/20 px-1 font-mono text-[10px]">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
