/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

interface HeroProps {
  category: 'arabic' | 'english';
}

export function Hero({ category }: HeroProps) {
  const content = {
    arabic: {
      title: 'اتقان البرمجة',
      subtitle: 'ببساطة وذكاء',
      description: 'ابدأ رحلتك في عالم بايثون مع دروس مختارة بعناية، تم تصميمها لتبسيط المفاهيم المعقدة وجعلك مبرمجاً متميزاً.',
      badge: 'CodeWithAlia'
    },
    english: {
      title: 'Master Coding',
      subtitle: 'Simply & Smartly',
      description: 'Start your Python journey with carefully curated lessons, designed to simplify complex concepts and turn you into a pro.',
      badge: 'CWA Platform'
    }
  };

  const current = content[category];
  const isArabic = category === 'arabic';

  return (
    <section className="relative pt-40 pb-24 overflow-hidden border-b border-sleek-border">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sleek-accent/10 blur-[120px] -z-10 rounded-full animate-pulse" />
      <div className="absolute top-40 left-0 w-[300px] h-[300px] bg-purple-500/5 blur-[100px] -z-10 rounded-full" />
      
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-20" />

      <div className="max-w-7xl mx-auto px-8 relative">
        <div className={`flex flex-col ${isArabic ? 'items-end text-right' : 'items-start text-left'}`}>
          <motion.div
            key={category + '-badge'}
            initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-px w-8 bg-sleek-accent" />
            <span className="text-sleek-accent text-[11px] font-mono uppercase tracking-[0.3em] font-medium">
              {current.badge}
            </span>
          </motion.div>

          <motion.div
            key={category + '-title-group'}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl"
          >
            <h1 className="text-7xl md:text-[120px] font-sans font-extrabold tracking-tighter leading-[0.9] text-white mb-4">
              {current.title}
              <span className="block text-sleek-accent opacity-50 italic font-light tracking-normal text-5xl md:text-[80px]">
                {current.subtitle}
              </span>
            </h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="mt-12 text-slate-400 text-lg md:text-2xl max-w-2xl leading-relaxed font-light"
            >
              {current.description}
            </motion.p>
          </motion.div>

          {/* Decorative vertical line */}
          <div className={`hidden lg:block absolute bottom-0 h-40 w-px bg-gradient-to-b from-sleek-accent/50 to-transparent ${isArabic ? 'left-8' : 'right-8'}`} />
        </div>
      </div>
    </section>
  );
}
