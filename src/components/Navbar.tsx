/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Menu, X, BookOpen, Globe } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  currentCategory: 'arabic' | 'english';
  setCategory: (cat: 'arabic' | 'english') => void;
}

export function Navbar({ currentCategory, setCategory }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'arabic', label: 'الدروس العربية', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'english', label: 'English Content', icon: <Globe className="w-4 h-4" /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-sleek-bg/80 backdrop-blur-xl border-b border-white/5 flex-shrink-0">
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-sleek-accent rounded-xl flex items-center justify-center font-bold text-white shadow-2xl shadow-sleek-accent/20 rotate-3">
            CW
          </div>
          <span className="text-2xl font-bold tracking-tighter hidden sm:block text-white">
            Code<span className="text-sleek-accent font-light italic ml-1">WithAlia</span>
          </span>
        </motion.div>

        {/* Navigation Category Switcher */}
        <div className="hidden md:flex items-center gap-2 bg-sleek-muted p-1 rounded-full border border-white/5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCategory(item.id as 'arabic' | 'english')}
              className={`px-8 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-500 ${
                currentCategory === item.id 
                  ? 'bg-sleek-accent text-white shadow-lg shadow-sleek-accent/20 scale-[1.02]' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* User Profile Placeholder */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:block text-right">
            <p className="text-[10px] text-sleek-accent uppercase tracking-[0.2em] font-bold">Live Portal</p>
            <p className="text-xs font-medium text-slate-400">Student Access</p>
          </div>
          <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-sleek-muted flex items-center justify-center group cursor-pointer hover:border-sleek-accent transition-colors">
            <div className="w-full h-full flex items-center justify-center text-slate-500 group-hover:text-sleek-accent">
               <Globe className="w-5 h-5" />
            </div>
          </div>
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 text-slate-100"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-oasis-bg border-b border-oasis-ink/5 px-6 py-8 flex flex-col gap-6"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCategory(item.id as 'arabic' | 'english');
                setIsOpen(false);
              }}
              className={`flex items-center justify-between text-lg font-medium ${
                currentCategory === item.id ? 'text-oasis-sage' : 'text-oasis-ink/60'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </motion.div>
      )}
    </nav>
  );
}
