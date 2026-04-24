/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { LayoutDashboard, PlusCircle, Users, Settings, LogOut, ChevronRight, Menu, X, ArrowLeftCircle } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
  onGoBack: () => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout, onGoBack }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: <LayoutDashboard size={20} />, en: 'Dashboard' },
    { id: 'add', label: 'إضافة درس', icon: <PlusCircle size={20} />, en: 'Add Lesson' },
    { id: 'students', label: 'قائمة الطلاب', icon: <Users size={20} />, en: 'Students' },
    { id: 'settings', label: 'الإعدادات', icon: <Settings size={20} />, en: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed top-0 right-0 h-full bg-sleek-surface border-l border-sleek-border z-50 transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64 translate-x-0' : 'w-64 translate-x-full md:translate-x-0 md:relative'
      }`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-sleek-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sleek-accent rounded-lg flex items-center justify-center font-bold text-white">
              CW
            </div>
            <span className="font-bold text-white tracking-tight">Code<span className="text-sleek-accent">WithAlia</span></span>
          </div>
          <button className="md:hidden" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-sleek-accent text-white shadow-lg shadow-sleek-accent/20' 
                  : 'text-slate-400 hover:bg-sleek-muted hover:text-white'
              }`}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <span className="flex-1 text-right text-sm font-medium">{item.label}</span>
              <ChevronRight size={14} className={activeTab === item.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sleek-border space-y-3 bg-sleek-surface">
          <button
            onClick={onGoBack}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sleek-muted border border-sleek-border text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200 text-sm font-bold shadow-lg"
          >
            <ArrowLeftCircle size={18} className="text-amber-500" />
            الرجوع للموقع (Main Site)
          </button>

          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 text-sm font-bold"
          >
            <LogOut size={18} />
            خروج (Logout)
          </button>
        </div>
      </aside>
    </>
  );
}
