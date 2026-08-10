import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, Activity } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function AddMeasurementModal({ isOpen, onClose, toddlerId, onSuccess }) {
  const [formData, setFormData] = useState({
    measurement_date: new Date().toISOString().split('T')[0],
    weight_kg: '',
    height_cm: '',
    lila_cm: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        measurement_date: new Date().toISOString().split('T')[0],
        weight_kg: '',
        height_cm: '',
        lila_cm: ''
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toddlerId) return;

    setIsSubmitting(true);
    
    try {
      const payload = {
        toddler_id: toddlerId,
        measurement_date: formData.measurement_date,
        weight_kg: parseFloat(formData.weight_kg),
        height_cm: parseFloat(formData.height_cm),
        lila_cm: parseFloat(formData.lila_cm),
        weight_status: 'Baru' // Sementara, akan dihitung ulang
      };

      const { error } = await supabase.from('measurements').insert([payload]);
      if (error) throw error;
      
      // REKALKULASI STATUS BERAT BADAN SECARA KRONOLOGIS
      const { data: tMs, error: errMs } = await supabase
        .from('measurements')
        .select('*')
        .eq('toddler_id', toddlerId)
        .order('measurement_date', { ascending: true });
        
      if (!errMs && tMs && tMs.length > 0) {
        for (let i = 0; i < tMs.length; i++) {
            let newStatus = 'Baru';
            if (i > 0) {
              const prevWeight = tMs[i-1].weight_kg;
              const currWeight = tMs[i].weight_kg;
              if (currWeight > prevWeight) newStatus = 'Naik';
              else if (currWeight < prevWeight) newStatus = 'Turun';
              else newStatus = 'Tetap';
            }
            
            if (tMs[i].weight_status !== newStatus) {
              await supabase.from('measurements').update({ weight_status: newStatus }).eq('id', tMs[i].id);
            }
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error adding measurement:', error);
      setFeedback({
        isOpen: true,
        title: 'Gagal Menyimpan',
        message: 'Terjadi kesalahan saat menyimpan pengukuran baru.',
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
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Tambah Pengukuran</h2>
              <p className="text-sm text-slate-500">Input riwayat ukur baru</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Tanggal Penimbangan <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              required
              value={formData.measurement_date}
              onChange={(e) => setFormData({...formData, measurement_date: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Berat Badan (kg) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                step="0.01"
                required
                value={formData.weight_kg}
                onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
                placeholder="Contoh: 12.5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tinggi Badan (cm) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                step="0.1"
                required
                value={formData.height_cm}
                onChange={(e) => setFormData({...formData, height_cm: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
                placeholder="Contoh: 85.2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Lingkar Kepala/Lengan (cm) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                step="0.1"
                required
                value={formData.lila_cm}
                onChange={(e) => setFormData({...formData, lila_cm: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
                placeholder="Contoh: 14.5"
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
              className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
