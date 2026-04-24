/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoType: 'youtube' | 'file';
  youtubeId?: string;
  videoUrl?: string; // For uploaded files or direct links
  category: 'arabic' | 'english';
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnail?: string;
  pdfUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  order?: number;
}

export type Category = 'arabic' | 'english';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinedAt: any;
}
