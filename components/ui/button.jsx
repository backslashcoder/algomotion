"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { buttonVariants } from "./button-variants";
import { cn } from "@/lib/utils"


function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
