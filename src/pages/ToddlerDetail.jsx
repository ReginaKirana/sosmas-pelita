import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { calculateAgeInMonths } from '../lib/utils';
import { ArrowLeft, User, Calendar, Activity, TrendingUp, TrendingDown, Minus, MapPin, Edit, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import EditToddlerModal from '../components/EditToddlerModal';
import EditMeasurementModal from '../components/EditMeasurementModal';
import FeedbackModal from '../components/FeedbackModal';

export default function ToddlerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [toddler, setToddler] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditMeasurementModalOpen, setIsEditMeasurementModalOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [feedback, setFeedback] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  const fetchData = async () => {
    // Mock mode fallback
      if (import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co' || !import.meta.env.VITE_SUPABASE_URL) {
        setToddler({
          id, name: 'Budi Santoso', mother_name: 'Siti Rahma', gender: 'L', birth_date: '2023-01-15'
        });
        setMeasurements([
          { measurement_date: '2023-05-15', weight_kg: 6.5, height_cm: 62.0, lila_cm: 13.0, weight_status: 'Baru' },
          { measurement_date: '2023-06-15', weight_kg: 7.0, height_cm: 64.5, lila_cm: 13.5, weight_status: 'Naik' },
          { measurement_date: '2023-07-15', weight_kg: 6.8, height_cm: 66.0, lila_cm: 13.2, weight_status: 'Turun' },
          { measurement_date: '2023-08-15', weight_kg: 7.5, height_cm: 68.0, lila_cm: 14.0, weight_status: 'Naik' },
        ]);
        setIsLoading(false);
        return;
      }

      try {
        const [toddlerRes, measurementsRes] = await Promise.all([
          supabase.from('toddlers').select('*').eq('id', id).single(),
          supabase.from('measurements').select('*').eq('toddler_id', id).order('measurement_date', { ascending: true })
        ]);

        if (toddlerRes.error) throw toddlerRes.error;
        setToddler(toddlerRes.data);
        
        if (measurementsRes.error) throw measurementsRes.error;
        setMeasurements(measurementsRes.data || []);
      } catch (error) {
        console.error('Error fetching toddler details:', error);
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setFeedback({
      isOpen: true,
      title: 'Berhasil',
      message: 'Data profil balita berhasil diperbarui!',
      type: 'success',
      onConfirm: () => {
        setFeedback({ ...feedback, isOpen: false });
        fetchData();
      }
    });
  };

  const handleEditMeasurementSuccess = () => {
    setIsEditMeasurementModalOpen(false);
    setEditingMeasurement(null);
    setFeedback({
      isOpen: true,
      title: 'Berhasil',
      message: 'Riwayat pengukuran berhasil diperbarui!',
      type: 'success',
      onConfirm: () => {
        setFeedback({ ...feedback, isOpen: false });
        fetchData();
      }
    });
  };

  const handleDelete = () => {
    setFeedback({
      isOpen: true,
      title: 'Hapus Balita?',
      message: `Apakah Anda yakin ingin menghapus profil balita ${toddler?.name}? Seluruh riwayat pengukurannya juga akan ikut terhapus permanen.`,
      type: 'confirm',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        setFeedback({ ...feedback, isOpen: false });
        try {
          const { error } = await supabase.from('toddlers').delete().eq('id', id);
          if (error) throw error;
          
          setFeedback({
            isOpen: true,
            title: 'Berhasil',
            message: 'Data balita berhasil dihapus!',
            type: 'success',
            onConfirm: () => navigate('/admin/balita')
          });
        } catch (err) {
          console.error(err);
          setFeedback({
            isOpen: true,
            title: 'Gagal',
            message: 'Terjadi kesalahan saat menghapus data.',
            type: 'error'
          });
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!toddler) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Data Balita Tidak Ditemukan</h2>
        <Link to="/admin/balita" className="text-sky-600 hover:underline">Kembali ke Daftar Balita</Link>
      </div>
    );
  }

  const ageMonths = calculateAgeInMonths(toddler.birth_date);
  
  // Format data for chart
  const chartData = measurements.map(m => {
    const dateObj = new Date(m.measurement_date);
    return {
      name: `${dateObj.toLocaleString('id-ID', { month: 'short' })} '${dateObj.getFullYear().toString().slice(-2)}`,
      Berat: m.weight_kg,
      Tinggi: m.height_cm
    };
  });

  const getStatusIcon = (status) => {
    if (status === 'Naik') return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (status === 'Turun') return <TrendingDown className="w-4 h-4 text-red-600" />;
    if (status === 'Tetap') return <Minus className="w-4 h-4 text-amber-600" />;
    return <Activity className="w-4 h-4 text-sky-600" />;
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Naik') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Turun') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'Tetap') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-sky-50 text-sky-700 border-sky-200';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header Profile Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 text-slate-800 shadow-xl shadow-slate-200/40 border border-white relative overflow-hidden">
        <div className="absolute -top-12 -right-12 p-4 opacity-[0.03]">
          <User className="w-64 h-64 text-slate-900" />
        </div>
        
        <Link to="/admin/balita" className="inline-flex items-center gap-2 text-slate-500 hover:text-sky-600 transition-colors mb-6 text-sm font-medium bg-slate-100/50 px-4 py-2 rounded-full backdrop-blur-sm w-fit">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Balita
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <h2 className="text-4xl font-black mb-3 text-slate-800">{toddler.name}</h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-500 text-sm font-medium mt-1">
              <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> Ibu: {toddler.mother_name}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> Lahir: {new Date(toddler.birth_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
              <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-slate-400" /> Usia: {ageMonths} bulan</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {toddler.dusun}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <span className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm backdrop-blur-sm border ${
              toddler.gender === 'L' ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-pink-50 text-pink-700 border-pink-100'
            }`}>
              {toddler.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-amber-100"
                title="Edit Profil"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button 
                onClick={handleDelete}
                className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                title="Hapus Balita"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Column (Takes up 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-white">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <div className="w-3 h-8 bg-sky-500 rounded-full"></div>
              Grafik Pertumbuhan
            </h3>
            
            {chartData.length > 0 ? (
              <div className="flex flex-col gap-8">
                <div className="h-64">
                  <h4 className="text-sm font-bold text-slate-600 mb-2 text-center">Grafik Berat Badan (kg)</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} dy={10} />
                      <YAxis tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Line type="monotone" dataKey="Berat" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} name="Berat (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-64">
                  <h4 className="text-sm font-bold text-slate-600 mb-2 text-center">Grafik Tinggi Badan (cm)</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} dy={10} />
                      <YAxis tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Line type="monotone" dataKey="Tinggi" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} name="Tinggi (cm)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Belum ada data pengukuran untuk grafik.
              </div>
            )}
          </div>
        </div>

        {/* History Table Column */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/40 border border-white overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100/50 flex items-center justify-between bg-white/50">
              <h3 className="text-lg font-bold text-slate-800">Riwayat Pengukuran</h3>
              <Link to="/admin/input" className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg hover:bg-sky-500 hover:text-white transition-all shadow-sm">
                + Tambah
              </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {measurements.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {measurements.slice().reverse().map((m, index) => {
                    const dateObj = new Date(m.measurement_date);
                    const formattedDate = dateObj.toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    });
                    
                    return (
                      <div 
                        key={m.id || index} 
                        onClick={() => {
                          setEditingMeasurement(m);
                          setIsEditMeasurementModalOpen(true);
                        }}
                        className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-slate-700 text-sm group-hover:text-sky-600 transition-colors">{formattedDate}</div>
                          <div className={`px-2 py-0.5 rounded-md text-xs font-semibold border flex items-center gap-1 ${getStatusBadgeClass(m.weight_status)}`}>
                            {getStatusIcon(m.weight_status)}
                            {m.weight_status}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="bg-slate-50 p-2 rounded-lg text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Berat</div>
                            <div className="font-bold text-slate-700">{m.weight_kg} <span className="text-xs font-normal">kg</span></div>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Tinggi</div>
                            <div className="font-bold text-slate-700">{m.height_cm} <span className="text-xs font-normal">cm</span></div>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Lila</div>
                            <div className="font-bold text-slate-700">{m.lila_cm} <span className="text-xs font-normal">cm</span></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  Belum ada riwayat pengukuran.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditToddlerModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        toddler={toddler}
        onSuccess={handleEditSuccess}
      />

      <EditMeasurementModal 
        isOpen={isEditMeasurementModalOpen}
        onClose={() => {
          setIsEditMeasurementModalOpen(false);
          setEditingMeasurement(null);
        }}
        measurement={editingMeasurement}
        onSuccess={handleEditMeasurementSuccess}
      />

      <FeedbackModal 
        {...feedback} 
        onClose={() => setFeedback({ ...feedback, isOpen: false })} 
      />
    </div>
  );
}
