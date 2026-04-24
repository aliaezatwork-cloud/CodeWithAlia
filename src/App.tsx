/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { LessonCard } from './components/LessonCard';
import { VideoModal } from './components/VideoModal';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import AdminDashboard from './pages/AdminDashboard';
import { Lesson } from './types';
import { auth, db, onSnapshot, query, collection, googleProvider, signInWithPopup, doc, getDoc, serverTimestamp, setDoc } from './lib/firebase';
import { LogIn, ShieldAlert } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'user' | 'admin'>('user');
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<'arabic' | 'english'>('arabic');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'order'>('order');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Hardcoded primary admin
        if (u.email === 'aliaezatwork@gmail.com') {
          setIsAdmin(true);
        } else {
          // Check if Admin in DB
          const adminDoc = await getDoc(doc(db, 'admins', u.uid));
          setIsAdmin(adminDoc.exists());
        }
      } else {
        setIsAdmin(false);
        setView('user');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAdminAuth = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'admins', user.uid), {
        role: 'admin',
        assignedAt: serverTimestamp()
      });
      setIsAdmin(true);
      setShowPassModal(false);
      setView('admin');
    } catch (error) {
      console.error("Admin upgrade failed:", error);
    }
  };

  const handleAdminToggle = () => {
    if (view === 'admin') {
      setView('user');
    } else {
      // Primary admin goes in directly
      if (user?.email === 'aliaezatwork@gmail.com') {
        setView('admin');
      } else {
        // Everyone else enters password every time they want to switch to admin view
        setShowPassModal(true);
      }
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Lessons Listener
  useEffect(() => {
    const q = query(collection(db, 'lessons'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
      setLessons(data);
      setLoading(false);
    }, (error) => {
      console.error("Lessons listener error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (view === 'admin' && isAdmin) {
    return <AdminDashboard onGoBack={() => setView('user')} />;
  }

  const filteredLessons = lessons
    .filter(l => l.category === currentCategory)
    .sort((a, b) => {
      if (sortBy === 'order') {
        return (a.order || 0) - (b.order || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title, currentCategory === 'arabic' ? 'ar' : 'en');
      }
      const timeA = (a.createdAt as any)?.seconds || 0;
      const timeB = (b.createdAt as any)?.seconds || 0;
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="min-h-screen selection:bg-sleek-accent selection:text-white bg-sleek-bg text-slate-100">
      <div className="grain" />
      <Navbar 
        currentCategory={currentCategory} 
        setCategory={setCurrentCategory} 
      />

      {/* Admin Toggle / Login Float */}
      <div className="fixed bottom-8 left-8 z-50 flex flex-col gap-3">
        {user ? (
          <div className="flex flex-col gap-2 items-start">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAdminToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all shadow-xl ${
                isAdmin 
                  ? 'bg-sleek-accent text-white' 
                  : 'bg-sleek-muted text-slate-400 border border-slate-700'
              }`}
            >
              <ShieldAlert size={14} />
              {isAdmin 
                ? (view === 'user' ? 'لوحة المسؤول (Admin)' : 'رجوع للموقع (Main Site)')
                : 'دخول المسؤول (Admin Login)'
              }
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-sleek-accent text-white font-bold text-sm shadow-xl shadow-sleek-accent/20"
          >
            <LogIn size={18} />
            تسجيل الدخول (Login)
          </motion.button>
        )}
      </div>

      <main>
        <Hero category={currentCategory} />

        <section className="max-w-7xl mx-auto px-8 pb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-sleek-accent" />
                <span className="text-sleek-accent text-[10px] font-mono uppercase tracking-[0.3em] font-bold">
                  {currentCategory === 'arabic' ? 'المحتوى التعليمي' : 'Educational Content'}
                </span>
              </div>
              <h2 className={`text-5xl md:text-7xl font-sans font-extrabold tracking-tighter text-white ${currentCategory === 'arabic' ? 'rtl' : ''}`}>
                {currentCategory === 'arabic' ? 'استكشف الدروس' : 'Browse Lessons'}
              </h2>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px] uppercase tracking-widest border-b border-white/5 pb-2">
                <span className="text-white font-bold">{filteredLessons.length}</span>
                <span>{currentCategory === 'arabic' ? 'دروس متاحة' : 'Lessons Available'}</span>
              </div>
              
              <div className="flex items-center gap-1 bg-sleek-surface/50 p-1 rounded-xl border border-white/5 backdrop-blur-sm">
                {[
                  { id: 'order', label: currentCategory === 'arabic' ? 'الترتيب' : 'Order' },
                  { id: 'newest', label: currentCategory === 'arabic' ? 'الأحدث' : 'Newest' },
                  { id: 'oldest', label: currentCategory === 'arabic' ? 'الأقدم' : 'Oldest' },
                  { id: 'title', label: currentCategory === 'arabic' ? 'العنوان' : 'Title' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      sortBy === option.id 
                        ? 'bg-sleek-accent text-white shadow-lg' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-40 flex justify-center">
              <div className="w-12 h-12 border-4 border-sleek-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onSelect={setSelectedLesson}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && filteredLessons.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-slate-500 font-sans italic text-xl">
                Coming soon... Stay tuned for updates!
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="py-24 bg-sleek-surface border-t border-white/5 relative overflow-hidden">
        {/* Subtle background glow for footer */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-sleek-accent/50 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-sleek-accent rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-2xl rotate-3">
              CW
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-2xl font-bold tracking-tighter text-white">CodeWithAlia</span>
              <span className="text-[10px] text-sleek-accent uppercase tracking-[0.3em] font-bold">Premium Learning</span>
            </div>
          </div>
          
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[11px] text-slate-600 font-medium uppercase tracking-widest">
              © 2026 CodeWithAlia. Crafted with precision for future developers.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">System Operational</span>
              </div>
              <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <a href="#" className="hover:text-sleek-accent transition-colors">Twitter</a>
                <a href="#" className="hover:text-sleek-accent transition-colors">GitHub</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {selectedLesson && (
          <VideoModal 
            lesson={selectedLesson} 
            onClose={() => setSelectedLesson(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPassModal && (
          <AdminPasswordModal 
            onConfirm={handleAdminAuth}
            onClose={() => setShowPassModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
