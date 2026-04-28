// @ts-nocheck
"use client"
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger
const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground origin-[var(--radix-tooltip-content-transform-origin)] transition-[opacity,transform] duration-150 ease-out-strong data-[state=closed]:opacity-0 data-[state=open]:opacity-100 data-[state=closed]:scale-[0.97] data-[state=open]:scale-100",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))

const DilihubTooltipProvider = ({ children, ...props }) => (
  <TooltipProvider delayDuration={550} skipDelayDuration={90} {...props}>
    {children}
  </TooltipProvider>
);

export { Tooltip, TooltipTrigger, TooltipContent, DilihubTooltipProvider as TooltipProvider }

