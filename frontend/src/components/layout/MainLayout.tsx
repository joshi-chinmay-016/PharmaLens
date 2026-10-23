import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-paper text-ink overflow-hidden font-sans">
      {/* Sidebar with responsive drawer support */}
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
