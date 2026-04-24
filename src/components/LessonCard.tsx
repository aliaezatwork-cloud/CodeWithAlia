/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Play, Clock, BarChart, FileText } from 'lucide-react';
import { Lesson } from '../types';

interface LessonCardProps {
  lesson: Lesson;
  onSelect: (lesson: Lesson) => void;
  key?: string | number;
}

export function LessonCard({ lesson, onSelect }: LessonCardProps) {
  const isArabic = lesson.category === 'arabic';
  const displayThumbnail = lesson.thumbnail || `https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg`;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`group relative bg-sleek-surface border border-sleek-border rounded-3xl overflow-hidden transition-all duration-500 hover:border-sleek-accent/50 cursor-pointer ${
        isArabic ? 'text-right' : 'text-left'
      }`}
      onClick={() => onSelect(lesson)}
    >
      {/* PDF Indicator Badge */}
      {lesson.pdfUrl && (
        <div className={`absolute top-4 ${isArabic ? 'left-4' : 'right-4'} z-10`}>
          <div className="bg-blue-600/90 backdrop-blur-sm text-white p-2 rounded-xl shadow-xl flex items-center gap-2" title={isArabic ? 'يوجد ملف شرح' : 'Resources included'}>
            <FileText size={14} />
            <span className="text-[10px] font-bold uppercase tracking-tight">{isArabic ? 'ملف' : 'PDF'}</span>
          </div>
        </div>
      )}
      {/* Visual Header */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-800 animate-pulse">
        <img 
          src={displayThumbnail} 
          alt={lesson.title}
          loading="lazy"
          decoding="async"
          onLoad={(e) => {
            e.currentTarget.parentElement?.classList.remove('animate-pulse');
            e.currentTarget.style.opacity = '1';
          }}
          style={{ opacity: 0 }}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
        />
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-sleek-bg via-transparent to-transparent opacity-60" />
        
        {/* Level Badge */}
        <div className={`absolute top-4 ${isArabic ? 'right-4' : 'left-4'}`}>
           <span className="glass px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest text-sleek-accent font-bold">
            {lesson.level}
          </span>
        </div>

        {/* Play Icon (Modernized) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 glass rounded-full flex items-center justify-center text-white shadow-2xl">
            <Play className={`w-6 h-6 ${isArabic ? 'mr-1' : 'ml-1'}`} fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className={`flex flex-col gap-4 ${isArabic ? 'rtl' : ''}`}>
           <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px] uppercase tracking-widest">
            <Clock size={12} className="text-slate-600" />
            <span>{lesson.duration}</span>
            <span className="mx-2 opacity-30">|</span>
            <span className="text-sleek-accent">{lesson.videoType === 'youtube' ? 'YouTube' : 'Direct File'}</span>
          </div>

          <h3 className="text-2xl font-bold tracking-tight text-white group-hover:text-sleek-accent transition-colors duration-300 leading-tight">
            {lesson.title}
          </h3>
          
          <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed font-light">
            {lesson.description}
          </p>
        </div>

        <div className={`mt-8 pt-6 border-t border-sleek-border flex items-center ${isArabic ? 'flex-row-reverse' : ''} justify-between text-xs font-bold uppercase tracking-widest`}>
          <div className="flex items-center gap-2 text-sleek-accent">
            <span>{isArabic ? 'بدء التعلم' : 'Start Learning'}</span>
            <motion.div
              animate={{ x: isArabic ? [-4, 0, -4] : [4, 0, 4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Play className="w-3 h-3 fill-current" />
            </motion.div>
          </div>
          
          <div className="w-8 h-8 rounded-full border border-sleek-border flex items-center justify-center text-slate-600 group-hover:border-sleek-accent group-hover:text-sleek-accent transition-colors">
            <BarChart size={14} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
