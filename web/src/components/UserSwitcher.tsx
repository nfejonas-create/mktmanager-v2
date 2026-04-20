import { useAuth } from '../contexts/AuthContext';

export function UserSwitcher() {
  const { user, effectiveUser, users, isAdminMode, impersonateUser, stopImpersonating } = useAuth();

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="relative group">
      <button
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
          isAdminMode
            ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
            isAdminMode ? 'bg-orange-500' : 'bg-blue-600'
          }`}
        >
          {effectiveUser?.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline max-w-[120px] truncate">{effectiveUser?.name}</span>
        {isAdminMode && (
          <span className="text-xs bg-orange-200 text-orange-700 px-1 rounded hidden sm:inline">Admin</span>
        )}
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Alternar Usuário</p>
        </div>

        <div className="max-h-60 overflow-y-auto py-1">
          {users.filter(u => u.isActive).map((u) => {
            const isActive = u.id === effectiveUser?.id;
            return (
              <button
                key={u.id}
                onClick={() => {
                  if (!isActive) {
                    if (u.id === user.id) {
                      stopImpersonating();
                    } else {
                      impersonateUser(u.id);
                    }
                  }
                }}
                disabled={isActive}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  isActive ? 'bg-blue-50 cursor-default' : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${
                    u.role === 'ADMIN' ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                >
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                {isActive && (
                  <span className="text-xs text-blue-600 font-semibold shrink-0">Ativo</span>
                )}
              </button>
            );
          })}
        </div>

        {isAdminMode && (
          <div className="px-3 py-2 border-t border-gray-100">
            <button
              onClick={stopImpersonating}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              ← Voltar ao meu perfil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
