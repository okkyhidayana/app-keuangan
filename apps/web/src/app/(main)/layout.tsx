import { Sidebar } from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background relative">
      <Sidebar />
      
      {/* 
        Main content wrapper. 
        On mobile (mt-14) provides space for the fixed top navbar from Sidebar.
        On desktop (md:ml-64, md:mt-0) pushes content beside the persistent sidebar.
      */}
      <main className="flex-1 w-full min-w-0 mt-14 md:mt-0 md:ml-64 min-h-screen transition-transform">
        <div className="p-4 sm:p-6 md:p-8 w-full max-w-[100vw] sm:max-w-7xl mx-auto animate-fade-in pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
