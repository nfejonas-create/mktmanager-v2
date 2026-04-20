import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { AdminModeBanner } from './AdminModeBanner';

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <AdminModeBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
