import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MOCK_TODDLERS } from '../lib/mockData';
import { Baby, Search, Calendar, User } from 'lucide-react';

export default function ParentPortal() {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const searchName = name.trim().toLowerCase();
    
    // Check if using Mock Data
    if (import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co' || !import.meta.env.VITE_SUPABASE_URL) {
      setTimeout(() => {
        const toddler = MOCK_TODDLERS.find(t => 
          t.name.toLowerCase().includes(searchName) && t.birth_date === birthDate
        );

        if (toddler) {
          navigate(`/cek-balita/${toddler.id}`);
        } else {
          setError('Data balita tidak ditemukan. Periksa kembali nama dan tanggal lahir.');
        }
        setIsLoading(false);
      }, 500);
      return;
    }

    // Real Supabase Fetch
    try {
      const { data, error } = await supabase
        .from('toddlers')
        .select('*')
        .ilike('name', `%${name.trim()}%`)
        .eq('birth_date', birthDate)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        navigate(`/cek-balita/${data[0].id}`);
      } else {
        setError('Data balita tidak ditemukan. Periksa kembali nama dan tanggal lahir.');
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat mencari data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-hidden">
      
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-sky-200/50 blur-3xl"></div>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] rounded-full bg-teal-200/40 blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-sky-500 to-teal-400 p-4 rounded-3xl shadow-lg shadow-sky-200">
            <Baby className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Portal Orang Tua PELITA Cibelok
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Cek grafik pertumbuhan dan riwayat kesehatan balita Anda.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-white">
          <form className="space-y-6" onSubmit={handleSearch}>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nama Lengkap Balita
              </label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white/50 backdrop-blur-sm transition-all outline-none"
                  placeholder="Masukkan nama lengkap anak"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tanggal Lahir
              </label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white/50 backdrop-blur-sm transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 focus:outline-none transition-all disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Cek Data Balita
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-sky-600 hover:text-sky-500"
            >
              Masuk sebagai Kader / Admin &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
