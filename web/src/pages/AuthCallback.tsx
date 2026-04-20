import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const provider = searchParams.get('provider') || 'social';
  const status = searchParams.get('status') || 'error';
  const message = searchParams.get('message') || '';

  const feedback = useMemo(() => {
    if (status === 'success') {
      return `${provider} conectado com sucesso.`;
    }

    return message || `Erro ao conectar ${provider}.`;
  }, [message, provider, status]);

  useEffect(() => {
    window.alert(feedback);
    navigate(status === 'success' ? '/contas' : '/configuracoes', { replace: true });
  }, [feedback, navigate, status]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm text-slate-300">
        Processando autenticação...
      </div>
    </div>
  );
}
