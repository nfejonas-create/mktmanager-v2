import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  TrendingUp, 
  Calendar, 
  Settings, 
  LogOut,
  Zap,
  Clock,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';

const menuItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/conteudo', icon: FileText, label: 'Conteúdo' },
  { to: '/base-conhecimento', icon: Database, label: 'Base de Conhecimento' },
  { to: '/funil', icon: TrendingUp, label: 'Funil de Vendas' },
  { to: '/calendario', icon: Calendar, label: 'Calendário' },
  { to: '/contas', icon: Users, label: 'Contas Sociais' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

const SYSTEM_VERSION = '2.0.0';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [serverTime, setServerTime] = useState('');
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      
      setServerTime(now.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'UTC'
      }) + ' UTC');
      
      setLocalTime(now.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'America/Sao_Paulo'
      }) + ' BRT');
    };

    updateTimes();
    const interval = setInterval(updateTimes, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="text-white" size={24} />
          </div>
          <div>
            <span className="font-bold text-white text-lg">PostFlow</span>
            <p className="text-xs text-slate-500">v{SYSTEM_VERSION}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-4">
        {/* Horários */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-900/20 px-3 py-2 rounded-lg">
            <Clock size={14} />
            <span className="font-mono">{serverTime}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 px-3 py-2 rounded-lg">
            <Clock size={14} />
            <span className="font-mono">{localTime}</span>
          </div>
        </div>

        {/* Usuário */}
        {user && (
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm w-full px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
