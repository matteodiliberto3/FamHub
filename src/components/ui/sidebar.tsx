// @ts-nocheck
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { PanelLeft } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const SidebarContext = React.createContext(null)
function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider.")
  return context
}

const SidebarProvider = React.forwardRef(({ defaultOpen = true, className, style, children, ...props }, ref) => {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)
  const [open, setOpen] = React.useState(defaultOpen)
  const toggleSidebar = React.useCallback(() => isMobile ? setOpenMobile((o) => !o) : setOpen((o) => !o), [isMobile])
  const state = open ? "expanded" : "collapsed"
  const contextValue = React.useMemo(() => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }), [state, open, isMobile, openMobile, toggleSidebar])
  return <SidebarContext.Provider value={contextValue}><TooltipProvider delayDuration={0}><div style={style} className={cn("group/sidebar-wrapper flex min-h-svh w-full", className)} ref={ref} {...props}>{children}</div></TooltipProvider></SidebarContext.Provider>
})

const Sidebar = React.forwardRef(({ side = "left", className, children, ...props }, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()
  if (isMobile) return <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}><SheetContent className="w-[18rem] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden" side={side}><div className="flex h-full w-full flex-col">{children}</div></SheetContent></Sheet>
  return <div ref={ref} className={cn("group peer hidden text-sidebar-foreground md:block", className)} data-state={state}><div className="relative h-svh w-[16rem] bg-transparent transition-[width] duration-200 ease-linear" /><div className="fixed inset-y-0 z-10 hidden h-svh w-[16rem] transition-[left,right,width] duration-200 ease-linear md:flex"><div data-sidebar="sidebar" className="flex h-full w-full flex-col bg-sidebar">{children}</div></div></div>
})

const SidebarTrigger = React.forwardRef(({ className, onClick, asChild = false, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()
  return <Button ref={ref} data-sidebar="trigger" variant="ghost" size="icon" className={cn("h-7 w-7", className)} onClick={(e) => { onClick?.(e); toggleSidebar(); }} asChild={asChild} {...props}>{asChild ? <PanelLeft /> : <><PanelLeft /><span className="sr-only">Toggle Sidebar</span></>}</Button>
})

const SidebarRail = React.forwardRef(({ className, ...props }, ref) => <button ref={ref} data-sidebar="rail" className={cn("absolute inset-y-0 z-20 hidden w-4 sm:flex", className)} {...props} />)
const SidebarInset = React.forwardRef(({ className, ...props }, ref) => <main ref={ref} className={cn("relative flex min-h-svh flex-1 flex-col bg-background", className)} {...props} />)
const SidebarInput = React.forwardRef(({ className, ...props }, ref) => <Input ref={ref} data-sidebar="input" className={cn("h-8 w-full bg-background shadow-none", className)} {...props} />)
const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} data-sidebar="header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />)
const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} data-sidebar="footer" className={cn("flex flex-col gap-2 p-2", className)} {...props} />)
const SidebarSeparator = React.forwardRef(({ className, ...props }, ref) => <Separator ref={ref} data-sidebar="separator" className={cn("mx-2 w-auto bg-sidebar-border", className)} {...props} />)
const SidebarContent = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} data-sidebar="content" className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto", className)} {...props} />)
const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} data-sidebar="group" className={cn("relative flex w-full min-w-0 flex-col p-2", className)} {...props} />)
const SidebarGroupLabel = React.forwardRef(({ className, asChild = false, ...props }, ref) => { const Comp = asChild ? Slot : "div"; return <Comp ref={ref} data-sidebar="group-label" className={cn("flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium", className)} {...props} /> })
const SidebarGroupAction = React.forwardRef(({ className, asChild = false, ...props }, ref) => { const Comp = asChild ? Slot : "button"; return <Comp ref={ref} data-sidebar="group-action" className={cn("absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0", className)} {...props} /> })
const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} data-sidebar="group-content" className={cn("w-full text-sm", className)} {...props} />)
const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => <ul ref={ref} data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />)
const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => <li ref={ref} data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props} />)
const sidebarMenuButtonVariants = cva("peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding]")
const SidebarMenuButton = React.forwardRef(({ asChild = false, isActive = false, className, ...props }, ref) => { const Comp = asChild ? Slot : "button"; return <Comp ref={ref} data-sidebar="menu-button" data-active={isActive} className={cn(sidebarMenuButtonVariants(), className)} {...props} /> })
const SidebarMenuAction = React.forwardRef(({ className, asChild = false, ...props }, ref) => { const Comp = asChild ? Slot : "button"; return <Comp ref={ref} data-sidebar="menu-action" className={cn("absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0", className)} {...props} /> })
const SidebarMenuBadge = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} data-sidebar="menu-badge" className={cn("pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium", className)} {...props} />)
const SidebarMenuSkeleton = React.forwardRef(({ className, showIcon = false, ...props }, ref) => <div ref={ref} data-sidebar="menu-skeleton" className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)} {...props}>{showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}<Skeleton className="h-4 flex-1" data-sidebar="menu-skeleton-text" /></div>)
const SidebarMenuSub = React.forwardRef(({ className, ...props }, ref) => <ul ref={ref} data-sidebar="menu-sub" className={cn("mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5", className)} {...props} />)
const SidebarMenuSubItem = React.forwardRef(({ ...props }, ref) => <li ref={ref} {...props} />)
const SidebarMenuSubButton = React.forwardRef(({ asChild = false, className, ...props }, ref) => { const Comp = asChild ? Slot : "a"; return <Comp ref={ref} data-sidebar="menu-sub-button" className={cn("flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2", className)} {...props} /> })

export { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar }

