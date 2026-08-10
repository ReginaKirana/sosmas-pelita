import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateAgeInMonths, getAgeCategory } from '../lib/utils';
import { Search, Filter, ChevronRight, ChevronLeft, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ImportPreviewModal from '../components/ImportPreviewModal';
import AddToddlerModal from '../components/AddToddlerModal';
import FeedbackModal from '../components/FeedbackModal';

export default function Toddlers() {
  const [toddlers, setToddlers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('Semua');
  const [dusunFilter, setDusunFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [feedback, setFeedback] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const navigate = useNavigate();

  const fetchToddlers = async () => {
    setIsLoading(true);
      // Mock mode fallback
      if (import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co' || !import.meta.env.VITE_SUPABASE_URL) {
        setToddlers([
          { id: '1', name: 'Budi Santoso', mother_name: 'Siti Rahma', gender: 'L', birth_date: '2023-01-15', dusun: 'Dusun 1' },
          { id: '2', name: 'Ayu Lestari', mother_name: 'Dewi Anjani', gender: 'P', birth_date: '2024-03-20', dusun: 'Dusun 2' },
          { id: '3', name: 'Candra Wijaya', mother_name: 'Rina Marlina', gender: 'L', birth_date: '2022-11-05', dusun: 'Dusun 1' },
        ]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('toddlers')
          .select('*')
          .order('dusun', { ascending: true })
          .order('name', { ascending: true });
        
        if (error) throw error;
        setToddlers(data || []);
      } catch (error) {
        console.error('Error fetching toddlers:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
  useEffect(() => {
    fetchToddlers();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      setIsImportModalOpen(true);
    }
    // Reset input so the same file can be selected again
    e.target.value = null;
  };

  const handleImportSuccess = (count) => {
    setIsImportModalOpen(false);
    setImportFile(null);
    setFeedback({
      isOpen: true,
      title: 'Impor Berhasil!',
      message: `Berhasil memproses ${count} data balita dan pengukurannya.`,
      type: 'success'
    });
    fetchToddlers();
  };

  const filteredToddlers = toddlers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.mother_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (dusunFilter !== 'Semua' && t.dusun !== dusunFilter) return false;
    
    if (ageFilter === 'Semua') return matchesSearch;
    
    const months = calculateAgeInMonths(t.birth_date);
    const category = getAgeCategory(months);
    return matchesSearch && category === ageFilter;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, ageFilter, dusunFilter]);

  const totalPages = Math.ceil(filteredToddlers.length / ITEMS_PER_PAGE);
  const currentToddlers = filteredToddlers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Balita</h1>
          <p className="text-slate-500">Kelola dan pantau daftar balita terdaftar.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 font-bold rounded-xl hover:bg-emerald-100 transition-all shadow-sm">
            <Upload className="w-5 h-5" />
            Import Excel
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </label>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-bold rounded-xl hover:from-sky-600 hover:to-sky-700 shadow-md transition-all"
          >
            + Tambah Balita Baru
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/40 border border-white overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-gradient-to-b from-slate-50/50 to-white">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama balita atau ibu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 text-sm bg-white outline-none transition-all"
            />
          </div>
          <div className="relative min-w-[150px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-slate-400" />
            </div>
            <select
              value={dusunFilter}
              onChange={(e) => setDusunFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 text-sm bg-white outline-none appearance-none transition-all"
            >
              <option value="Semua">Semua Dusun</option>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={`Dusun ${num}`}>Dusun {num}</option>
              ))}
            </select>
          </div>
          <div className="relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-slate-400" />
            </div>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 text-sm bg-white outline-none appearance-none transition-all"
            >
              <option value="Semua">Semua Rentang Usia</option>
              <option value="0-5 bulan">0-5 bulan</option>
              <option value="6-11 bulan">6-11 bulan</option>
              <option value="12-23 bulan">12-23 bulan</option>
              <option value="24-35 bulan">24-35 bulan</option>
              <option value="36-60 bulan">36-60 bulan</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-widest bg-slate-50/80">
                <th className="p-5 font-bold">Nama Balita</th>
                <th className="p-5 font-bold">Nama Ibu</th>
                <th className="p-5 font-bold">Jenis Kelamin</th>
                <th className="px-5 py-4 w-1/5 text-slate-500 font-bold tracking-wider">USIA</th>
                <th className="px-5 py-4 w-1/5 text-slate-500 font-bold tracking-wider">DUSUN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
                    </div>
                    Memuat data...
                  </td>
                </tr>
              ) : filteredToddlers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    Tidak ada data balita yang ditemukan.
                  </td>
                </tr>
              ) : (
                currentToddlers.map((toddler) => {
                  const ageMonths = calculateAgeInMonths(toddler.birth_date);
                  const ageCategory = getAgeCategory(ageMonths);
                  return (
                    <tr 
                      key={toddler.id} 
                      onClick={() => navigate(`/admin/balita/${toddler.id}`)}
                      className="hover:bg-sky-50/50 transition-colors group bg-white cursor-pointer"
                    >
                      <td className="p-5">
                        <div className="font-bold text-slate-800 group-hover:text-sky-600 transition-colors">{toddler.name}</div>
                      </td>
                      <td className="p-5 text-slate-600 font-medium">{toddler.mother_name}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                          toddler.gender === 'L' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'
                        }`}>
                          {toddler.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="text-slate-800 font-bold">{ageMonths} bulan</div>
                      </td>
                      <td className="p-5 text-slate-600 font-medium">{toddler.dusun}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-white/50">
            <span className="text-sm text-slate-500 font-medium">
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredToddlers.length)} dari {filteredToddlers.length} balita
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-bold text-slate-700 px-2">
                Halaman {currentPage} / {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ImportPreviewModal 
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportFile(null);
        }}
        file={importFile}
        onSuccess={handleImportSuccess}
      />

      <AddToddlerModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          setFeedback({
            isOpen: true,
            title: 'Berhasil',
            message: 'Balita baru berhasil ditambahkan.',
            type: 'success'
          });
          fetchToddlers();
        }}
      />
      
      <FeedbackModal 
        {...feedback} 
        onClose={() => setFeedback({ ...feedback, isOpen: false })} 
      />
    </div>
  );
}
