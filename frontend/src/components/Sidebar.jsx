import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, LogOut, Zap } from 'lucide-react';
import { logout } from '../api/auth';
import Cookies from 'js-cookie';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const userName = Cookies.get('userName') || 'Developer';
  const userEmail = Cookies.get('userEmail') || '';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col rounded-lg border-2 border-gatex-border bg-gatex-card shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)]">
      {/* Logo + user info */}
      <div className="border-b-2 border-gatex-border p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gatex-border bg-gatex-green text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
            <Zap size={18} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">GateX</span>
        </div>
        {/* User info */}
        <div className="flex items-center gap-2.5 rounded-lg border border-gatex-border bg-gatex-bg px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gatex-green/20 text-xs font-bold text-gatex-green border border-gatex-green/30">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            {userEmail && <p className="truncate text-xs text-slate-500">{userEmail}</p>}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'border-gatex-green/40 bg-gatex-green/10 text-gatex-green'
                  : 'border-transparent text-slate-400 hover:border-gatex-border hover:bg-gatex-bg hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-gatex-green" />
                )}
                <Icon size={18} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t-2 border-gatex-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg border-2 border-transparent px-4 py-2.5 text-sm font-semibold text-slate-400 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
