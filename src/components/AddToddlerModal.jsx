import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, UserPlus } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function AddToddlerModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    mother_name: '',
    gender: 'L',
    birth_date: '',
    dusun: 'Dusun 1'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        mother_name: '',
        gender: 'L',
        birth_date: '',
        dusun: 'Dusun 1'
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('toddlers').insert([formData]);
      if (error) throw error;
      
      onSuccess();
    } catch (error) {
      console.error('Error adding toddler:', error);
      setFeedback({
        isOpen: true,
        title: 'Gagal Menyimpan',
        message: 'Terjadi kesalahan saat menyimpan data balita baru.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Tambah Balita</h2>
              <p className="text-sm text-slate-500">Daftarkan balita baru ke sistem</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nama Lengkap Balita <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all"
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nama Ibu Kandung <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={formData.mother_name}
              onChange={(e) => setFormData({...formData, mother_name: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all"
              placeholder="Contoh: Siti Rahma"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Jenis Kelamin <span className="text-red-500">*</span></label>
              <select 
                required
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all bg-white"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Dusun <span className="text-red-500">*</span></label>
              <select 
                required
                value={formData.dusun}
                onChange={(e) => setFormData({...formData, dusun: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={`Dusun ${num}`}>Dusun {num}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Tanggal Lahir <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              required
              value={formData.birth_date}
              onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all"
            />
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3 mt-8">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-sky-500 to-teal-500 text-white font-bold rounded-xl hover:from-sky-600 hover:to-teal-600 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan
                </>
              )}
            </button>
          </div>
        </form>

      </div>
      
      <FeedbackModal 
        {...feedback} 
        onClose={() => setFeedback({ ...feedback, isOpen: false })} 
      />
    </div>
  );
}
