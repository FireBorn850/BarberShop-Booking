import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BARBERSHOP_IMAGES } from '../lib/images';

interface Transformation {
  id: number;
  category: string;
  titleKey: string;
  defaultTitle: string;
  before: string;
  after: string;
}

// 👇 DEMO PLACEHOLDER PHOTOS using the shop's existing image set.
// Swap `before` / `after` with the barbershop's real client transformation
// photos whenever you have them — everything else (slider drag, lightbox,
// category filtering, keyboard nav) works automatically with any image URLs.
const TRANSFORMATIONS: Transformation[] = [
  {
    id: 1,
    category: 'fades',
    titleKey: 'gallery.items.fade1',
    defaultTitle: 'Precision Skin Fade',
    before: BARBERSHOP_IMAGES.aboutMain,
    after: BARBERSHOP_IMAGES.serviceFade,
  },
  {
    id: 2,
    category: 'beards',
    titleKey: 'gallery.items.beard1',
    defaultTitle: 'Full Beard Sculpt',
    before: BARBERSHOP_IMAGES.aboutCraft,
    after: BARBERSHOP_IMAGES.serviceBeard,
  },
  {
    id: 3,
    category: 'classic',
    titleKey: 'gallery.items.classic1',
    defaultTitle: 'Classic Executive Cut',
    before: BARBERSHOP_IMAGES.heroBg,
    after: BARBERSHOP_IMAGES.serviceHaircut,
  },
  {
    id: 4,
    category: 'fades',
    titleKey: 'gallery.items.fade2',
    defaultTitle: 'Drop Fade & Lineup',
    before: BARBERSHOP_IMAGES.heroOverlay,
    after: BARBERSHOP_IMAGES.serviceFade,
  },
  {
    id: 5,
    category: 'package',
    titleKey: 'gallery.items.package1',
    defaultTitle: 'Full Grooming Package',
    before: BARBERSHOP_IMAGES.aboutMain,
    after: BARBERSHOP_IMAGES.servicePackage,
  },
  {
    id: 6,
    category: 'beards',
    titleKey: 'gallery.items.beard2',
    defaultTitle: 'Hot Towel Shave',
    before: BARBERSHOP_IMAGES.aboutCraft,
    after: BARBERSHOP_IMAGES.serviceShave,
  },
];

const CATEGORIES = ['all', 'fades', 'beards', 'classic', 'package'] as const;

// ---------- Draggable Before/After Slider ----------
interface SliderProps {
  before: string;
  after: string;
  onOpen?: () => void;
  heightClass?: string;
}

const BeforeAfterSlider: React.FC<SliderProps> = ({ before, after, onOpen, heightClass = 'h-72' }) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startXRef = useRef(0);

  const updatePosition = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  };

  const handleDown = (clientX: number) => {
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!draggingRef.current) return;
    if (Math.abs(clientX - startXRef.current) > 3) movedRef.current = true;
    updatePosition(clientX);
  };

  const handleUp = () => {
    if (draggingRef.current && !movedRef.current && onOpen) {
      onOpen();
    }
    draggingRef.current = false;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleUp();
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleUp();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${heightClass} overflow-hidden rounded-sm select-none cursor-ew-resize group bg-zinc-200 dark:bg-stone-900`}
      onMouseDown={(e) => handleDown(e.clientX)}
      onTouchStart={(e) => handleDown(e.touches[0].clientX)}
    >
      {/* After image (full, base layer) */}
      <img
        src={after}
        alt="After"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover filter contrast-105 grayscale-[0.15] pointer-events-none"
      />

      {/* Before image (clipped via clip-path to slider position) */}
      <img
        src={before}
        alt="Before"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover filter contrast-105 grayscale-[0.4] pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />

      {/* Divider handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-amber-500">
          <ChevronLeft className="w-3.5 h-3.5 text-zinc-800 -mr-1" />
          <ChevronRight className="w-3.5 h-3.5 text-zinc-800 -ml-1" />
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-sm bg-black/60 text-white text-[9px] font-bold uppercase tracking-widest pointer-events-none">
        {t('gallery.before', 'Before')}
      </span>
      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-sm bg-amber-600 text-black text-[9px] font-bold uppercase tracking-widest pointer-events-none">
        {t('gallery.after', 'After')}
      </span>

      {/* Expand hint on hover (desktop) */}
      <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:flex">
        <Maximize2 className="w-3.5 h-3.5 text-white" />
      </div>
    </div>
  );
};

// ---------- Main Gallery Section ----------
export const BeforeAfterGallery: React.FC = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === 'all'
      ? TRANSFORMATIONS
      : TRANSFORMATIONS.filter((item) => item.category === activeCategory);

  const openLightbox = (id: number) => {
    const idx = filtered.findIndex((item) => item.id === id);
    setLightboxIndex(idx);
  };

  const closeLightbox = () => setLightboxIndex(null);

  const showNext = () => {
    setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % filtered.length));
  };
  const showPrev = () => {
    setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + filtered.length) % filtered.length));
  };

  // Keyboard navigation + lock page scroll while lightbox is open
  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, filtered.length]);

  const current = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <section
      id="gallery"
      className="py-24 bg-white dark:bg-[#0C0C0C] border-b border-zinc-200 dark:border-stone-800 relative transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="reveal max-w-3xl mb-12 space-y-3">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 uppercase tracking-[0.3em] text-[10px] font-bold">
            <span className="h-[1px] w-8 bg-amber-600 dark:bg-amber-500"></span>
            {t('gallery.eyebrow', 'REAL RESULTS')}
          </div>
          <h2 className="text-4xl sm:text-5xl font-serif font-light text-zinc-900 dark:text-stone-100 tracking-tight">
            {t('gallery.title', 'See The Transformation')}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-stone-400 font-normal max-w-xl leading-relaxed">
            {t('gallery.description', 'Drag the slider to compare. Every cut tells a story — see the precision for yourself.')}
          </p>
        </div>

        {/* Category Filters */}
        <div className="reveal flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-amber-600 text-black shadow-md'
                  : 'bg-zinc-100 dark:bg-stone-900 text-zinc-600 dark:text-stone-400 hover:bg-zinc-200 dark:hover:bg-stone-800 border border-zinc-200 dark:border-stone-800'
              }`}
            >
              {t(`gallery.categories.${cat}`, cat)}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className="reveal rounded-sm border border-zinc-200 dark:border-stone-800 overflow-hidden shadow-md dark:shadow-xl bg-zinc-50 dark:bg-[#0A0A0A]"
              style={{ transitionDelay: `${(i % 3) * 100}ms` }}
            >
              <BeforeAfterSlider before={item.before} after={item.after} onOpen={() => openLightbox(item.id)} />
              <div className="p-4">
                <h3 className="text-sm font-serif font-bold text-zinc-900 dark:text-stone-100">
                  {t(item.titleKey, item.defaultTitle)}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {current && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <BeforeAfterSlider before={current.before} after={current.after} heightClass="h-[60vh]" />
            <div className="flex items-center justify-between mt-4 text-white">
              <h3 className="text-lg font-serif font-bold">{t(current.titleKey, current.defaultTitle)}</h3>
              <span className="text-xs text-white/60 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {(lightboxIndex ?? 0) + 1} / {filtered.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};