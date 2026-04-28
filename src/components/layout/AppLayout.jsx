import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const location = useLocation();
  const [skipRouteMotion, setSkipRouteMotion] = useState(false);

  useEffect(() => {
    const key = 'dilihub-last-route-change-at';
    const now = Date.now();
    const lastChange = Number(window.sessionStorage.getItem(key) || 0);
    const shouldSkip = now - lastChange < 600;
    setSkipRouteMotion(shouldSkip);
    window.sessionStorage.setItem(key, String(now));
  }, [location.pathname]);

  return (
    <div className={`min-h-screen bg-background ${skipRouteMotion ? 'motion-skip' : ''}`}>
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className={`${skipRouteMotion ? '' : 'page-enter'} p-4 pt-16 lg:pt-8 lg:px-10 lg:pb-10 max-w-[1200px] mx-auto`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
