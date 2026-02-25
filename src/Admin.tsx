import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Lock, Eye, EyeOff, Crop, Menu } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import getCroppedImg from './utils/cropImage';
import toast, { Toaster } from 'react-hot-toast';

type ProjectVariation = {
  id?: number;
  image: string;
  colorCode?: string;
  imageScale?: number;
};

type Project = {
  id?: number;
  title: string;
  category: string;
  description?: string;
  isMulti: boolean;
  defaultBgColor?: 'default' | 'black' | 'white';
  variations: ProjectVariation[];
  sort_order?: number;
};

// Sortable Item Component
function SortableProjectItem({ project, onEdit, onDelete }: { project: Project, onEdit: (p: Project) => void, onDelete: (id: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: project.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors z-10 w-full overflow-hidden box-border"
    >
      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto overflow-hidden min-w-0">
        <button
          {...attributes}
          {...listeners}
          className="p-1 sm:p-2 -ml-1 sm:-ml-2 text-gray-400 hover:text-white flex-shrink-0 cursor-grab active:cursor-grabbing touch-none outline-none"
          aria-label="Sürükle bırak ile sırala"
        >
          <Menu size={20} />
        </button>
        <div className="w-14 sm:w-16 h-10 sm:h-12 rounded bg-black/50 overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => onEdit(project)}>
          {project.variations[0]?.image && (
            <img src={project.variations[0].image} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="overflow-hidden cursor-pointer flex-grow min-w-0" onClick={() => onEdit(project)}>
          <h3 className="font-medium truncate text-sm sm:text-base">{project.title}</h3>
          <span className="text-xs sm:text-sm text-gray-400 block truncate">{project.category} • {project.isMulti ? `${project.variations.length} Varyasyon` : 'Tekil'}</span>
        </div>
      </div>
      <div className="flex gap-2 self-end sm:self-auto flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(project); }}
          className="p-2 text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Düzenle"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(project.id!); }}
          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          aria-label="Sil"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default function Admin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('rememberMe') === 'true');

  // Cropper states
  const [cropFileUrl, setCropFileUrl] = useState<string | null>(null);
  const [cropVarIndex, setCropVarIndex] = useState<number | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Dnd sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);

      const newProjects = arrayMove(projects, oldIndex, newIndex);
      setProjects(newProjects);

      // Save order to backend
      if (token) {
        try {
          const res = await fetch('/api/projects/reorder', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token
            },
            body: JSON.stringify({ orderedIds: newProjects.map(p => p.id) })
          });
          if (!res.ok) throw new Error('Sıralama güncellenemedi');
          toast.success('Sıralama başarıyla kaydedildi');
        } catch (error) {
          console.error(error);
          toast.error('Sıralama kaydedilemedi');
          // Geri al
          setProjects(projects);
        }
      }
    }
  };

  const showStatus = (text: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(text);
    } else {
      toast.error(text);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchCategories();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('Kategoriler alınırken hata:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Kategoriler alınamadı', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !token) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setNewCategoryName('');
        fetchCategories();
        showStatus('Kategori eklendi', 'success');
      } else {
        showStatus(data.error || 'Eklenemedi', 'error');
      }
    } catch (e) {
      showStatus('Hata oluştu', 'error');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!token || !confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        fetchCategories();
        showStatus('Kategori silindi', 'success');
      }
    } catch (e) {
      showStatus('Hata oluştu', 'error');
    }
  };

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
      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        console.error('Projeler alınırken hata:', data);
        setProjects([]);
      }
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
      defaultBgColor: 'default',
      variations: [{ image: '', colorCode: '', imageScale: 1 }]
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, varIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        uploadVideoDirectly(file, varIndex);
      } else {
        const url = URL.createObjectURL(file);
        setCropFileUrl(url);
        setCropVarIndex(varIndex);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      }
    }
    // clear input
    e.target.value = '';
  };

  const uploadVideoDirectly = async (file: File, varIndex: number) => {
    if (!token || !editForm) return;
    const toastId = toast.loading('Medya yükleniyor... Lütfen bekleyin.');
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file); // Use same field name

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': token },
        body: formData
      });

      const data = await res.json();
      if (res.status === 401) {
        handleLogout();
        setIsUploading(false);
        toast.dismiss(toastId);
        return;
      }

      if (data.success) {
        const newVariations = [...editForm.variations];
        newVariations[varIndex].image = data.url;
        newVariations[varIndex].imageScale = 1;
        setEditForm({ ...editForm, variations: newVariations });
        toast.success('Video başarıyla yüklendi', { id: toastId });
      } else {
        toast.error(data.error || 'Video yüklenemedi', { id: toastId });
      }
    } catch (e) {
      toast.error('Yükleme hatası', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!cropFileUrl || cropVarIndex === null || !croppedAreaPixels || !token || !editForm) return;

    const toastId = toast.loading('Görsel kırpılıp yükleniyor...');
    setIsUploading(true);
    try {
      const croppedImageBlob = await getCroppedImg(cropFileUrl, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error('Blob is null');

      const formData = new FormData();
      formData.append('image', croppedImageBlob, 'cropped.png');

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': token },
        body: formData
      });

      const data = await res.json();
      if (res.status === 401) {
        handleLogout();
        setIsUploading(false);
        toast.dismiss(toastId);
        return;
      }

      if (data.success) {
        const newVariations = [...editForm.variations];
        newVariations[cropVarIndex].image = data.url;
        // set image scale to 1 because we already cropped & scaled it
        newVariations[cropVarIndex].imageScale = 1;
        setEditForm({ ...editForm, variations: newVariations });
        toast.success('Görsel başarıyla yüklenip kırpıldı', { id: toastId });

        // Cleanup
        setCropFileUrl(null);
        setCropVarIndex(null);
      } else {
        toast.error(data.error || 'Görsel yüklenemedi', { id: toastId });
      }
    } catch (e) {
      console.error(e);
      toast.error('Kırpma ve yükleme hatası', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Yükleniyor...</div>;

  if (!token) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 sm:p-6 overflow-x-hidden">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10">
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
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 overflow-x-hidden w-full">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#222',
            color: '#fff',
            borderRadius: '12px',
          }
        }}
      />
      <div className="max-w-6xl mx-auto w-full">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold font-display">Portfolyo Yönetimi</h1>
          <div className="flex flex-wrap gap-3">
            <Link to="/" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm">
              Siteye Dön
            </Link>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
            >
              Kategoriler
            </button>
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
                <select
                  value={editForm.category}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="" disabled>Seçiniz</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Açıklama</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 h-24"
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-center border-t border-white/10 pt-4 mt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isMulti"
                    checked={editForm.isMulti}
                    onChange={e => setEditForm({ ...editForm, isMulti: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                  />
                  <label htmlFor="isMulti" className="text-sm text-gray-300">Bu proje çoklu varyasyona sahip (Renk seçenekli vb.)</label>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Varsayılan Arkaplan Rengi</label>
                  <select
                    value={editForm.defaultBgColor || 'default'}
                    onChange={e => setEditForm({ ...editForm, defaultBgColor: e.target.value as 'default' | 'black' | 'white' })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="default">Varsayılan</option>
                    <option value="black">Siyah</option>
                    <option value="white">Beyaz</option>
                  </select>
                </div>
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
                  <div className={`w-full sm:w-48 ${editForm.isMulti ? 'aspect-[16/9]' : 'aspect-square'} rounded-lg overflow-hidden relative flex-shrink-0 border border-white/10`} style={{ backgroundColor: editForm.defaultBgColor === 'black' ? '#000' : editForm.defaultBgColor === 'white' ? '#fff' : '#111' }}>
                    {variation.image ? (
                      <div className={`w-full h-full flex items-center justify-center ${editForm.isMulti ? 'p-4' : 'p-2'}`}>
                        {variation.image.match(/\.(mp4|webm)$/i) ? (
                          <video src={variation.image} className="w-full h-full object-contain pointer-events-none" autoPlay muted loop playsInline />
                        ) : (
                          <img
                            src={variation.image}
                            alt="Preview"
                            style={{ transform: `scale(${variation.imageScale || 1})` }}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <ImageIcon size={24} />
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 cursor-pointer transition-opacity z-10">
                      <span className="text-xs font-medium">Değiştir & Kırp</span>
                      <input type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={(e) => handleImageUpload(e, idx)} />
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

                    <div className="text-xs text-gray-400 italic">
                      Görsel boyutu yükleme esnasında ayarlanır. (Yeni yüklediğiniz görsellerde ölçek ayarlamanıza gerek yoktur.)
                    </div>
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

        {/* Cropper Modal */}
        {cropFileUrl && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 sm:p-8">
            <div className="flex justify-between items-center mb-4 max-w-4xl mx-auto w-full">
              <h3 className="text-xl font-semibold">Görseli Ayarla</h3>
              <button onClick={() => setCropFileUrl(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="relative flex-grow w-full max-w-4xl mx-auto rounded-2xl overflow-hidden bg-[#111] border border-white/10">
              <Cropper
                image={cropFileUrl}
                crop={crop}
                zoom={zoom}
                minZoom={0.1}
                maxZoom={3}
                restrictPosition={false}
                aspect={editForm?.isMulti ? 16 / 9 : 1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                objectFit="contain"
                showGrid={true}
              />
            </div>

            <div className="w-full max-w-4xl mx-auto mt-6 flex flex-col sm:flex-row gap-6 items-center justify-between">
              <div className="flex items-center gap-4 w-full sm:w-96">
                <span className="text-sm font-medium">Ölçek</span>
                <input
                  type="range"
                  value={zoom}
                  min={0.1}
                  max={3}
                  step={0.05}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <p className="text-gray-400 text-sm hidden sm:block">Farenin tekerleğiyle veya kaydırıcı ile yaklaşabilirsiniz.</p>
              <button
                onClick={handleCropSave}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                {isUploading ? (
                  <>Yükleniyor...</>
                ) : (
                  <>
                    <Crop size={18} /> Kırp ve Yükle
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={projects.map(p => p.id!)}
              strategy={verticalListSortingStrategy}
            >
              {projects.map(project => (
                <SortableProjectItem
                  key={project.id}
                  project={project}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
          {projects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Henüz hiç proje eklenmemiş.
            </div>
          )}
        </div>

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Kategori Yönetimi</h3>
                <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Yeni kategori adı (Örn: Logo)"
                  className="flex-grow bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500"
                />
                <button onClick={handleAddCategory} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 transition-colors rounded-lg font-medium">Ekle</button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                {categories.map(c => (
                  <div key={c.id} className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors">
                    <span className="font-medium text-gray-200">{c.name}</span>
                    <button onClick={() => handleDeleteCategory(c.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && <span className="text-gray-500 text-sm italic block text-center">Henüz kategori eklenmemiş.</span>}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
