import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Linkedin, Mail, ExternalLink, Moon, Sun, ChevronDown, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

type ProjectVariation = {
  id: number;
  image: string;
  colorCode?: string;
  imageScale?: number;
};

type Project = {
  id: number;
  title: string;
  category: string;
  variations: ProjectVariation[];
  description?: string;
  isMulti: boolean;
  defaultBgColor?: 'default' | 'black' | 'white';
};

const isVideo = (url?: string) => {
  if (!url) return false;
  return /\.(mp4|webm|ogg)$/i.test(url);
};

const MultiProjectCard: React.FC<{ project: Project; onImageClick?: (url: string) => void }> = ({ project, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bgPreview, setBgPreview] = useState<'default' | 'black' | 'white'>(project.defaultBgColor || 'default');

  const getBgClass = () => {
    if (bgPreview === 'black') return 'bg-black';
    if (bgPreview === 'white') return 'bg-white';
    return 'bg-secondary';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px" }}
      transition={{ duration: 0.3 }}
      className="card-bg rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col group"
    >
      {/* Image Container */}
      <div className={`relative aspect-[4/3] md:aspect-[16/9] overflow-hidden transition-colors duration-300 ${getBgClass()}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`w-full h-full flex items-center justify-center p-2 md:p-4 group/img transition-transform ${onImageClick ? 'cursor-pointer' : ''}`}
            onClick={() => onImageClick && onImageClick(project.variations[currentIndex]?.image)}
            onMouseEnter={(e) => {
              const video = e.currentTarget.querySelector('video');
              if (video) {
                video.currentTime = 0;
                video.play().catch(() => { });
              }
            }}
            onMouseLeave={(e) => {
              const video = e.currentTarget.querySelector('video');
              if (video) {
                video.pause();
              }
            }}
          >
            {isVideo(project.variations[currentIndex]?.image) ? (
              <video
                src={project.variations[currentIndex]?.image}
                className={`w-full h-full object-contain transition-transform duration-300 ${onImageClick ? 'group-hover/img:scale-[1.03]' : ''}`}
                autoPlay
                muted
                playsInline
                style={{ transform: `scale(${project.variations[currentIndex]?.imageScale || 1})` }}
              />
            ) : (
              <img
                src={project.variations[currentIndex]?.image}
                alt={`${project.title} variation ${currentIndex + 1}`}
                style={{ transform: `scale(${project.variations[currentIndex]?.imageScale || 1})` }}
                className={`w-full h-full object-contain transition-transform duration-300 ${onImageClick ? 'group-hover/img:scale-[1.03]' : ''}`}
                referrerPolicy="no-referrer"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Variation Dots */}
        {project.variations.length > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 left-3 md:top-auto md:translate-y-0 md:bottom-6 md:left-6 flex flex-col md:flex-row items-center gap-2.5 md:gap-3 z-10 bg-black/40 backdrop-blur-md px-2.5 py-3.5 md:px-4 md:py-2.5 rounded-full md:rounded-2xl border border-white/10 shadow-lg">
            <span className="hidden md:block text-xs font-medium text-white/90 mr-1 select-none whitespace-nowrap">Logo renk çeşitleri:</span>
            {project.variations.map((variation, idx) => (
              <button
                key={variation.id || idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-5 h-5 md:w-5 md:h-5 rounded-full transition-all duration-300 border-2 flex-shrink-0 ${currentIndex === idx ? 'scale-125 border-white' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                style={{ backgroundColor: variation.colorCode || '#ccc' }}
                aria-label={`View variation ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Background Toggle Dots */}
        {project.category?.toLowerCase() !== 'video' && (
          <div className="absolute top-1/2 -translate-y-1/2 right-3 md:top-auto md:translate-y-0 md:bottom-6 md:left-auto md:right-6 flex flex-col md:flex-row items-center gap-2.5 md:gap-2 z-10 bg-black/40 backdrop-blur-md px-2.5 py-3.5 md:px-4 md:py-2.5 rounded-full md:rounded-2xl border border-white/10 shadow-lg">
            <span className="hidden md:block text-xs font-medium text-white/90 mr-2 select-none whitespace-nowrap">Arkaplan:</span>
            <button
              onClick={(e) => { e.stopPropagation(); setBgPreview('black'); }}
              className={`w-5 h-5 rounded-full transition-all duration-300 border-2 bg-black flex-shrink-0 ${bgPreview === 'black' ? 'scale-125 border-white' : 'border-gray-500 opacity-70 hover:opacity-100'
                }`}
              aria-label="Siyah Arkaplan"
            />
            <button
              onClick={(e) => { e.stopPropagation(); setBgPreview('white'); }}
              className={`w-5 h-5 rounded-full transition-all duration-300 border-[1.5px] bg-white flex-shrink-0 ${bgPreview === 'white' ? 'scale-125 border-white' : 'border-gray-300 opacity-70 hover:opacity-100'
                }`}
              aria-label="Beyaz Arkaplan"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-8 md:p-10 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-sm font-semibold tracking-wider uppercase text-secondary mb-2 block">
              {project.category}
            </span>
            <h3 className="text-2xl md:text-3xl font-display font-bold text-primary">
              {project.title}
            </h3>
          </div>
        </div>

        {project.description && (
          <p className="text-secondary text-lg leading-relaxed max-w-3xl">
            {project.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}


const LoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050505] text-white"
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          className="flex overflow-hidden"
          initial="hidden"
          animate="visible"
        >
          {"EMİRHAN TURHAN".split("").map((char, index) => (
            <motion.span
              key={index}
              variants={{
                hidden: { y: 100, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              transition={{
                duration: 0.4,
                delay: index * 0.02,
                ease: [0.33, 1, 0.68, 1]
              }}
              className={`font-display text-4xl md:text-6xl font-bold tracking-tighter ${char === " " ? "mr-4" : ""}`}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeInOut" }}
          className="h-[2px] bg-purple-600 mt-4 shadow-[0_0_15px_rgba(139,92,246,0.6)]"
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="mt-8 text-xs tracking-[0.3em] uppercase text-gray-500 font-medium"
        >
          Portfolyo Yükleniyor
        </motion.div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    // Check system preference on load
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
    fetchProjects();
  }, []);

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
      // Bekleme ekranını daha kısa tutuyoruz (yaklaşık 0.8 sn)
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {loading && <LoadingScreen key="loader" />}
      </AnimatePresence>
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
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-display font-bold text-xl tracking-tighter text-primary">
            EMİRHAN TURHAN
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-8 text-sm font-medium text-secondary">
              <a href="#portfolio" className="hover:text-primary transition-colors">Çalışmalarım</a>
              <a href="#contact" className="hover:text-primary transition-colors">İletişim</a>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-secondary text-primary hover:bg-opacity-80 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-none mb-6 text-primary">
              EMİRHAN<br />TURHAN
            </h1>
            <div className="flex items-center justify-center gap-4 md:gap-8 text-xl md:text-3xl font-light text-secondary tracking-wide">
              <span>Yazılım</span>
              <span className="w-2 h-2 rounded-full bg-current opacity-50"></span>
              <span>Tasarım</span>
            </div>
            <p className="mt-8 text-lg text-secondary max-w-2xl mx-auto">
              Bilgisayar Programcılığı öğrencisiyim ve freelance olarak markalar için görsel kimlik, logo ve afiş tasarımları üretiyorum.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-secondary"
        >
          <span className="text-sm font-medium tracking-widest uppercase text-accent">Aşağı Kaydır</span>
          <div className="animate-bounce mt-2 accent-color">
            <ChevronDown size={24} />
          </div>
        </motion.div>
      </section>

      {/* Portfolio Section */}
      {projects.length > 0 && (
        <section id="portfolio" className="py-24 px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 md:mb-24"
          >
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4 text-primary">Portfolyo</h2>
            <p className="text-xl text-secondary max-w-2xl">
              Logo, afiş, poster ve illüstrasyon çalışmalarım. Varyasyonları görmek veya arkaplanı değiştirmek için köşedeki noktalara tıklayabilirsiniz.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {projects.map((project) => (
              <MultiProjectCard key={project.id} project={project} onImageClick={setSelectedImage} />
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-4 right-4 md:top-8 md:right-8 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </button>
            {isVideo(selectedImage) ? (
              <motion.video
                src={selectedImage!}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                controls
                autoPlay
                onClick={(e: any) => e.stopPropagation()}
              />
            ) : (
              <motion.img
                src={selectedImage!}
                alt="Büyütülmüş Görsel"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e: any) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Section */}
      <section id="contact" className="py-32 px-6 border-t border-custom bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-6xl font-bold mb-8 text-primary">Birlikte Çalışalım</h2>
            <p className="text-xl text-secondary mb-12 max-w-2xl mx-auto">
              Yeni bir marka kimliği veya tasarım ihtiyacınız mı var? Benimle iletişime geçebilirsiniz.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a href="mailto:emirhantrhn@hotmail.com" className="flex items-center gap-3 px-8 py-4 rounded-full card-bg text-primary hover:scale-105 transition-transform shadow-sm">
                <Mail size={20} />
                <span className="font-medium">emirhantrhn@hotmail.com</span>
              </a>
              <a href="https://www.linkedin.com/in/emirhan-turhan-80b92a265/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-8 py-4 rounded-full card-bg text-primary hover:scale-105 transition-transform shadow-sm">
                <Linkedin size={20} />
                <span className="font-medium">LinkedIn</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-secondary border-t border-custom">
        <p>© {new Date().getFullYear()} Emirhan Turhan. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}

