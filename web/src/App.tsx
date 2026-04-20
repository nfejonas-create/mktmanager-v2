import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Component, ErrorInfo, ReactNode } from 'react';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Conteudo from './pages/Conteudo';
import BaseConhecimento from './pages/BaseConhecimento';
import Calendario from './pages/Calendario';
import Configuracoes from './pages/Configuracoes';
import Contas from './pages/Contas';
import PostDetails from './pages/PostDetails';

// Error Boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null, errorInfo: ErrorInfo | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
    this.setState({ errorInfo: info });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white gap-4 p-8">
          <h1 className="text-2xl font-bold text-red-400">Erro na aplicação</h1>
          <div className="text-left w-full max-w-2xl">
            <p className="text-sm text-slate-400 mb-2">Erro:</p>
            <pre className="text-xs text-red-300 bg-slate-900 p-4 rounded-lg overflow-auto whitespace-pre-wrap mb-4">
              {this.state.error.message}
            </pre>
            {this.state.errorInfo && (
              <>
                <p className="text-sm text-slate-400 mb-2">Stack:</p>
                <pre className="text-xs text-slate-500 bg-slate-900 p-4 rounded-lg overflow-auto whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
          <button 
            onClick={() => {
              this.setState({ error: null, errorInfo: null });
              window.location.reload();
            }}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Recarregar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Private Route Component
function PrivateRoute({ children }: { children: ReactNode }) {
  const { token, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="conteudo" element={<Conteudo />} />
              <Route path="base-conhecimento" element={<BaseConhecimento />} />
              <Route path="calendario" element={<Calendario />} />
              <Route path="contas" element={<Contas />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="posts/:id" element={<PostDetails />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App
