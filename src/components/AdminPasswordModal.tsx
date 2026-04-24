/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Lock, X } from 'lucide-react';
import React, { useState } from 'react';
import { ADMIN_PASSWORD } from '../adminPassword';

interface AdminPasswordModalProps {
  onConfirm: (password: string) => void;
  onClose: () => void;
}

export function AdminPasswordModal({ onConfirm, onClose }: AdminPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD) {
      onConfirm(password);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-sleek-bg/95 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-sm bg-sleek-surface border border-sleek-border rounded-3xl p-8 shadow-2xl text-center"
      >
        <div className="w-16 h-16 bg-sleek-accent/10 rounded-2xl flex items-center justify-center text-sleek-accent mx-auto mb-6">
          <Lock size={32} />
        </div>

        <h2 className="text-2xl font-bold mb-2">الدخول للمسؤول</h2>
        <p className="text-slate-400 text-sm mb-8">يرجى إدخال رمز المرور المخصص للدخول</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.input
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full bg-sleek-muted border ${error ? 'border-red-500' : 'border-sleek-border'} rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-widest text-white focus:outline-none focus:border-sleek-accent transition-all`}
            placeholder="••••"
          />
          
          <div className="flex gap-3">
            <button
              type="submit"
              onClick={() => handleSubmit()}
              className="flex-1 bg-sleek-accent hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-sleek-accent/20 cursor-pointer active:scale-95"
            >
              تأكيد (Enter)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-4 bg-sleek-muted hover:bg-slate-700 text-white rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <X size={24} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
