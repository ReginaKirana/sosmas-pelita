import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Activity, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function ToddlerForm() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('balita'); // 'balita' or 'pengukuran'
  const [isLoading, setIsLoading] = useState(false);
  const [toddlers, setToddlers] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '', redirectUrl: null });

  const showModal = (type, title, message, redirectUrl = null) => {
    setModal({ isOpen: true, type, title, message, redirectUrl });
  };

  const [filterDusun, setFilterDusun] = useState('Semua');
  const [searchToddler, setSearchToddler] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Form State: Balita
  const [balitaData, setBalitaData] = useState({
    name: '',
    mother_name: '',
    gender: 'L',
    birth_date: '',
    dusun: 'Dusun 1'
  });

  // Form State: Pengukuran
  const [ukurData, setUkurData] = useState({
    toddler_id: '',
    measurement_date: new Date().toISOString().split('T')[0],
    weight_kg: '',
    height_cm: '',
    lila_cm: ''
  });

  useEffect(() => {
    async function fetchToddlers() {
      if (activeTab === 'pengukuran') {
        const { data } = await supabase.from('toddlers').select('id, name, mother_name, dusun').order('name');
        if (data) setToddlers(data);
      }
    }
    fetchToddlers();
  }, [activeTab]);

  const filteredToddlers = toddlers.filter(t => {
    const matchDusun = filterDusun === 'Semua' || t.dusun === filterDusun;
    return matchDusun;
  });

  const handleBalitaSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co' || !import.meta.env.VITE_SUPABASE_URL) {
      setIsLoading(false);
      showModal('info', 'Mode Mock', "Data disimpan secara lokal.", '/admin/balita');
      return;
    }

    try {
      const { error } = await supabase.from('toddlers').insert([balitaData]);
      if (error) throw error;
      showModal('success', 'Berhasil', 'Data balita berhasil ditambahkan!', '/admin/balita');
    } catch (error) {
      console.error(error);
      showModal('error', 'Gagal Menyimpan', 'Terjadi kesalahan: ' + (error.message || 'Gagal menyimpan data balita. Pastikan tabel sudah dibuat di Supabase.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUkurSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co' || !import.meta.env.VITE_SUPABASE_URL) {
      setIsLoading(false);
      showModal('info', 'Mode Mock', "Data pengukuran disimpan secara lokal.", '/admin/balita');
      return;
    }

    try {
      // Logic for Naik/Turun calculation
      const { data: lastMeasurement } = await supabase
        .from('measurements')
        .select('weight_kg')
        .eq('toddler_id', ukurData.toddler_id)
        .order('measurement_date', { ascending: false })
        .limit(1);

      let status = 'Baru';
      const newWeight = parseFloat(ukurData.weight_kg);

      if (lastMeasurement && lastMeasurement.length > 0) {
        const oldWeight = parseFloat(lastMeasurement[0].weight_kg);
        if (newWeight > oldWeight) status = 'Naik';
        else if (newWeight < oldWeight) status = 'Turun';
        else status = 'Tetap';
      }

      const payload = {
        ...ukurData,
        weight_status: status
      };

      const { error } = await supabase.from('measurements').insert([payload]);
      if (error) throw error;
      
      showModal('success', 'Berhasil', `Data pengukuran berhasil ditambahkan! Status: ${status}`, `/admin/balita/${ukurData.toddler_id}`);
    } catch (error) {
      console.error(error);
      showModal('error', 'Gagal Menyimpan', 'Terjadi kesalahan: ' + (error.message || 'Gagal menyimpan data pengukuran. Pastikan tabel sudah dibuat.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Input Data</h2>
        <p className="text-slate-500">Pilih jenis data yang ingin Anda masukkan ke dalam sistem.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('balita')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors ${
              activeTab === 'balita' 
                ? 'text-sky-600 border-b-2 border-sky-500 bg-sky-50/50' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            Balita Baru
          </button>
          <button
            onClick={() => setActiveTab('pengukuran')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors ${
              activeTab === 'pengukuran' 
                ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-5 h-5" />
            Pengukuran Bulanan
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'balita' ? (
            <form onSubmit={handleBalitaSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap Balita</label>
                  <input
                    type="text"
                    required
                    value={balitaData.name}
                    onChange={(e) => setBalitaData({...balitaData, name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nama Ibu Kandung</label>
                  <input
                    type="text"
                    required
                    value={balitaData.mother_name}
                    onChange={(e) => setBalitaData({...balitaData, mother_name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                    placeholder="Contoh: Siti Rahma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Kelamin</label>
                  <select
                    value={balitaData.gender}
                    onChange={(e) => setBalitaData({...balitaData, gender: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={balitaData.birth_date}
                    onChange={(e) => setBalitaData({...balitaData, birth_date: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Dusun</label>
                  <select
                    value={balitaData.dusun}
                    onChange={(e) => setBalitaData({...balitaData, dusun: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={`Dusun ${num}`}>Dusun {num}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-70"
                >
                  <Save className="w-5 h-5" />
                  Simpan Data Balita
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUkurSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex flex-col md:flex-row md:items-center gap-4 p-5 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-2xl mb-2 shadow-sm">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">1. Filter Wilayah</p>
                    <p className="text-sm text-slate-500">Pilih dusun untuk mempersempit daftar pencarian balita.</p>
                  </div>
                  <div className="w-full md:w-1/3">
                    <select
                      value={filterDusun}
                      onChange={(e) => setFilterDusun(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white font-medium shadow-sm hover:border-emerald-300 cursor-pointer"
                    >
                      <option value="Semua">Semua Dusun</option>
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={`Dusun ${num}`}>Dusun {num}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 relative z-20">
                  <label className="block text-sm font-medium text-slate-700 mb-2">2. Cari & Pilih Balita</label>
                  <div className="relative">
                    <input
                      type="text"
                      required={!ukurData.toddler_id}
                      placeholder="Ketik nama balita untuk mencari dan memilih..."
                      value={searchToddler}
                      onFocus={() => setIsDropdownOpen(true)}
                      onChange={(e) => {
                        setSearchToddler(e.target.value);
                        setUkurData({...ukurData, toddler_id: ''}); // reset ID
                        setIsDropdownOpen(true);
                      }}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white shadow-sm font-medium placeholder:font-normal"
                    />
                    
                    {/* Custom Dropdown Combobox */}
                    {isDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsDropdownOpen(false)}
                        ></div>
                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-64 overflow-auto py-2 overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          {filteredToddlers.length > 0 ? (
                            filteredToddlers.map(t => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setSearchToddler(`${t.name} (Ibu: ${t.mother_name}) - ${t.dusun}`);
                                  setUkurData({...ukurData, toddler_id: t.id});
                                  setIsDropdownOpen(false);
                                }}
                                className="w-full text-left px-5 py-3 hover:bg-emerald-50 focus:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 group"
                              >
                                <div className="font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">{t.name}</div>
                                <div className="text-slate-500 text-xs mt-0.5">Ibu: {t.mother_name} <span className="mx-1">•</span> <span className="font-medium text-slate-400">{t.dusun}</span></div>
                              </button>
                            ))
                          ) : (
                            <div className="px-5 py-6 text-sm text-slate-500 text-center flex flex-col items-center">
                              <span className="text-2xl mb-2">🧐</span>
                              Balita tidak ditemukan
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Pengukuran</label>
                  <input
                    type="date"
                    required
                    value={ukurData.measurement_date}
                    onChange={(e) => setUkurData({...ukurData, measurement_date: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Berat Badan (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={ukurData.weight_kg}
                    onChange={(e) => setUkurData({...ukurData, weight_kg: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Contoh: 12.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tinggi Badan (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={ukurData.height_cm}
                    onChange={(e) => setUkurData({...ukurData, height_cm: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Contoh: 85.2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lingkar Lengan (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={ukurData.lila_cm}
                    onChange={(e) => setUkurData({...ukurData, lila_cm: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Contoh: 14.5"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-70"
                >
                  <Save className="w-5 h-5" />
                  Simpan Pengukuran
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Modal Notifikasi */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6 text-center">
              <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-5 shadow-inner ${
                modal.type === 'success' ? 'bg-emerald-100 text-emerald-500' :
                modal.type === 'error' ? 'bg-red-100 text-red-500' :
                'bg-sky-100 text-sky-500'
              }`}>
                {modal.type === 'success' && <CheckCircle className="w-10 h-10" />}
                {modal.type === 'error' && <AlertCircle className="w-10 h-10" />}
                {modal.type === 'info' && <Activity className="w-10 h-10" />}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{modal.title}</h3>
              <p className="text-sm text-slate-500 mb-8 px-2">{modal.message}</p>
              <button
                onClick={() => {
                  setModal({ ...modal, isOpen: false });
                  if (modal.redirectUrl) navigate(modal.redirectUrl);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
