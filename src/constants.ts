/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lesson } from './types';

export const LESSONS: Lesson[] = [
  {
    id: 'ar-1',
    title: 'مقدمة في لغة بايثون',
    description: 'تعرف على لغة بايثون ولماذا هي الخيار الأفضل للمبتدئين في عالم البرمجة.',
    videoType: 'youtube',
    youtubeId: 'rfscVS0vtbw', 
    category: 'arabic',
    duration: '15:30',
    level: 'Beginner',
  },
  {
    id: 'ar-2',
    title: 'تثبيت البرنامج والبيئة',
    description: 'خطوة بخطوة لتجهيز جهازك لبدء كتابة كود بايثون.',
    videoType: 'youtube',
    youtubeId: 'YYXdvezh3zY',
    category: 'arabic',
    duration: '10:45',
    level: 'Beginner',
  },
  {
    id: 'ar-3',
    title: 'المتغيرات وأنواع البيانات',
    description: 'فهم كيف تخزن المعلومات في بايثون وكيفية التعامل مع الأنواع المختلفة.',
    videoType: 'youtube',
    youtubeId: 'kqtD5dpn9C8',
    category: 'arabic',
    duration: '22:10',
    level: 'Beginner',
  },
  {
    id: 'en-1',
    title: 'Python for Beginners - Full Course',
    description: 'A comprehensive guide to get started with Python from scratch.',
    videoType: 'youtube',
    youtubeId: '_uQrJ0TkZlc', // Mosh Python tutorial
    category: 'english',
    duration: '6:00:00',
    level: 'Beginner',
  },
  {
    id: 'en-2',
    title: 'Advanced Python Decorators',
    description: 'Deep dive into decorators and how they work under the hood.',
    videoType: 'youtube',
    youtubeId: 'MYAEvGWpS84',
    category: 'english',
    duration: '14:20',
    level: 'Advanced',
  },
  {
    id: 'en-3',
    title: 'Object Oriented Programming in Python',
    description: 'Master classes and objects in Python.',
    videoType: 'youtube',
    youtubeId: 'JeznW_7DlB0',
    category: 'english',
    duration: '45:00',
    level: 'Intermediate',
  },
];

export const THEME = {
  colors: {
    bg: '#fbfbf9', // Warm off-white
    ink: '#1c1c1c', // Dark soft black
    sage: '#7d8a7c', // Muted sage green
    cream: '#f5f2ed', // Background accent
  },
};
