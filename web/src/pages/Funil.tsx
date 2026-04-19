export default function Funil() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Funil de Vendas</h1>
        <p className="text-slate-400">Acompanhe o desempenho do seu funil de conversão</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Em desenvolvimento</h3>
        <p className="text-slate-400">Esta funcionalidade será implementada em breve.</p>
      </div>
    </div>
  );
}
