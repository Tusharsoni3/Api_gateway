import Sidebar from './Sidebar';

export default function Layout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gatex-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 lg:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1">
          {(title || subtitle) && (
            <header className="mb-6 rounded-lg border-2 border-gatex-border bg-gatex-card px-6 py-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]">
              {title && <h1 className="text-2xl font-bold text-white">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
            </header>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
