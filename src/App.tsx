import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Linkedin, Mail, ExternalLink, Moon, Sun, ChevronDown, X } from 'lucide-react';
import { Link } from 'react-router-dom';

type ProjectVariation = {
  id: number;
  image: string;
  colorCode?: string;
};

type Project = {
  id: number;
  title: string;
  category: string;
  variations: ProjectVariation[];
  description?: string;
  isMulti: boolean;
};

const MultiProjectCard: React.FC<{ project: Project; onImageClick?: (url: string) => void }> = ({ project, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="card-bg rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col group"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] md:aspect-[16/9] overflow-hidden bg-secondary">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={project.variations[currentIndex]?.image}
            alt={`${project.title} variation ${currentIndex + 1}`}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`w-full h-full object-contain p-2 md:p-4 transition-transform ${onImageClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
            referrerPolicy="no-referrer"
            onClick={() => onImageClick && onImageClick(project.variations[currentIndex]?.image)}
          />
        </AnimatePresence>

        {/* Variation Dots */}
        {project.variations.length > 1 && (
          <div className="absolute bottom-6 left-6 flex gap-3 z-10 bg-black/20 backdrop-blur-md p-2 rounded-full">
            {project.variations.map((variation, idx) => (
              <button
                key={variation.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-5 h-5 rounded-full transition-all duration-300 border-2 ${currentIndex === idx ? 'scale-125 border-white' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                style={{ backgroundColor: variation.colorCode || '#ccc' }}
                aria-label={`View variation ${idx + 1}`}
              />
            ))}
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

const SingleProjectCard: React.FC<{ project: Project; onImageClick?: (url: string) => void }> = ({ project, onImageClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="card-bg rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
    >
      <div className="aspect-square overflow-hidden bg-secondary">
        <img
          src={project.variations[0]?.image}
          alt={project.title}
          className={`w-full h-full object-contain p-2 md:p-4 transition-transform duration-700 ${onImageClick ? 'cursor-pointer group-hover:scale-[1.03]' : 'group-hover:scale-[1.03]'}`}
          referrerPolicy="no-referrer"
          onClick={() => onImageClick && onImageClick(project.variations[0]?.image)}
        />
      </div>
      <div className="p-6">
        <span className="text-xs font-semibold tracking-wider uppercase text-secondary mb-1 block">
          {project.category}
        </span>
        <h3 className="text-lg font-display font-bold text-primary">
          {project.title}
        </h3>
      </div>
    </motion.div>
  );
}

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
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const multiProjects = projects.filter(p => p.isMulti);
  const singleProjects = projects.filter(p => !p.isMulti);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-primary text-primary">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen">
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

      {/* Portfolio Section - Multi Variations */}
      {multiProjects.length > 0 && (
        <section id="portfolio" className="py-24 px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 md:mb-24"
          >
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4 text-primary">Marka Kimlikleri</h2>
            <p className="text-xl text-secondary max-w-2xl">
              Farklı zemin ve kullanım alanlarına göre uyarlanmış, çoklu renk varyasyonlarına sahip detaylı logo ve kurumsal kimlik çalışmaları. Renkleri görmek için noktalara tıklayın.
            </p>
          </motion.div>

          <div className="flex flex-col gap-16 md:gap-24">
            {multiProjects.map((project) => (
              <MultiProjectCard key={project.id} project={project} onImageClick={setSelectedImage} />
            ))}
          </div>
        </section>
      )}

      {/* Portfolio Section - Single Variations */}
      {singleProjects.length > 0 && (
        <section className={`py-24 px-6 max-w-7xl mx-auto ${multiProjects.length > 0 ? 'border-t border-custom' : ''}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4 text-primary">Diğer Tasarımlar</h2>
            <p className="text-lg text-secondary max-w-2xl">
              Afişler, illüstrasyonlar ve tekil logo konseptleri.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {singleProjects.map((project) => (
              <SingleProjectCard key={project.id} project={project} onImageClick={setSelectedImage} />
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
            <motion.img
              src={selectedImage}
              alt="Büyütülmüş Görsel"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            />
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

