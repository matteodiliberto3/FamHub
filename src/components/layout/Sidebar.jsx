import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  HandHeart,
  CalendarDays,
  ShoppingCart,
  Palmtree,
  Users,
  Menu,
  X,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/finanze', label: 'Finanze', icon: Wallet },
  { path: '/permessi', label: 'Permessi Uscita', icon: HandHeart },
  { path: '/calendario', label: 'Calendario', icon: CalendarDays },
  { path: '/spesa', label: 'Lista Spesa', icon: ShoppingCart },
  { path: '/figli', label: 'Gestione Figli', icon: Users },
  { path: '/budget', label: 'Budget & Gite', icon: Palmtree },
];

export default function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-card/95 backdrop-blur rounded-xl shadow-sm border border-border/80 transition-transform duration-150 ease-out-strong active:scale-[0.97]"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40 transition-opacity duration-200 ease-out-strong"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border/80 z-50 flex flex-col transition-transform duration-300 ease-drawer",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-5 py-6 flex items-center justify-between border-b border-sidebar-border/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/95 flex items-center justify-center shadow-sm">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-foreground leading-tight tracking-tight">DILIHUB</h1>
              <p className="text-xs text-muted-foreground">Organizzazione famiglia</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 hover:bg-muted rounded-lg transition-colors duration-150 ease-out-strong"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-[transform,background-color,color,box-shadow] duration-150 ease-out-strong active:scale-[0.985]",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <item.icon className="w-4.5 h-4.5 transition-transform duration-150 ease-out-strong group-hover:scale-105" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mx-3 mb-4 rounded-2xl bg-muted/55 border border-border/80">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Gestisci spese, permessi e impegni in un solo flusso condiviso.
          </p>
        </div>
      </aside>
    </>
  );
}
