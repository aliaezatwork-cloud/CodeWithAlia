/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Target, Calendar, FileText, Download, Share2, Maximize2 } from 'lucide-react';
import { Lesson } from '../types';

interface VideoModalProps {
  lesson: Lesson | null;
  onClose: () => void;
}

export function VideoModal({ lesson, onClose }: VideoModalProps) {
  if (!lesson) return null;

  const extractYoutubeId = (url: string) => {
    if (!url) return '';
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?v=)|(shorts\/)|(\?v=))([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[9].length === 11) ? match[9] : url;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
    >
      <div 
        className="absolute inset-0 bg-sleek-bg/98 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-6xl max-h-[90vh] bg-sleek-surface rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col"
      >
        {/* Header/Controls */}
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/60 to-transparent z-[110] flex items-center justify-between px-6 pointer-events-none">
          <div className="pointer-events-auto">
            <span className="hidden md:inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white/80 uppercase tracking-widest border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-sleek-accent animate-pulse" />
              Watching Now
            </span>
          </div>
          
          <button 
            onClick={onClose}
            className="pointer-events-auto p-3 bg-white/10 hover:bg-red-500/20 backdrop-blur-md rounded-full text-white transition-all border border-white/10 hover:border-red-500/30 group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Video Side */}
        <div className="aspect-video w-full bg-black relative group shadow-2xl overflow-hidden">
          {lesson.videoType === 'youtube' ? (
            <iframe
              src={`https://www.youtube.com/embed/${extractYoutubeId(lesson.youtubeId || '')}?autoplay=1&rel=0&modestbranding=1&hd=1`}
              title={lesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video 
              src={lesson.videoUrl} 
              className="w-full h-full object-contain"
              controls
              autoPlay
              controlsList="nodownload"
            />
          )}
        </div>

        {/* Info Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-tr from-sleek-bg to-sleek-surface">
          <div className="p-8 md:p-12 text-right" dir="rtl">
            <div className={`flex flex-col lg:flex-row items-start justify-between gap-10 ${lesson.category === 'english' ? 'ltr lg:flex-row-reverse text-left' : ''}`} dir={lesson.category === 'english' ? 'ltr' : 'rtl'}>
              <div className="flex-1 space-y-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap items-center gap-3"
                >
                  <span className="bg-sleek-accent/20 text-sleek-accent px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-sleek-accent/30 shadow-lg shadow-sleek-accent/10">
                    {lesson.level}
                  </span>
                  <div className="flex items-center gap-4 text-slate-400 text-xs font-medium uppercase tracking-wider bg-white/5 py-1.5 px-4 rounded-full border border-white/5">
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-sleek-accent" /> {lesson.duration}</span>
                    <span className="w-px h-3 bg-white/10" />
                    <span className="flex items-center gap-1.5"><Target size={14} className="text-sleek-accent" /> {lesson.category === 'arabic' ? 'اللغة العربية' : 'English Language'}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6 leading-tight">
                    {lesson.title}
                  </h2>
                  <div className="h-1 w-24 bg-sleek-accent rounded-full mb-8 shadow-lg shadow-sleek-accent/20" />
                  <p className="text-slate-400 leading-relaxed max-w-3xl text-lg font-light">
                    {lesson.description}
                  </p>
                </motion.div>
                
                {lesson.createdAt && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-2 text-slate-500 text-xs mt-4"
                  >
                    <Calendar size={14} />
                    <span>تم النشر في: {new Date(lesson.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                  </motion.div>
                )}
              </div>

              {/* Action Sidebar */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full lg:w-72 space-y-4"
              >
                {lesson.pdfUrl && (
                  <a 
                    href={lesson.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 w-full p-5 bg-sleek-accent text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-sleek-accent/20 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                        <FileText size={20} />
                      </div>
                      <span className="text-sm">ملفات الشرح (Resources)</span>
                    </div>
                    <Download size={18} />
                  </a>
                )}

                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-6">
                  <h4 className="text-white font-bold text-sm tracking-wide flex items-center gap-2 uppercase">
                    <Maximize2 size={16} className="text-sleek-accent" />
                    Course Details
                  </h4>
                  <div className="space-y-4">
                    <DetailItem label="Status" value="Free Access" />
                    <DetailItem label="Quality" value="4K / HD" />
                    <DetailItem label="ID" value={`#${lesson.id.slice(0, 8)}`} />
                  </div>
                  
                  <button 
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-sleek-muted hover:bg-slate-700 text-white text-sm font-bold rounded-2xl transition-all border border-white/5"
                  >
                    إغلاق العرض (Close View)
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px] uppercase tracking-widest">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="text-slate-300 font-bold">{value}</span>
    </div>
  );
}
