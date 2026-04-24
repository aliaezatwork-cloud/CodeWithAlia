/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from '../components/AdminSidebar';
import { AnalyticsGroup } from '../components/AdminStats';
import { LessonForm } from '../components/AdminLessonForm';
import { StudentForm } from '../components/AdminStudentForm';
import { Lesson, Student } from '../types';
import { db, auth, query, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, getDocs } from '../lib/firebase';
import { Edit2, Trash2, Globe, ExternalLink, Menu, UserPlus, Mail, Phone, Calendar, ChevronRight, Youtube, AlertTriangle, Loader2, FileText } from 'lucide-react';

interface AdminDashboardProps {
  onGoBack: () => void;
}

export default function AdminDashboard({ onGoBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [sortBy, setSortBy] = useState<'order' | 'newest' | 'oldest' | 'title'>('order');
  const [lessonCategoryTab, setLessonCategoryTab] = useState<'arabic' | 'english'>('arabic');

  const handleBulkDeleteLessons = async () => {
    if (lessons.length === 0) return;
    if (!window.confirm('🚨 تحذير خطير: هل أنت متأكد من حذف جميع الدروس نهائياً؟ لا يمكن التراجع عن هذه الخطوة!')) return;
    
    setIsBulkDeleting(true);
    try {
      const batch = writeBatch(db);
      lessons.forEach(l => {
        batch.delete(doc(db, 'lessons', l.id));
      });
      await batch.commit();
      
      // Forces immediate update in case listener lags
      setLessons([]);
      setNotification({ message: 'تم مسح جميع الدروس بنجاح', type: 'success' });
    } catch (error) {
      console.error("Bulk delete lessons error:", error);
      setNotification({ message: 'حدث خطأ أثناء الحذف الجماعي للدروس', type: 'error' });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (students.length === 0) return;
    if (!window.confirm('🚨 تحذير خطير: هل أنت متأكد من حذف جميع الطلاب نهائياً؟ سيتم مسح كافة البيانات!')) return;
    
    setIsBulkDeleting(true);
    try {
      const batch = writeBatch(db);
      students.forEach(s => {
        batch.delete(doc(db, 'students', s.id));
      });
      await batch.commit();
      
      // Forces immediate update
      setStudents([]);
      setNotification({ message: 'تم مسح جميع الطلاب بنجاح', type: 'success' });
    } catch (error) {
      console.error("Bulk delete students error:", error);
      setNotification({ message: 'حدث خطأ أثناء الحذف الجماعي للطلاب', type: 'error' });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Lessons Listener
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'lessons'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`Received snapshot with ${snapshot.docs.length} lessons`);
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return { 
          id: doc.id, 
          ...d,
          // Ensure order exists for sorting
          order: d.order !== undefined ? d.order : 999 
        } as Lesson;
      });
      setLessons(data);
      setLoading(false);
    }, (error) => {
      console.error("Lessons listener error:", error);
      setNotification({ message: 'فشل تحميل الدروس من قاعدة البيانات', type: 'error' });
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Students Listener
  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      const sorted = data.sort((a, b) => {
        const timeA = (a.joinedAt as any)?.seconds || Number.MAX_SAFE_INTEGER;
        const timeB = (b.joinedAt as any)?.seconds || Number.MAX_SAFE_INTEGER;
        return timeB - timeA;
      });
      setStudents(sorted);
    }, (error) => {
      console.error("Students listener error:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateLesson = async (data: Partial<Lesson>) => {
    try {
      // Find the max order to append the new lesson
      const maxOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order || 0)) : -1;
      await addDoc(collection(db, 'lessons'), {
        ...data,
        order: maxOrder + 1,
        createdAt: serverTimestamp()
      });
      setActiveTab('dashboard');
    } catch (error) {
      console.error("Error creating lesson:", error);
    }
  };

  const handleCreateStudent = async (data: Partial<Student>) => {
    try {
      await addDoc(collection(db, 'students'), {
        ...data,
        joinedAt: serverTimestamp()
      });
      setActiveTab('students');
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  const handleUpdateLesson = async (data: Partial<Lesson>) => {
    if (!editingLesson) return;
    console.log("Updating lesson:", editingLesson.id, "Data:", data);
    try {
      const lessonRef = doc(db, 'lessons', editingLesson.id);
      // Strip metadata before updating
      const { id, createdAt, updatedAt, ...updateData } = data as any;
      console.log("Cleaned update data:", updateData);
      await updateDoc(lessonRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      setEditingLesson(null);
      setNotification({ message: 'تم تحديث الدرس بنجاح', type: 'success' });
      setActiveTab('dashboard');
    } catch (error: any) {
      console.error("Error updating lesson details:", error);
      console.error("Error Code:", error.code);
      console.error("Error Message:", error.message);
      setNotification({ message: 'فشل تحديث الدرس', type: 'error' });
      alert(`Permission Denied: Ensure you are logged in correctly.\nEmail: ${auth.currentUser?.email}`);
    }
  };

  const handleUpdateStudent = async (data: Partial<Student>) => {
    if (!editingStudent) return;
    try {
      const studentRef = doc(db, 'students', editingStudent.id);
      // Strip metadata
      const { id, joinedAt, ...updateData } = data as any;
      await updateDoc(studentRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      setEditingStudent(null);
      setNotification({ message: 'تم تحديث بيانات الطالب بنجاح', type: 'success' });
      setActiveTab('students');
    } catch (error) {
      console.error("Error updating student:", error);
      setNotification({ message: 'فشل تحديث بيانات الطالب', type: 'error' });
    }
  };

  const handleDeleteLesson = async (id: string, title: string) => {
    if (!id) return;
    if (!window.confirm(`هل أنت متأكد من حذف الدرس "${title}"؟ سيتم حذفه نهائياً.`)) return;
    
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'lessons', id));
      // Optimistic upate
      setLessons(prev => prev.filter(l => l.id !== id));
      setNotification({ message: `تم حذف الدرس "${title}" بنجاح`, type: 'success' });
    } catch (error: any) {
      console.error("Error deleting lesson:", error);
      setNotification({ message: 'فشل حذف الدرس. يرجى المحاولة مرة أخرى.', type: 'error' });
      alert(`عذراً، فشل حذف الدرس:\n${error?.message || String(error)}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!id) return;
    if (!window.confirm(`هل أنت متأكد من حذف الطالب "${name}" وكافة معلوماته بشكل نهائي؟`)) return;
    
    setDeletingId(id);

    try {
      await deleteDoc(doc(db, 'students', id));
      // Optimistic update
      setStudents(prev => prev.filter(s => s.id !== id));
      setNotification({ message: `تم حذف الطالب "${name}" بنجاح`, type: 'success' });
    } catch (error: any) {
      console.error("Deletion failed:", error);
      setNotification({ message: 'فشل حذف الطالب. يرجى المحاولة مرة أخرى.', type: 'error' });
      alert(`عذراً، فشل حذف الطالب:\n${error?.message || String(error)}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleMoveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    const sortedFiltered = lessons
      .filter(l => l.category === lessonCategoryTab)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    const currentIndex = sortedFiltered.findIndex(l => l.id === lessonId);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedFiltered.length) return;
    
    const currentLesson = sortedFiltered[currentIndex];
    const targetLesson = sortedFiltered[targetIndex];
    
    try {
      const batch = writeBatch(db);
      const currentRef = doc(db, 'lessons', currentLesson.id);
      const targetRef = doc(db, 'lessons', targetLesson.id);
      
      const currentOrder = currentLesson.order ?? currentIndex;
      const targetOrder = targetLesson.order ?? targetIndex;
      
      batch.update(currentRef, { order: targetOrder, updatedAt: serverTimestamp() });
      batch.update(targetRef, { order: currentOrder, updatedAt: serverTimestamp() });
      
      await batch.commit();
      setNotification({ message: 'تم تحديث ترتيب الدروس', type: 'success' });
    } catch (error) {
      console.error("Move lesson error:", error);
      setNotification({ message: 'فشل تغيير الترتيب', type: 'error' });
    }
  };

  return (
    <div className="flex min-h-screen bg-sleek-bg text-slate-100 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        onLogout={() => auth.signOut()}
        onGoBack={onGoBack}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-3 border ${
                notification.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}
              dir="rtl"
            >
              <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Mobile Only */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-sleek-border md:hidden bg-sleek-surface/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-sleek-accent rounded-lg flex items-center justify-center font-bold text-white">Py</div>
             <span className="font-bold">Admin Panel</span>
           </div>
           <button onClick={() => setIsSidebarOpen(true)}>
             <Menu size={24} />
           </button>
        </header>

        <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-8" dir="rtl">
                <h1 className="text-3xl font-bold tracking-tight">الرئيسية (Overview)</h1>
                
                <div className="flex bg-sleek-surface p-1 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setLessonCategoryTab('arabic')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all relative ${
                      lessonCategoryTab === 'arabic' 
                        ? 'bg-sleek-accent text-white shadow-lg' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    دروس اللغة العربية
                    {lessons.filter(l => l.category === 'arabic').length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-sleek-accent border border-white/20 text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                        {lessons.filter(l => l.category === 'arabic').length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setLessonCategoryTab('english')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all relative ${
                      lessonCategoryTab === 'english' 
                        ? 'bg-sleek-accent text-white shadow-lg' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    دروس اللغة الإنجليزية
                    {lessons.filter(l => l.category === 'english').length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-500 border border-white/20 text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                        {lessons.filter(l => l.category === 'english').length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              
              <AnalyticsGroup 
                totalLessons={lessons.length} 
                totalStudents={students.length}
                totalFiles={lessons.filter(l => l.pdfUrl).length}
              />

              <div className="bg-sleek-surface border border-sleek-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-sleek-border flex items-center justify-between" dir="rtl">
                  <h2 className="font-bold flex items-center gap-2">
                    <Globe size={18} className="text-sleek-accent" />
                    {lessonCategoryTab === 'arabic' ? 'دروس العربي' : 'دروس الإنجليزي'}
                  </h2>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-sleek-muted p-1 rounded-xl border border-white/5">
                      {[
                        { id: 'order', title: 'الترتيب المخصص' },
                        { id: 'newest', title: 'الأحدث' },
                        { id: 'oldest', title: 'الأقدم' },
                        { id: 'title', title: 'العنوان' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setSortBy(opt.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            sortBy === opt.id 
                              ? 'bg-sleek-accent text-white' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {opt.title}
                        </button>
                      ))}
                    </div>
                    
                    {lessons.length > 0 && (
                      <button
                        onClick={handleBulkDeleteLessons}
                        disabled={isBulkDeleting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50"
                      >
                        {isBulkDeleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                        حذف كل الدروس نهائياً
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-right" dir="rtl">
                    <thead>
                      <tr className="text-xs uppercase tracking-widest text-slate-500 border-b border-sleek-border">
                        <th className="px-6 py-4 font-semibold">عنوان الدرس</th>
                        <th className="px-6 py-4 font-semibold">اللغة</th>
                        <th className="px-6 py-4 font-semibold">المستوى</th>
                        <th className="px-6 py-4 font-semibold">العمليات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sleek-border">
                      {lessons
                        .filter(l => l.category === lessonCategoryTab)
                        .sort((a, b) => {
                          if (sortBy === 'order') {
                            return (a.order || 0) - (b.order || 0);
                          }
                          if (sortBy === 'title') {
                            return (a.title || '').localeCompare(b.title || '', 'ar');
                          }
                          const timeA = (a.createdAt as any)?.seconds || 0;
                          const timeB = (b.createdAt as any)?.seconds || 0;
                          return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
                        })
                        .map((lesson, idx, arr) => (
                        <tr key={lesson.id} className="hover:bg-sleek-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-white/5 relative group">
                                 <img 
                                   src={lesson.thumbnail || `https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg`} 
                                   alt="" 
                                   loading="lazy"
                                   decoding="async"
                                   className="w-full h-full object-cover transition-opacity duration-300"
                                   onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                                   style={{ opacity: 0 }}
                                 />
                               </div>
                               <div>
                                 <p className="text-sm font-medium flex items-center gap-2">
                                   {lesson.title}
                                   {lesson.pdfUrl && <FileText size={12} className="text-blue-400" title="يوجد ملف شرح" />}
                                 </p>
                                 <p className="text-[10px] text-slate-500 font-mono uppercase">{lesson.duration}</p>
                               </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                              lesson.category === 'arabic' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'
                            }`}>
                              {lesson.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {lesson.level}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {sortBy === 'order' && (
                                <div className="flex flex-col gap-1 mr-2">
                                  <button 
                                    onClick={() => handleMoveLesson(lesson.id, 'up')}
                                    disabled={idx === 0}
                                    className="p-1 hover:bg-slate-700 rounded transition-colors disabled:opacity-30"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                  </button>
                                  <button 
                                    onClick={() => handleMoveLesson(lesson.id, 'down')}
                                    disabled={idx === arr.length - 1}
                                    className="p-1 hover:bg-slate-700 rounded transition-colors disabled:opacity-30"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                  </button>
                                </div>
                              )}
                              <button 
                                onClick={() => {
                                  setEditingLesson(lesson);
                                  setActiveTab('edit');
                                }}
                                className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                disabled={deletingId === lesson.id}
                                onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                                className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                                  deletingId === lesson.id 
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                    : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                                }`}
                                title="حذف الدرس"
                              >
                                {deletingId === lesson.id ? (
                                  <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                              <a 
                                href={lesson.videoType === 'youtube' 
                                  ? `https://youtube.com/watch?v=${lesson.youtubeId}` 
                                  : lesson.videoUrl
                                } 
                                target="_blank"
                                rel="noreferrer"
                                className={`p-2 rounded-lg transition-all ${
                                  (lesson.videoType === 'youtube' && !lesson.youtubeId) || (lesson.videoType === 'file' && !lesson.videoUrl)
                                    ? 'opacity-30 cursor-not-allowed pointer-events-none'
                                    : 'bg-sleek-accent/10 text-sleek-accent hover:bg-sleek-accent hover:text-white'
                                }`}
                                title={lesson.videoType === 'youtube' ? 'فتح على يوتيوب' : 'فتح الرابط المباشر'}
                              >
                                {lesson.videoType === 'youtube' ? <Youtube size={16} /> : <ExternalLink size={16} />}
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {loading && (
                  <div className="p-20 flex justify-center">
                    <div className="w-8 h-8 border-4 border-sleek-accent border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                
                {!loading && lessons.length === 0 && (
                  <div className="p-20 text-center text-slate-500 italic">
                    لا توجد دروس حالياً... ابدأ بإضافة درس جديد.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'add' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <div className="flex items-center justify-between mb-8" dir="rtl">
                 <h1 className="text-3xl font-bold tracking-tight">إضافة درس جديد (New Lesson)</h1>
                 <button 
                   onClick={() => setActiveTab('dashboard')}
                   className="flex items-center gap-2 px-4 py-2 bg-sleek-muted border border-sleek-border hover:border-slate-500 rounded-xl text-slate-300 hover:text-white transition-all text-sm font-medium"
                 >
                   <ChevronRight size={18} />
                   الرجوع للقائمة
                 </button>
               </div>
               <LessonForm key="add-lesson" onSubmit={handleCreateLesson} onCancel={() => setActiveTab('dashboard')} />
            </motion.div>
          )}

          {activeTab === 'edit' && editingLesson && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <div className="flex items-center justify-between mb-8" dir="rtl">
                 <h1 className="text-3xl font-bold tracking-tight">تعديل الدرس (Edit Lesson)</h1>
                 <button 
                   onClick={() => {
                     setEditingLesson(null);
                     setActiveTab('dashboard');
                   }}
                   className="flex items-center gap-2 px-4 py-2 bg-sleek-muted border border-sleek-border hover:border-slate-500 rounded-xl text-slate-300 hover:text-white transition-all text-sm font-medium"
                 >
                   <ChevronRight size={18} />
                   إلغاء التعديل
                 </button>
               </div>
               <LessonForm 
                 key={`edit-${editingLesson.id}`}
                 initialData={editingLesson} 
                 onSubmit={handleUpdateLesson} 
                 onCancel={() => {
                   setEditingLesson(null);
                   setActiveTab('dashboard');
                 }} 
               />
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-8" dir="rtl">
                  <h1 className="text-3xl font-bold tracking-tight">قائمة الطلاب (Students List)</h1>
                  <div className="flex gap-3">
                    {students.length > 0 && (
                      <button
                        onClick={handleBulkDeleteStudents}
                        disabled={isBulkDeleting}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all disabled:opacity-50"
                      >
                        {isBulkDeleting ? <Loader2 className="animate-spin" size={16} /> : <AlertTriangle size={16} />}
                        حذف كل الطلاب
                      </button>
                    )}
                    <button 
                      onClick={() => setActiveTab('add-student')}
                      className="flex items-center gap-2 bg-sleek-accent px-4 py-2 rounded-xl text-white font-bold text-sm shadow-lg shadow-sleek-accent/20"
                    >
                      <UserPlus size={18} />
                      إضافة طالب جديد
                    </button>
                  </div>
                </div>

               <div className="bg-sleek-surface border border-sleek-border rounded-2xl overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-right" dir="rtl">
                      <thead>
                        <tr className="text-xs uppercase tracking-widest text-slate-500 border-b border-sleek-border">
                          <th className="px-6 py-4 font-semibold">اسم الطالب</th>
                          <th className="px-6 py-4 font-semibold">البريد الإلكتروني</th>
                          <th className="px-6 py-4 font-semibold">رقم الهاتف</th>
                          <th className="px-6 py-4 font-semibold">تاريخ الانضمام</th>
                          <th className="px-6 py-4 font-semibold">العمليات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sleek-border">
                        {students.map((student) => (
                          <tr key={student.id} className="hover:bg-sleek-muted/30 transition-colors group">
                            <td className="px-6 py-4 font-medium text-slate-100">
                              {student.name}
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                              {student.email}
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                              {student.phone || '--'}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-[10px] uppercase">
                              {student.joinedAt ? new Date((student.joinedAt as any).seconds * 1000).toLocaleDateString() : '--'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingStudent(student);
                                    setActiveTab('edit-student');
                                  }}
                                  className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                                  title="تعديل الطالب"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  disabled={deletingId === student.id}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteStudent(student.id, student.name);
                                  }}
                                  className={`p-2 rounded-lg transition-all cursor-pointer relative z-10 flex items-center justify-center ${
                                    deletingId === student.id 
                                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                      : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                                  }`}
                                  title="حذف الطالب"
                                >
                                  {deletingId === student.id ? (
                                    <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 size={16} className="pointer-events-none" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
                 {students.length === 0 && (
                   <div className="p-20 text-center text-slate-500 italic">
                     لا يوجد طلاب مسجلون حالياً.
                   </div>
                 )}
               </div>
            </motion.div>
          )}

          {activeTab === 'add-student' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <div className="flex items-center justify-between mb-8" dir="rtl">
                 <h1 className="text-3xl font-bold tracking-tight">إضافة طالب جديد (Add Student)</h1>
                 <button 
                   onClick={() => setActiveTab('students')}
                   className="flex items-center gap-2 px-4 py-2 bg-sleek-muted border border-sleek-border hover:border-slate-500 rounded-xl text-slate-300 hover:text-white transition-all text-sm font-medium"
                 >
                   <ChevronRight size={18} />
                   رجوع لقائمة الطلاب
                 </button>
               </div>
               <StudentForm 
                 onSubmit={handleCreateStudent} 
                 onCancel={() => setActiveTab('students')}
               />
            </motion.div>
          )}

          {activeTab === 'edit-student' && editingStudent && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <div className="flex items-center justify-between mb-8" dir="rtl">
                 <h1 className="text-3xl font-bold tracking-tight">تعديل بيانات الطالب (Edit Student)</h1>
                 <button 
                   onClick={() => {
                     setEditingStudent(null);
                     setActiveTab('students');
                   }}
                   className="flex items-center gap-2 px-4 py-2 bg-sleek-muted border border-sleek-border hover:border-slate-500 rounded-xl text-slate-300 hover:text-white transition-all text-sm font-medium"
                 >
                   <ChevronRight size={18} />
                   إلغاء التعديل
                 </button>
               </div>
               <StudentForm 
                 initialData={editingStudent}
                 onSubmit={handleUpdateStudent} 
                 onCancel={() => {
                  setEditingStudent(null);
                  setActiveTab('students');
                 }}
               />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-8" dir="rtl">
                <h1 className="text-3xl font-bold tracking-tight">إعدادات المنصة (Platform Settings)</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir="rtl">
                {/* Reset Section */}
                <div className="bg-sleek-surface border border-sleek-border p-8 rounded-3xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">منطقة الخطر (Danger Zone)</h3>
                      <p className="text-sm text-slate-500">إجراءات لا يمكن التراجع عنها لتصفير المنصة</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-300">حذف جميع الدروس</span>
                        <span className="text-xs bg-slate-800 px-2 py-1 rounded text-red-400">{lessons.length} درس</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">سيتم مسح كافة الدروس والروابط المرفقة نهائياً من قاعدة البيانات.</p>
                      <button
                        onClick={handleBulkDeleteLessons}
                        disabled={isBulkDeleting || lessons.length === 0}
                        className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-sm font-bold transition-all border border-red-500/20 disabled:opacity-30"
                      >
                        {isBulkDeleting ? <Loader2 className="animate-spin inline mr-2" size={16} /> : <Trash2 className="inline mr-2" size={16} />}
                        حذف كافة الدروس الآن
                      </button>
                    </div>

                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-300">حذف جميع الطلاب</span>
                        <span className="text-xs bg-slate-800 px-2 py-1 rounded text-red-400">{students.length} طالب</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">سيتم مسح كافة حسابات الطلاب المسجلين وبياناتهم تماماً.</p>
                      <button
                        onClick={handleBulkDeleteStudents}
                        disabled={isBulkDeleting || students.length === 0}
                        className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-sm font-bold transition-all border border-red-500/20 disabled:opacity-30"
                      >
                        {isBulkDeleting ? <Loader2 className="animate-spin inline mr-2" size={16} /> : <Trash2 className="inline mr-2" size={16} />}
                        حذف كافة الطلاب الآن
                      </button>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="bg-sleek-surface border border-sleek-border p-8 rounded-3xl flex flex-col items-center justify-center text-center">
                   <div className="w-20 h-20 bg-sleek-accent rounded-3xl shadow-2xl shadow-sleek-accent/20 flex items-center justify-center text-white text-3xl font-bold mb-6">
                      AL
                   </div>
                   <h3 className="text-2xl font-bold mb-2">منصة أمنية (Admin Hub)</h3>
                   <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed">
                     هذه المنصة مخصصة لإدارة المحتوى والطلاب. تأكد من مراجعة البيانات قبل الحذف.
                   </p>
                   <div className="mt-8 pt-8 border-t border-white/5 w-full flex justify-between text-[10px] text-slate-600 uppercase tracking-widest font-mono">
                      <span>Version 2.0.4</span>
                      <span>Built for Alia</span>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
