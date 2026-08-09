import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MOCK_TODDLERS, MOCK_MEASUREMENTS } from '../lib/mockData';
import { calculateAgeInMonths } from '../lib/utils';
import { ArrowLeft, User, Calendar, Activity, TrendingUp, TrendingDown, Minus, MapPin, Printer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ToddlerReport from '../components/ToddlerReport';

export default function PublicToddlerDetail() {
  const { id } = useParams();
  const [toddler, setToddler] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Check if using Mock Data
      if (import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co' || !import.meta.env.VITE_SUPABASE_URL) {
        setTimeout(() => {
          const foundToddler = MOCK_TODDLERS.find(t => t.id === id);
          if (foundToddler) {
            setToddler(foundToddler);
            const foundMeasurements = MOCK_MEASUREMENTS.filter(m => m.toddler_id === id).sort((a,b) => new Date(a.measurement_date) - new Date(b.measurement_date));
            setMeasurements(foundMeasurements);
          }
          setIsLoading(false);
        }, 500);
        return;
      }

      // Real Supabase Fetch
      try {
        const { data: tData, error: tError } = await supabase.from('toddlers').select('*').eq('id', id).single();
        if (tError) throw tError;
        if (tData) {
          setToddler(tData);
          const { data: mData, error: mError } = await supabase.from('measurements').select('*').eq('toddler_id', id).order('measurement_date', { ascending: true });
          if (mError) throw mError;
          setMeasurements(mData || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!toddler) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Data Balita Tidak Ditemukan</h2>
        <Link to="/" className="text-sky-600 hover:underline">Kembali ke Beranda</Link>
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
    <>
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8 print:hidden">
        <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Profile Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 text-slate-800 shadow-xl shadow-slate-200/40 border border-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 p-4 opacity-[0.03]">
            <User className="w-64 h-64 text-slate-900" />
          </div>
          
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-sky-600 transition-colors mb-6 text-sm font-medium bg-slate-100/50 px-4 py-2 rounded-full backdrop-blur-sm w-fit">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Pencarian
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
            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => window.print()} 
                className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm backdrop-blur-sm border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all"
              >
                <Printer className="w-4 h-4" /> Unduh Laporan
              </button>
              <span className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm backdrop-blur-sm border ${
                toddler.gender === 'L' ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-pink-50 text-pink-700 border-pink-100'
              }`}>
                {toddler.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Column */}
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
                        <div key={m.id || index} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-slate-700 text-sm">{formattedDate}</div>
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
      </div>
    </div>

      <ToddlerReport toddler={toddler} measurements={measurements} />
    </>
  );
}
