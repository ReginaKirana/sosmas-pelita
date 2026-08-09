import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Users, TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { calculateAgeInMonths, getAgeCategory } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [rawData, setRawData] = useState({ toddlers: [], measurements: [] });
  const [globalDusun, setGlobalDusun] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);

  useEffect(() => {
    // Check if Supabase URL is placeholder
    if (import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co' || !import.meta.env.VITE_SUPABASE_URL) {
      setIsSupabaseConfigured(false);
      // Use mock data
      const mockToddlers = [
        { id: '1', birth_date: '2023-01-15', dusun: 'Dusun 1' },
        { id: '2', birth_date: '2024-03-20', dusun: 'Dusun 2' },
        { id: '3', birth_date: '2022-11-05', dusun: 'Dusun 1' },
        { id: '4', birth_date: '2023-08-10', dusun: 'Dusun 4' },
        { id: '5', birth_date: '2024-01-02', dusun: 'Dusun 5' },
      ];
      const mockMeasurements = [
        { toddler_id: '1', weight_status: 'Naik' },
        { toddler_id: '2', weight_status: 'Turun' },
        { toddler_id: '3', weight_status: 'Tetap' },
        { toddler_id: '4', weight_status: 'Baru' },
        { toddler_id: '5', weight_status: 'Naik' },
      ];
      setRawData({ toddlers: mockToddlers, measurements: mockMeasurements });
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const { data: toddlers, error: tError } = await supabase.from('toddlers').select('*');
        if (tError) throw tError;

        const { data: measurements, error: mError } = await supabase
          .from('measurements')
          .select('*')
          .order('measurement_date', { ascending: false });
        if (mError) throw mError;

        setRawData({ toddlers, measurements });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Compute stats based on globalDusun
  const stats = useMemo(() => {
    const { toddlers, measurements } = rawData;
    
    const filteredToddlers = globalDusun === 'Semua' 
      ? toddlers 
      : toddlers.filter(t => t.dusun === globalDusun);

    const validToddlerIds = new Set(filteredToddlers.map(t => t.id));

    const ageGroupsCount = {
      '0-5 bulan': 0, '6-11 bulan': 0, '12-23 bulan': 0, '24-35 bulan': 0, '36-60 bulan': 0
    };

    filteredToddlers.forEach(t => {
      const months = calculateAgeInMonths(t.birth_date);
      const category = getAgeCategory(months);
      if (ageGroupsCount[category] !== undefined) {
        ageGroupsCount[category]++;
      }
    });

    const latestStatus = { naik: 0, turun: 0, tetap: 0, baru: 0 };
    const processedToddlers = new Set();
    
    measurements.forEach(m => {
      // Only process measurements for toddlers in the selected dusun
      if (validToddlerIds.has(m.toddler_id) && !processedToddlers.has(m.toddler_id)) {
        processedToddlers.add(m.toddler_id);
        if (m.weight_status && m.weight_status.toLowerCase() in latestStatus) {
          latestStatus[m.weight_status.toLowerCase()]++;
        }
      }
    });

    return {
      total: filteredToddlers.length,
      ageGroups: ageGroupsCount,
      statusBB: latestStatus
    };
  }, [rawData, globalDusun]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const ageData = Object.keys(stats.ageGroups).map(key => ({
    name: key,
    jumlah: stats.ageGroups[key]
  }));

  const statusData = [
    { name: 'Naik', value: stats.statusBB.naik, color: '#10b981' }, // emerald-500
    { name: 'Turun', value: stats.statusBB.turun, color: '#ef4444' }, // red-500
    { name: 'Tetap', value: stats.statusBB.tetap, color: '#f59e0b' }, // amber-500
    { name: 'Baru', value: stats.statusBB.baru, color: '#0ea5e9' }, // sky-500
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      
      {!isSupabaseConfigured && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3">
          <Activity className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold">Mode Tampilan (Mock Data)</h3>
            <p className="text-sm">Aplikasi saat ini menggunakan data contoh. Hubungkan `.env` untuk melihat data asli.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500">Ringkasan kesehatan balita {globalDusun === 'Semua' ? 'Desa Cibelok' : globalDusun}.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={globalDusun}
              onChange={(e) => setGlobalDusun(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 text-sm font-medium outline-none appearance-none shadow-sm cursor-pointer"
            >
              <option value="Semua">Semua Wilayah</option>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={`Dusun ${num}`}>Dusun {num}</option>
              ))}
            </select>
          </div>
          <div className="bg-white py-2 px-4 rounded-xl shadow-sm border border-slate-100 font-medium text-sm text-slate-600 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Online
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Total Balita */}
        <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-7 rounded-3xl shadow-xl shadow-sky-200/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -top-6 -right-6 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <Users className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 text-white">
            <p className="text-sky-100 font-medium mb-1 tracking-wide text-sm">Total Balita Terdaftar</p>
            <h3 className="text-5xl font-black drop-shadow-sm">{stats.total}</h3>
            <div className="mt-6 flex items-center gap-1 text-sm text-sky-700 font-bold bg-white/95 backdrop-blur-sm w-fit px-3 py-1.5 rounded-full shadow-sm">
              <span>{globalDusun === 'Semua' ? '6 Dusun Aktif' : 'Wilayah Spesifik'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Balita BB Naik */}
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-7 rounded-3xl shadow-xl shadow-emerald-200/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -top-6 -right-6 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <TrendingUp className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 text-white">
            <p className="text-emerald-100 font-medium mb-1 tracking-wide text-sm">Status BB Naik</p>
            <h3 className="text-5xl font-black drop-shadow-sm">{stats.statusBB.naik}</h3>
            <div className="mt-6 flex items-center gap-1 text-sm text-emerald-700 font-bold bg-white/95 backdrop-blur-sm w-fit px-3 py-1.5 rounded-full shadow-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>Kondisi Ideal</span>
            </div>
          </div>
        </div>

        {/* Card 3: Balita BB Turun */}
        <div className="bg-gradient-to-br from-rose-400 to-red-500 p-7 rounded-3xl shadow-xl shadow-red-200/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -top-6 -right-6 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <TrendingDown className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 text-white">
            <p className="text-rose-100 font-medium mb-1 tracking-wide text-sm">Status BB Turun</p>
            <h3 className="text-5xl font-black drop-shadow-sm">{stats.statusBB.turun}</h3>
            <div className="mt-6 flex items-center gap-1 text-sm text-red-700 font-bold bg-white/95 backdrop-blur-sm w-fit px-3 py-1.5 rounded-full shadow-sm">
              <ArrowDownRight className="w-4 h-4" />
              <span>Perlu Perhatian</span>
            </div>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Persebaran Usia */}
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-white">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-3 h-8 bg-sky-500 rounded-full"></div>
            Persebaran Usia Balita
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="jumlah" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Berat Badan */}
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-white flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            <div className="w-3 h-8 bg-emerald-500 rounded-full"></div>
            Status Berat Badan Terakhir
          </h3>
          <p className="text-sm text-slate-500 mb-6 ml-5">Berdasarkan hasil pengukuran dibandingkan bulan sebelumnya.</p>
          <div className="flex-1 flex items-center justify-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '13px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
