export default function Configuracoes() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
        <p className="text-slate-400">Gerencie suas preferências e integrações</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Perfil */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Perfil</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
              <input
                type="text"
                defaultValue="Jonas Breitenbach"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                defaultValue="jonas@email.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Notificações</h2>
          
          <div className="space-y-4">
            {[
              'Notificar quando um post for publicado',
              'Notificar em caso de falha',
              'Resumo semanal de métricas',
            ].map((label, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={index < 2}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-600"
                />
                <span className="text-slate-300">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Integrações */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Integrações</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl">
              <div>
                <p className="font-medium text-white">LinkedIn</p>
                <p className="text-sm text-slate-400">Conectado</p>
              </div>
              <button className="text-red-400 hover:text-red-300 text-sm">
                Desconectar
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl">
              <div>
                <p className="font-medium text-white">Facebook</p>
                <p className="text-sm text-slate-400">Não conectado</p>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm">
                Conectar
              </button>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl transition-colors">
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}
