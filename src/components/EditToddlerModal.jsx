import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, User } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function EditToddlerModal({ isOpen, onClose, toddler, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    mother_name: '',
    gender: 'L',
    birth_date: '',
    dusun: 'Dusun 1'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const dusunOptions = ['Dusun 1', 'Dusun 2', 'Dusun 3', 'Dusun 4', 'Dusun 5', 'Dusun 6'];

  useEffect(() => {
    if (isOpen && toddler) {
      setFormData({
        name: toddler.name || '',
        mother_name: toddler.mother_name || '',
        gender: toddler.gender || 'L',
        birth_date: toddler.birth_date || '',
        dusun: toddler.dusun || 'Dusun 1'
      });
    }
  }, [isOpen, toddler]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toddler) return;

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('toddlers')
        .update({
          name: formData.name,
          mother_name: formData.mother_name,
          gender: formData.gender,
          birth_date: formData.birth_date,
          dusun: formData.dusun
        })
        .eq('id', toddler.id);

      if (error) throw error;
      
      onSuccess();
    } catch (error) {
      console.error('Error updating toddler:', error);
      setFeedback({
        isOpen: true,
        title: 'Gagal Menyimpan',
        message: 'Terjadi kesalahan saat menyimpan perubahan data.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Edit Profil Balita</h2>
              <p className="text-sm text-slate-500">Perbarui informasi dasar balita</p>
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nama Ibu Kandung <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required
                value={formData.mother_name}
                onChange={(e) => setFormData({...formData, mother_name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all"
                placeholder="Masukkan nama ibu"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Dusun <span className="text-red-500">*</span></label>
              <select 
                required
                value={formData.dusun}
                onChange={(e) => setFormData({...formData, dusun: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all bg-white"
              >
                {dusunOptions.map(dusun => (
                  <option key={dusun} value={dusun}>{dusun}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Kelamin <span className="text-red-500">*</span></label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="gender" 
                    value="L"
                    checked={formData.gender === 'L'}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-4 h-4 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Laki-laki</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="gender" 
                    value="P"
                    checked={formData.gender === 'P'}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-4 h-4 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Perempuan</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tanggal Lahir <span className="text-red-500">*</span></label>
              <input 
                type="date" 
                required
                value={formData.birth_date}
                onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all"
              />
            </div>
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
              className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
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
