import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Lock, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

type ProjectVariation = {
  id?: number;
  image: string;
  colorCode?: string;
};

type Project = {
  id?: number;
  title: string;
  category: string;
  description?: string;
  isMulti: boolean;
  variations: ProjectVariation[];
};

export default function Admin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('rememberMe') === 'true');

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('rememberMe', rememberMe.toString());
        setLoginError('');
      } else {
        setLoginError('Hatalı şifre');
      }
    } catch (error) {
      setLoginError('Giriş yapılamadı');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editForm || !token) return;

    try {
      const method = editForm.id ? 'PUT' : 'POST';
      const url = editForm.id ? `/api/projects/${editForm.id}` : '/api/projects';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(editForm)
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      setEditingId(null);
      setEditForm(null);
      fetchProjects();
      showStatus('Proje başarıyla kaydedildi', 'success');
    } catch (error) {
      console.error('Failed to save project', error);
      showStatus('Bir hata oluştu', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      fetchProjects();
      showStatus('Proje silindi', 'success');
    } catch (error) {
      console.error('Failed to delete project', error);
      showStatus('Silme işlemi başarısız', 'error');
    }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id!);
    setEditForm({ ...project });
  };

  const startNew = () => {
    setEditingId(-1);
    setEditForm({
      title: '',
      category: '',
      description: '',
      isMulti: false,
      variations: [{ image: '', colorCode: '' }]
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, varIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!token) return;

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': token },
          body: formData
        });

        const data = await res.json();
        if (res.status === 401) {
          handleLogout();
          return;
        }

        if (data.success && editForm) {
          const newVariations = [...editForm.variations];
          newVariations[varIndex].image = data.url;
          setEditForm({ ...editForm, variations: newVariations });
          showStatus('Görsel başarıyla yüklendi', 'success');
        } else {
          showStatus(data.error || 'Görsel yüklenemedi', 'error');
        }
      } catch (error) {
        console.error('Upload error:', error);
        showStatus('Görsel yükleme hatası', 'error');
      }
    }
  };

  if (loading) return <div className="p-8 text-white">Yükleniyor...</div>;

  if (!token) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-purple-500/20 text-purple-400">
              <Lock size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-8 font-display">Admin Girişi</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Şifre</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 pr-12"
                  placeholder="Admin şifresi"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-black/50 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-400 cursor-pointer hover:text-white transition-colors">
                Beni Hatırla
              </label>
            </div>
            {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors font-medium"
            >
              Giriş Yap
            </button>
            <div className="text-center">
              <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                Siteye Dön
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {statusMessage && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg border ${statusMessage.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}>
            {statusMessage.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold font-display">Portfolyo Yönetimi</h1>
          <div className="flex flex-wrap gap-3">
            <Link to="/" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm">
              Siteye Dön
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
            >
              Çıkış Yap
            </button>
            <button
              onClick={startNew}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors text-sm"
            >
              <Plus size={18} /> Yeni Ekle
            </button>
          </div>
        </div>

        {editForm && (
          <div className="mb-12 p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">{editForm.id ? 'Projeyi Düzenle' : 'Yeni Proje'}</h2>
              <button onClick={() => { setEditingId(null); setEditForm(null); }} className="p-2 hover:bg-white/10 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Başlık</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Kategori</label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Açıklama</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 h-24"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isMulti"
                  checked={editForm.isMulti}
                  onChange={e => setEditForm({ ...editForm, isMulti: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                />
                <label htmlFor="isMulti" className="text-sm text-gray-300">Bu proje çoklu varyasyona sahip (Renk seçenekli vb.)</label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Görseller / Varyasyonlar</h3>
                {editForm.isMulti && (
                  <button
                    onClick={() => setEditForm({ ...editForm, variations: [...editForm.variations, { image: '', colorCode: '#ffffff' }] })}
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <Plus size={16} /> Varyasyon Ekle
                  </button>
                )}
              </div>

              {editForm.variations.map((variation, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl bg-black/30 border border-white/5">
                  <div className="w-full sm:w-32 h-32 sm:h-24 bg-black/50 rounded-lg overflow-hidden relative flex-shrink-0 border border-white/10">
                    {variation.image ? (
                      <img src={variation.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <ImageIcon size={24} />
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                      <span className="text-xs font-medium">Değiştir</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, idx)} />
                    </label>
                  </div>

                  <div className="flex-grow w-full space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Görsel URL (veya Dosya Yükle)</label>
                      <input
                        type="text"
                        value={variation.image}
                        onChange={e => {
                          const newVars = [...editForm.variations];
                          newVars[idx].image = e.target.value;
                          setEditForm({ ...editForm, variations: newVars });
                        }}
                        className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                        placeholder="https://..."
                      />
                    </div>
                    {editForm.isMulti && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Renk Kodu (HEX)</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={variation.colorCode || '#ffffff'}
                            onChange={e => {
                              const newVars = [...editForm.variations];
                              newVars[idx].colorCode = e.target.value;
                              setEditForm({ ...editForm, variations: newVars });
                            }}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                          />
                          <input
                            type="text"
                            value={variation.colorCode || ''}
                            onChange={e => {
                              const newVars = [...editForm.variations];
                              newVars[idx].colorCode = e.target.value;
                              setEditForm({ ...editForm, variations: newVars });
                            }}
                            className="flex-grow bg-black/50 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {editForm.variations.length > 1 && (
                    <button
                      onClick={() => {
                        const newVars = editForm.variations.filter((_, i) => i !== idx);
                        setEditForm({ ...editForm, variations: newVars });
                      }}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-black font-medium hover:bg-gray-200 transition-colors"
              >
                <Save size={18} /> Kaydet
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {projects.map(project => (
            <div key={project.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-16 h-12 rounded bg-black/50 overflow-hidden flex-shrink-0">
                  {project.variations[0]?.image && (
                    <img src={project.variations[0].image} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-medium truncate">{project.title}</h3>
                  <span className="text-sm text-gray-400 block truncate">{project.category} • {project.isMulti ? `${project.variations.length} Varyasyon` : 'Tekil'}</span>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                <button
                  onClick={() => startEdit(project)}
                  className="p-2 text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Düzenle"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(project.id!)}
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  aria-label="Sil"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Henüz hiç proje eklenmemiş.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
