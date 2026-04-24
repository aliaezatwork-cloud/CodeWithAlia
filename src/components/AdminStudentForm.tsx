/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Mail, Phone, Calendar } from 'lucide-react';
import { Student } from '../types';

interface StudentFormProps {
  onSubmit: (data: Partial<Student>) => void;
  onCancel?: () => void;
  initialData?: Student | null;
}

export function StudentForm({ onSubmit, onCancel, initialData }: StudentFormProps) {
  const [formData, setFormData] = useState<Partial<Student>>(initialData || {
    name: '',
    email: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-sleek-surface border border-sleek-border p-8 rounded-2xl space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <User size={16} className="text-sleek-accent" />
            اسم الطالب (Full Name)
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-sleek-muted border border-sleek-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sleek-accent transition-colors"
            placeholder="مثال: أحمد محمد"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Mail size={16} className="text-sleek-accent" />
            البريد الإلكتروني (Email)
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-sleek-muted border border-sleek-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sleek-accent transition-colors"
            placeholder="example@mail.com"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Phone size={16} className="text-sleek-accent" />
            رقم الهاتف (Phone)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-sleek-muted border border-sleek-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sleek-accent transition-colors"
            placeholder="0123456789"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          className="flex-1 bg-sleek-accent hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-sleek-accent/20"
        >
          {initialData ? 'تحديث بيانات الطالب (Update Student)' : 'إضافة الطالب (Add Student)'}
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
