// @ts-nocheck
"use client";
import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

const THEMES = { light: "", dark: ".dark" }
const ChartContext = React.createContext(null)
function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error("useChart must be used within a <ChartContainer />")
  return context
}

const ChartContainer = React.forwardRef(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`
  return (
    <ChartContext.Provider value={{ config }}>
      <div data-chart={chartId} ref={ref} className={cn("flex aspect-video justify-center text-xs", className)} {...props}>
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(([, c]) => c.theme || c.color)
  if (!colorConfig.length) return null
  return (
    <style dangerouslySetInnerHTML={{ __html: Object.entries(THEMES).map(([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig.map(([key, itemConfig]) => {
const color = itemConfig.theme?.[theme] || itemConfig.color
return color ? `  --color-${key}: ${color};` : null
}).join("\n")}
}
`).join("\n") }} />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip
const ChartLegend = RechartsPrimitive.Legend

const ChartTooltipContent = React.forwardRef(({ active, payload, className }, ref) => {
  if (!active || !payload?.length) return null
  return <div ref={ref} className={cn("grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl", className)}>{payload.map((item) => <div key={item.dataKey}>{item.name}: {item.value}</div>)}</div>
})
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegendContent = React.forwardRef(({ className, payload }, ref) => {
  const { config } = useChart()
  if (!payload?.length) return null
  return <div ref={ref} className={cn("flex items-center justify-center gap-4", className)}>{payload.map((item) => <div key={item.value}>{config[item.dataKey]?.label || item.value}</div>)}</div>
})
ChartLegendContent.displayName = "ChartLegend"

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle }

