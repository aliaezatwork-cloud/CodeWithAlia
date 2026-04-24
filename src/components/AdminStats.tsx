/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Users, FileText, TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  labelEn: string;
}

export function StatCard({ label, value, icon, trend, labelEn }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-sleek-surface border border-sleek-border p-6 rounded-2xl flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="w-12 h-12 bg-sleek-accent/10 rounded-xl flex items-center justify-center text-sleek-accent">
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">
            <TrendingUp size={12} />
            {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-300 rtl">{label}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">{labelEn}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function AnalyticsGroup({ totalLessons, totalStudents, totalFiles }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
      <StatCard 
        label="إجمالي الدروس" 
        labelEn="Total Lessons"
        value={totalLessons} 
        icon={<BookOpen size={24} />} 
        trend="+12%"
      />
      <StatCard 
        label="الطلاب المسجلين" 
        labelEn="Active Students"
        value={totalStudents} 
        icon={<Users size={24} />} 
        trend="+5%"
      />
      <StatCard 
        label="ملفات PDF المرفوعة" 
        labelEn="PDF Resources"
        value={totalFiles} 
        icon={<FileText size={24} />} 
      />
    </div>
  );
}
