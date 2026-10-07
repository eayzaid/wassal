import React, { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { PageLoadingFallback } from '../common/PageLoadingFallback';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-wassal-bg flex flex-col lg:flex-row w-full max-w-full overflow-x-hidden">
      {/* Sidebar for Desktop / Drawer for Mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full max-w-full">
        <Header onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8 flex flex-col min-w-0">
          <Suspense fallback={<PageLoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Fixed Bottom Navigation for Mobile */}
      <MobileBottomNav />
    </div>
  );
};
