import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { ArrowRight, Lock, Mail, User, UserPlus, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'login' | 'register';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    return error.response?.data?.error || fallback;
  }

  return fallback;
}

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (isRegister && password !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        isRegister
          ? getErrorMessage(err, 'Não foi possível criar a conta')
          : getErrorMessage(err, 'Email ou senha inválidos')
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Zap className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo ao PostFlow</h1>
          <p className="text-slate-400">
            {isRegister ? 'Crie sua conta para começar a publicar' : 'Entre para gerenciar suas publicações'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="inline-flex w-full rounded-xl bg-slate-800 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                !isRegister ? 'bg-blue-600 text-white' : 'text-slate-300'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isRegister ? 'bg-blue-600 text-white' : 'text-slate-300'
              }`}
            >
              Criar conta
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-colors"
                    required={isRegister}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-colors"
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar senha</label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-colors"
                    required={isRegister}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  {isRegister ? 'Criando conta...' : 'Entrando...'}
                </>
              ) : (
                <>
                  {isRegister ? 'Criar conta' : 'Entrar'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
