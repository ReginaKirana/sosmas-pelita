import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, Trash2, Activity } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function EditMeasurementModal({ isOpen, onClose, measurement, onSuccess }) {
  const [formData, setFormData] = useState({
    measurement_date: '',
    weight_kg: '',
    height_cm: '',
    lila_cm: '',
    weight_status: 'Tetap'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  useEffect(() => {
    if (isOpen && measurement) {
      setFormData({
        measurement_date: measurement.measurement_date || '',
        weight_kg: measurement.weight_kg || '',
        height_cm: measurement.height_cm || '',
        lila_cm: measurement.lila_cm || '',
        weight_status: measurement.weight_status || 'Tetap'
      });
    }
  }, [isOpen, measurement]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!measurement) return;

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('measurements')
        .update({
          measurement_date: formData.measurement_date,
          weight_kg: parseFloat(formData.weight_kg),
          height_cm: parseFloat(formData.height_cm),
          lila_cm: parseFloat(formData.lila_cm),
          weight_status: formData.weight_status
        })
        .eq('id', measurement.id);

      if (error) throw error;
      
      // REKALKULASI STATUS BERAT BADAN SECARA KRONOLOGIS
      const { data: tMs, error: errMs } = await supabase
        .from('measurements')
        .select('*')
        .eq('toddler_id', measurement.toddler_id)
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
      console.error('Error updating measurement:', error);
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

  const handleDelete = async () => {
    setFeedback({
      isOpen: true,
      title: 'Hapus Pengukuran?',
      message: 'Apakah Anda yakin ingin menghapus data pengukuran ini? Data yang dihapus tidak dapat dikembalikan.',
      type: 'confirm',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        setIsSubmitting(true);
        setFeedback({ ...feedback, isOpen: false });
        try {
          const { error } = await supabase
            .from('measurements')
            .delete()
            .eq('id', measurement.id);

          if (error) throw error;
          
          // REKALKULASI STATUS BERAT BADAN SECARA KRONOLOGIS
          const { data: tMs, error: errMs } = await supabase
            .from('measurements')
            .select('*')
            .eq('toddler_id', measurement.toddler_id)
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
          console.error('Error deleting measurement:', error);
          setFeedback({
            isOpen: true,
            title: 'Gagal Menghapus',
            message: 'Terjadi kesalahan saat menghapus data.',
            type: 'error'
          });
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Data Pengukuran</h2>
              <p className="text-sm text-slate-500">Edit atau hapus riwayat ukur</p>
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Lingkar Kepala (cm) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                step="0.1"
                required
                value={formData.lila_cm}
                onChange={(e) => setFormData({...formData, lila_cm: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Status Berat <span className="text-red-500">*</span></label>
              <select 
                required
                value={formData.weight_status}
                onChange={(e) => setFormData({...formData, weight_status: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all bg-white"
              >
                <option value="Naik">Naik</option>
                <option value="Turun">Turun</option>
                <option value="Tetap">Tetap</option>
                <option value="Baru">Baru</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 mt-8">
            <button 
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-red-600 bg-red-50 font-bold hover:bg-red-500 hover:text-white rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Hapus
            </button>
            <div className="flex w-full sm:w-auto items-center justify-end gap-3">
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
