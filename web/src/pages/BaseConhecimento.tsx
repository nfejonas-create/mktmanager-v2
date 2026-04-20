import { useEffect, useMemo, useRef, useState } from 'react';
import { Database, FileText, Image, Link2, Plus, Search, Tag, Trash2, Upload, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'list' | 'upload' | 'link';
type KnowledgeType = 'pdf' | 'image' | 'link' | 'text';

interface KbItem {
  id: string;
  title: string;
  type: KnowledgeType;
  filename?: string;
  tags?: string;
  fileSize?: number;
  url?: string;
  createdAt: string;
}

function storageKey(userId?: string | null) {
  return `knowledgeBase:${userId || 'anonymous'}`;
}

export default function BaseConhecimento() {
  const { user } = useAuth();
  const [items, setItems] = useState<KbItem[]>([]);
  const [tab, setTab] = useState<Tab>('list');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkTags, setLinkTags] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(storageKey(user?.id));
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, [user?.id]);

  function persist(nextItems: KbItem[]) {
    setItems(nextItems);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey(user?.id), JSON.stringify(nextItems));
    }
  }

  function handleUpload() {
    if (!file) return;

    const nextItem: KbItem = {
      id: `${Date.now()}`,
      title: title || file.name,
      type: file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'text',
      filename: file.name,
      fileSize: file.size,
      tags,
      createdAt: new Date().toISOString()
    };

    persist([nextItem, ...items]);
    setFile(null);
    setTitle('');
    setTags('');
    setTab('list');
  }

  function handleAddLink() {
    if (!linkUrl) return;

    const nextItem: KbItem = {
      id: `${Date.now()}`,
      title: linkTitle || linkUrl,
      type: 'link',
      url: linkUrl,
      tags: linkTags,
      createdAt: new Date().toISOString()
    };

    persist([nextItem, ...items]);
    setLinkUrl('');
    setLinkTitle('');
    setLinkTags('');
    setTab('list');
  }

  function handleDelete(id: string) {
    if (!confirm('Remover este item da base?')) return;
    persist(items.filter((item) => item.id !== id));
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const typeOk = !filterType || item.type === filterType;
      const query = search.toLowerCase();
      const searchOk =
        !query ||
        item.title.toLowerCase().includes(query) ||
        (item.tags || '').toLowerCase().includes(query) ||
        (item.url || '').toLowerCase().includes(query);
      return typeOk && searchOk;
    });
  }, [filterType, items, search]);

  function typeIcon(type: KnowledgeType) {
    if (type === 'pdf') return <FileText size={16} className="text-red-400" />;
    if (type === 'image') return <Image size={16} className="text-blue-400" />;
    if (type === 'link') return <Link2 size={16} className="text-green-400" />;
    return <FileText size={16} className="text-slate-400" />;
  }

  function formatSize(bytes?: number) {
    if (!bytes) return '';
    return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database size={24} className="text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Base de Conhecimento</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('upload')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Upload size={14} /> Upload
          </button>
          <button
            onClick={() => setTab('link')}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Link2 size={14} /> Adicionar Link
          </button>
        </div>
      </div>

      <p className="text-slate-400 text-sm">
        Arquivos e links salvos aqui ficam disponíveis para a IA buscar ao gerar posts. Cada usuário mantém sua própria base.
      </p>

      {tab === 'list' && (
        <>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título ou tag..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white text-sm"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Todos os tipos</option>
              <option value="pdf">PDF</option>
              <option value="image">Imagens</option>
              <option value="link">Links</option>
              <option value="text">Texto</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
              <Database size={40} className="mx-auto text-slate-700 mb-3" />
              <p className="text-slate-500">Base vazia. Adicione ebooks, prints ou links.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex-shrink-0">{typeIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-medium text-sm truncate">{item.title}</span>
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded flex-shrink-0">{item.type}</span>
                      {item.fileSize && <span className="text-xs text-slate-600 flex-shrink-0">{formatSize(item.fileSize)}</span>}
                    </div>
                    {item.tags && (
                      <div className="flex gap-1 flex-wrap">
                        {item.tags.split(',').map((tag, index) =>
                          tag.trim() ? (
                            <span key={`${item.id}-${index}`} className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded">
                              <Tag size={9} /> {tag.trim()}
                            </span>
                          ) : null
                        )}
                      </div>
                    )}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-green-400 hover:underline truncate block mt-1">
                        {item.url}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-600">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                    <button onClick={() => handleDelete(item.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'upload' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Upload para a Base</h2>
            <button onClick={() => setTab('list')} className="text-slate-500 hover:text-slate-300">
              <X size={18} />
            </button>
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              setFile(e.dataTransfer.files[0]);
            }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
            }`}
          >
            <input ref={fileRef} type="file" accept=".pdf,.txt,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                {file.type === 'application/pdf' ? <FileText size={20} className="text-red-400" /> : <Image size={20} className="text-blue-400" />}
                <span className="text-white">{file.name}</span>
                <span className="text-slate-500 text-sm">({formatSize(file.size)})</span>
              </div>
            ) : (
              <>
                <Upload size={36} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-300 font-medium">Arraste ou clique para selecionar</p>
                <p className="text-slate-500 text-sm mt-1">PDF, PNG, JPG, TXT — até 20MB</p>
              </>
            )}
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Título (opcional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={file?.name || 'Ex: Manual Vol. 1 - Motores'}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Tags (separadas por vírgula)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ex: motores, vol1, automacao"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setTab('list')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm transition-colors">
              Cancelar
            </button>
            <button onClick={handleUpload} disabled={!file} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors">
              <Plus size={14} /> Salvar na Base
            </button>
          </div>
        </div>
      )}

      {tab === 'link' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Adicionar Link</h2>
            <button onClick={() => setTab('list')} className="text-slate-500 hover:text-slate-300">
              <X size={18} />
            </button>
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">URL *</label>
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Título</label>
            <input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="Ex: Artigo sobre automação" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Tags</label>
            <input value={linkTags} onChange={(e) => setLinkTags(e.target.value)} placeholder="Ex: leads, linkedin, pagina" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setTab('list')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm transition-colors">
              Cancelar
            </button>
            <button onClick={handleAddLink} disabled={!linkUrl} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors">
              <Link2 size={14} /> Salvar Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
