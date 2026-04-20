import { useAuth } from '../contexts/AuthContext';

export function AdminModeBanner() {
  const { isAdminMode, effectiveUser, stopImpersonating } = useAuth();

  if (!isAdminMode) return null;

  return (
    <div className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>
          Modo Admin — Você está gerenciando:{' '}
          <strong>{effectiveUser?.name}</strong> ({effectiveUser?.email})
        </span>
      </div>
      <button
        onClick={stopImpersonating}
        className="ml-4 bg-white text-orange-600 font-semibold px-3 py-1 rounded text-xs hover:bg-orange-50 transition-colors shrink-0"
      >
        Voltar ao meu perfil
      </button>
    </div>
  );
}
