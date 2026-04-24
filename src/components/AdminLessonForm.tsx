/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Youtube, Type, FileText, Globe, BarChart, Image as ImageIcon, Upload, Video, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Lesson } from '../types';
import { auth, storage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from '../lib/firebase';

interface LessonFormProps {
  onSubmit: (data: Partial<Lesson>) => void;
  initialData?: Lesson | null;
  onCancel?: () => void;
  key?: string | number;
}

export function LessonForm({ onSubmit, initialData, onCancel }: LessonFormProps) {
  const [formData, setFormData] = useState<Partial<Lesson>>({
    title: '',
    description: '',
    videoType: 'youtube',
    youtubeId: '',
    videoUrl: '',
    category: 'arabic',
    level: 'Beginner',
    duration: '00:00',
    thumbnail: '',
    pdfUrl: '',
    ...initialData
  });

  // Autosave draft for new lessons
  useEffect(() => {
    if (!initialData) {
      const saved = localStorage.getItem('lesson_draft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only merge specific fields to avoid overwriting category choice
          setFormData(prev => ({ 
            ...prev, 
            title: parsed.title || prev.title,
            description: parsed.description || prev.description,
            youtubeId: parsed.youtubeId || prev.youtubeId,
            videoUrl: parsed.videoUrl || prev.videoUrl,
            duration: parsed.duration || prev.duration
          }));
        } catch (e) {
          console.error("Error loading draft", e);
        }
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData && (formData.title || formData.description)) {
      const draft = {
        title: formData.title,
        description: formData.description,
        youtubeId: formData.youtubeId,
        videoUrl: formData.videoUrl,
        duration: formData.duration
      };
      localStorage.setItem('lesson_draft', JSON.stringify(draft));
    }
  }, [formData, initialData]);

  const [uploading, setUploading] = useState<{ image?: boolean; video?: boolean; pdf?: boolean }>({});
  const [uploadProgress, setUploadProgress] = useState<{ image: number; video: number; pdf: number }>({ image: 0, video: 0, pdf: 0 });
  const [videoMethod, setVideoMethod] = useState<'youtube' | 'file' | 'link'>(
    initialData?.videoType === 'file' ? 'file' : 'youtube'
  );

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Downsizing more for thumbnails to make them load faster
          const MAX_WIDTH = 800; // Smaller width for thumbnails
          const MAX_HEIGHT = 450;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
          }

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to Blob failed'));
            },
            'image/jpeg',
            0.6 // Even more aggressive compression (60%)
          );
        };
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (file: File, type: ('image' | 'video' | 'pdf')) => {
    // Auth Check
    if (!auth.currentUser) {
      alert('يجب تسجيل الدخول كمسؤول أولاً للتمكن من رفع الملفات.');
      return;
    }

    // Basic validation
    if (type === 'video' && file.size > 100 * 1024 * 1024) { // 100MB limit for local videos
      alert('حجم الفيديو كبير جداً (يجب أن يكون أقل من 100 ميجابايت).');
      return;
    }

    if (type === 'pdf' && file.size > 50 * 1024 * 1024) { // 50MB limit for PDFs
      alert('حجم ملف الـ PDF كبير جداً (يجب أن يكون أقل من 50 ميجابايت).');
      return;
    }

    try {
      setUploading(prev => ({ ...prev, [type]: true }));
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));
      
      let fileToUpload: File | Blob = file;
      if (type === 'image') {
        if (file.size > 300 * 1024) {
          try {
            fileToUpload = await compressImage(file);
          } catch (e) {
            console.error("Compression failed, using original:", e);
          }
        }
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileRef = ref(storage, `lessons/${Date.now()}_${safeName}`);
      
      console.log(`Starting upload for ${type}: ${safeName}`);
      const uploadTask = uploadBytesResumable(fileRef, fileToUpload);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, [type]: Math.round(progress) }));
        }, 
        (error) => {
          console.error(`Upload error (${type}):`, error);
          let message = 'حدث خطأ أثناء الرفع. الرجاء المحاولة مرة أخرى.';
          
          if (error.code === 'storage/retry-limit-exceeded') {
            message = 'انتهى الوقت المسموح للرفع بسبب بطء الاتصال أو انقطاعه. يرجى محاولة رفع ملف أصغر أو التأكد من استقرار الإنترنت.';
          } else if (error.code === 'storage/unauthorized') {
            message = 'ليس لديك صلاحية للرفع. تأكد من أنك مسجل الدخول كمسؤول.';
          } else if (error.code === 'storage/quota-exceeded') {
            message = 'تم تجاوز مساحة التخزين المتاحة. يرجى التواصل مع الدعم.';
          }
          
          console.log(`Upload error code: ${error.code}`);
          alert(message);
          setUploading(prev => ({ ...prev, [type]: false }));
        }, 
        async () => {
          try {
            console.log(`Upload complete for ${type}. Getting download URL...`);
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            if (type === 'image') {
              setFormData(prev => ({ ...prev, thumbnail: url }));
            } else if (type === 'video') {
              setFormData(prev => ({ ...prev, videoUrl: url, videoType: 'file' }));
            } else if (type === 'pdf') {
              setFormData(prev => ({ ...prev, pdfUrl: url }));
              console.log("PDF Upload success! URL:", url);
              alert('تم رفع ملف الشرح بنجاح (PDF uploaded successfully)');
            }
          } catch (urlError) {
            console.error("Error getting download URL:", urlError);
            alert('اكتمل الرفع ولكن فشل الحصول على الرابط. يرجى المحاولة مرة أخرى.');
          } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
          }
        }
      );
    } catch (error) {
      console.error(`Unexpected error (${type}):`, error);
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?v=)|(shorts\/)|(\?v=))([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[9].length === 11) ? match[9] : url;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate based on video method
    let finalData = { ...formData };
    
    if (videoMethod === 'youtube') {
      const vid = extractYoutubeId(formData.youtubeId || '');
      if (!vid || vid.length < 5) {
        alert('الرجاء إدخال رابط يوتيوب صحيح');
        return;
      }
      finalData.youtubeId = vid;
      finalData.videoType = 'youtube';
      finalData.videoUrl = ''; // Clear videoUrl if it's youtube
    } else if (videoMethod === 'link' || videoMethod === 'file') {
      if (!formData.videoUrl) {
        alert('الرجاء اختيار ملف فيديو أو وضع رابط مباشر');
        return;
      }
      // Check if it's actually a YouTube link pasted in "Direct Link"
      const vid = extractYoutubeId(formData.videoUrl);
      if (vid && vid.length === 11 && vid !== formData.videoUrl) {
        finalData.youtubeId = vid;
        finalData.videoType = 'youtube';
        finalData.videoUrl = '';
      } else {
        finalData.videoType = 'file';
        finalData.youtubeId = ''; // Clear youtubeId if it's a file
      }
    }
    
    onSubmit(finalData);
    if (!initialData) {
      localStorage.removeItem('lesson_draft');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-sleek-surface border border-sleek-border p-8 rounded-2xl space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Title */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Type size={16} className="text-sleek-accent" />
            عنوان الدرس (Title)
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-sleek-muted border border-sleek-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sleek-accent transition-colors"
            placeholder="مثال: مقدمة في لغة بايثون"
          />
        </div>

        {/* Level */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <BarChart size={16} className="text-sleek-accent" />
            المستوى (Level)
          </label>
          <select
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
            className="w-full bg-sleek-muted border border-sleek-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sleek-accent transition-colors"
          >
            <option value="Beginner">مبتدئ (Beginner)</option>
            <option value="Intermediate">متوسط (Intermediate)</option>
            <option value="Advanced">متقدم (Advanced)</option>
          </select>
        </div>

        {/* Video Method Selector */}
        <div className="md:col-span-3">
          <label className="text-sm font-medium text-slate-300 block mb-3">مصدر الفيديو (Video Source)</label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-sleek-muted rounded-xl border border-sleek-border">
            <button
              type="button"
              onClick={() => setVideoMethod('youtube')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                videoMethod === 'youtube' ? 'bg-sleek-accent text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Youtube size={14} /> يوتيوب
            </button>
            <button
              type="button"
              onClick={() => setVideoMethod('file')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                videoMethod === 'file' ? 'bg-sleek-accent text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload size={14} /> ملف فيديو
            </button>
            <button
              type="button"
              onClick={() => setVideoMethod('link')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                videoMethod === 'link' ? 'bg-sleek-accent text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon size={14} /> رابط مباشر
            </button>
          </div>
        </div>

        {videoMethod === 'youtube' && (
          <div className="md:col-span-3 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Youtube size={16} className="text-red-500" />
                رابط يوتيوب (YouTube Link)
              </label>
              <input
                type="text"
                required={videoMethod === 'youtube'}
                value={formData.youtubeId}
                onChange={(e) => setFormData({ ...formData, youtubeId: e.target.value, videoType: 'youtube' })}
                className="w-full bg-sleek-muted border border-sleek-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sleek-accent transition-colors"
                placeholder="مثال: https://www.youtube.com/watch?v=... أو https://youtu.be/..."
              />
            </div>
            
            {/* YouTube Preview */}
            {formData.youtubeId && extractYoutubeId(formData.youtubeId).length === 11 && (
              <div className="aspect-video w-full max-w-md mx-auto bg-black rounded-xl overflow-hidden border border-sleek-border">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYoutubeId(formData.youtubeId)}`}
                  className="w-full h-full"
                  title="YouTube Preview"
                />
              </div>
            )}
          </div>
        )}

        {videoMethod === 'file' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Upload size={16} className="text-sleek-accent" />
              رفع ملف فيديو (MP4/WebM)
            </label>
            <div className="relative group">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="flex flex-col items-center justify-center gap-2 w-full p-6 bg-sleek-muted border-2 border-dashed border-sleek-border rounded-xl cursor-pointer hover:border-sleek-accent transition-all group-hover:bg-sleek-muted/80"
              >
                {uploading.video ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <Loader2 className="animate-spin text-sleek-accent absolute inset-0" size={48} />
                      <span className="text-[10px] font-bold text-white z-10">{uploadProgress.video}%</span>
                    </div>
                    <span className="text-xs text-slate-400">جاري الرفع...</span>
                  </div>
                ) : formData.videoUrl && videoMethod === 'file' ? (
                  <div className="w-full max-w-xs mx-auto">
                    <video src={formData.videoUrl} className="w-full aspect-video rounded-lg bg-black border border-sleek-border" controls />
                    <div className="flex items-center justify-center gap-2 mt-2">
                       <Video size={14} className="text-green-500" />
                       <span className="text-[10px] text-green-500 font-bold uppercase">تم الرفع بنجاح (Ready)</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="text-slate-400 group-hover:text-sleek-accent" />
                    <span className="text-xs text-slate-400">اضغط لاختيار ملف من جهازك</span>
                  </>
                )}
              </label>
            </div>
          </div>
        )}

        {videoMethod === 'link' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <LinkIcon size={16} className="text-sleek-accent" />
              رابط مباشر للفيديو (Direct URL)
            </label>
            <input
              type="text"
              required={videoMethod === 'link'}
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value, videoType: 'file' })}
              className="w-full bg-sleek-muted border border-sleek-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sleek-accent transition-colors"
              placeholder="https://example.com/video.mp4"
            />
          </div>
        )}

        {/* Thumbnail Upload */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <ImageIcon size={16} className="text-green-500" />
            صورة غلاف الدرس (Custom Thumbnail)
          </label>
          <div className="flex gap-4">
            <div className="w-32 h-20 rounded-xl bg-sleek-muted border border-sleek-border flex-shrink-0 relative overflow-hidden group">
              {formData.thumbnail ? (
                <img 
                  src={formData.thumbnail} 
                  alt="Preview" 
                  loading="lazy"
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <ImageIcon size={24} />
                </div>
              )}
              {uploading.image && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                  <Loader2 className="animate-spin text-white" size={20} />
                  <span className="text-[10px] font-bold text-white">{uploadProgress.image}%</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer transition-colors text-xs font-bold"
                >
                  <Upload size={14} /> اختر من الجهاز
                </label>
              </div>
              <p className="text-[10px] text-slate-500 italic">أو يمكنك وضع رابط مباشر إذا أردت:</p>
              <input
                type="text"
                value={formData.thumbnail || ''}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full bg-sleek-muted border border-sleek-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sleek-accent"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Globe size={16} className="text-sleek-accent" />
            اللغة (Language)
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as 'arabic' | 'english' })}
            className="w-full bg-sleek-muted border border-sleek-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sleek-accent transition-colors"
          >
            <option value="arabic">العربية (Arabic)</option>
            <option value="english">الإنجليزية (English)</option>
          </select>
        </div>

         {/* Duration */}
         <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <FileText size={16} className="text-sleek-accent" />
            المدة (Duration)
          </label>
          <input
            type="text"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full bg-sleek-muted border border-sleek-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sleek-accent transition-colors"
            placeholder="مثال: 15:30"
          />
        </div>

        {/* PDF Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <FileText size={16} className="text-blue-400" />
            ملف الشرح (PDF)
          </label>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={formData.pdfUrl || ''}
                onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                className="w-full bg-sleek-muted border border-sleek-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sleek-accent transition-colors"
                placeholder="رابط ملف الـ PDF"
              />
            </div>
            <div className="relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'pdf')}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="h-full flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-bold"
              >
                {uploading.pdf ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    {uploadProgress.pdf}%
                  </>
                ) : formData.pdfUrl ? (
                  <>
                    <FileText size={14} className="text-green-400" />
                    <span className="truncate max-w-[80px]">تم الرفع</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} /> رفع PDF
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <FileText size={16} className="text-sleek-accent" />
          الوصف (Description)
        </label>
        <textarea
          required
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-sleek-muted border border-sleek-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sleek-accent transition-colors resize-none"
          placeholder="اكتب وصفاً موجزاً لمحتوى الدرس..."
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          className="flex-1 bg-sleek-accent hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-sleek-accent/20 flex items-center justify-center gap-2 disabled:opacity-50"
          disabled={uploading.image || uploading.video || uploading.pdf}
        >
          {(uploading.image || uploading.video || uploading.pdf) && <Loader2 className="animate-spin" size={18} />}
          {initialData ? 'تحديث الدرس (Update)' : 'إضافة الدرس (Save)'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-8 bg-sleek-muted hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
          >
            إلغاء (Cancel)
          </button>
        )}
      </div>
    </form>
  );
}
