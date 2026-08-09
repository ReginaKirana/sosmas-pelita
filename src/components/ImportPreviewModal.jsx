import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { X, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function ImportPreviewModal({ isOpen, onClose, file, onSuccess }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedDusun, setSelectedDusun] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [feedback, setFeedback] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Available Dusun options (bisa dinamis, tapi kita hardcode 6 dusun sesuai konteks Cibelok)
  const dusunOptions = ['Dusun 1', 'Dusun 2', 'Dusun 3', 'Dusun 4', 'Dusun 5', 'Dusun 6'];

  useEffect(() => {
    if (isOpen && file) {
      processFile(file);
    } else {
      setData([]);
      setSelectedDusun('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setErrorMsg(null);
    }
  }, [isOpen, file]);

  const processFile = async (file) => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      // 1. Fetch existing toddlers & their latest measurements for duplicate checking
      const { data: existingToddlers, error: err1 } = await supabase
        .from('toddlers')
        .select('id, name, mother_name');
        
      if (err1) throw err1;

      // Also get all latest measurements to compare weight
      // We can query all measurements and sort by date descending per toddler, 
      // but a simpler way is to fetch all measurements and group them in memory (since village data is small).
      const { data: allMeasurements, error: err2 } = await supabase
        .from('measurements')
        .select('id, toddler_id, weight_kg, measurement_date')
        .order('measurement_date', { ascending: false });

      if (err2) throw err2;

      const latestMeasurements = {};
      (allMeasurements || []).forEach(m => {
        if (!latestMeasurements[m.toddler_id]) {
          latestMeasurements[m.toddler_id] = m;
        }
      });

      // 2. Read Excel File
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target.result;
          const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
          
          const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('data balita')) || workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });
          
          if (!jsonData || jsonData.length === 0) {
            setErrorMsg("Excel kosong atau tidak ada data.");
            setIsLoading(false);
            return;
          }

          // 3. Process and Validate Data
          const processedData = jsonData.map((row, index) => {
            const errors = [];
            
            // Extract fields based on expected headers
            const name = (row['Nama Balita'] || '').trim();
            const motherName = (row['Nama Orang Tua'] || '').trim();
            const genderRaw = (row['Jenis Kelamin'] || '').trim().toUpperCase();
            const birthDateStr = row['Tanggal Lahir'];
            const measurementDateStr = row['Tanggal Penimbangan'];
            const weight = parseFloat(row['Berat Badan (kg)']);
            const height = parseFloat(row['Tinggi Badan (cm)']);
            const lila = parseFloat(row['Lingkar Kepala (cm)']);
            const notes = (row['Keterangan'] || '').trim();

            // Validations
            if (!name) errors.push("Nama Balita kosong");
            if (!motherName) errors.push("Nama Orang Tua kosong");
            
            let gender = null;
            if (genderRaw === 'L' || genderRaw === 'LAKI-LAKI') gender = 'L';
            else if (genderRaw === 'P' || genderRaw === 'PEREMPUAN') gender = 'P';
            else errors.push("Jenis kelamin tidak valid (L/P)");

            // Date validation (XLSX parsing might give formatted string or JS Date object)
            let birthDate = null;
            if (birthDateStr) {
               birthDate = new Date(birthDateStr);
               if (isNaN(birthDate.getTime())) errors.push("Format Tgl Lahir tidak valid");
            } else errors.push("Tgl Lahir kosong");

            let measurementDate = null;
            if (measurementDateStr) {
               measurementDate = new Date(measurementDateStr);
               if (isNaN(measurementDate.getTime())) errors.push("Format Tgl Penimbangan di Excel tidak valid");
            }

            if (isNaN(weight) || weight <= 0) errors.push("Berat badan tidak valid");
            if (isNaN(height) || height <= 0) errors.push("Tinggi badan tidak valid");
            if (isNaN(lila) || lila <= 0) errors.push("Lingkar kepala tidak valid");

            // Duplicate Checking & Weight Status Logic
            let existingId = null;
            let existingMeasurementId = null;
            let weightStatus = 'Baru';

            if (name && motherName) {
              const duplicate = (existingToddlers || []).find(t => 
                t.name.toLowerCase() === name.toLowerCase() && 
                t.mother_name.toLowerCase() === motherName.toLowerCase()
              );

              if (duplicate) {
                existingId = duplicate.id;
                
                // Cek apakah ada pengukuran di bulan dan tahun yang sama
                const targetDateStr = measurementDate ? measurementDate.toISOString() : selectedDate;
                if (targetDateStr) {
                  const mDate = new Date(targetDateStr);
                  const month = mDate.getMonth();
                  const year = mDate.getFullYear();
                  
                  const sameMonthMeasurement = (allMeasurements || []).find(m => {
                    if (m.toddler_id !== duplicate.id) return false;
                    const d = new Date(m.measurement_date);
                    return d.getMonth() === month && d.getFullYear() === year;
                  });
                  
                  if (sameMonthMeasurement) {
                     existingMeasurementId = sameMonthMeasurement.id;
                  }
                }

                // Hitung status preview berdasarkan data lama terakhir
                const lastM = latestMeasurements[duplicate.id];
                if (lastM && !isNaN(weight)) {
                   if (weight > lastM.weight_kg) weightStatus = 'Naik';
                   else if (weight < lastM.weight_kg) weightStatus = 'Turun';
                   else weightStatus = 'Tetap';
                }
              }
            }

            return {
              rowNumber: index + 2, // Excel rows start at 2 usually (after header)
              name,
              motherName,
              gender,
              birthDate: birthDate ? birthDate.toISOString().split('T')[0] : null,
              measurementDate: measurementDate ? measurementDate.toISOString().split('T')[0] : null,
              weight,
              height,
              lila,
              notes,
              existingId, // If not null, we just insert measurement
              existingMeasurementId, // If not null, we update this measurement
              weightStatus,
              errors,
              isValid: errors.length === 0
            };
          });

          setData(processedData);
        } catch (err) {
          console.error("Parse Error:", err);
          setErrorMsg("Gagal membaca file Excel. Pastikan format sesuai template.");
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error(error);
      setErrorMsg("Terjadi kesalahan saat memproses data.");
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedDusun) {
      setFeedback({
        isOpen: true,
        title: 'Pilih Dusun',
        message: 'Pilih dusun terlebih dahulu!',
        type: 'warning'
      });
      return;
    }

    const validData = data.filter(d => d.isValid);
    if (validData.length === 0) return;

    setIsImporting(true);
    
    try {
      let successCount = 0;
      const affectedToddlers = new Set();

      for (const row of validData) {
        let toddlerId = row.existingId;

        // 1. Insert Toddler if not exist
        if (!toddlerId) {
          const { data: newToddler, error: tErr } = await supabase
            .from('toddlers')
            .insert([{
              name: row.name,
              mother_name: row.motherName,
              gender: row.gender,
              birth_date: row.birthDate,
              dusun: selectedDusun
            }])
            .select('id')
            .single();
            
          if (tErr) {
             console.error("Error inserting toddler:", tErr);
             continue; 
          }
          toddlerId = newToddler.id;
        }

        affectedToddlers.add(toddlerId);

        // 2. Insert or Update Measurement
        if (row.existingMeasurementId) {
          const { error: mErr } = await supabase
            .from('measurements')
            .update({
              measurement_date: row.measurementDate || selectedDate,
              weight_kg: row.weight,
              height_cm: row.height,
              lila_cm: row.lila,
              weight_status: row.weightStatus // Akan dihitung ulang
            })
            .eq('id', row.existingMeasurementId);
            
          if (mErr) console.error("Error updating measurement:", mErr);
          else successCount++;
        } else {
          const { error: mErr } = await supabase
            .from('measurements')
            .insert([{
              toddler_id: toddlerId,
              measurement_date: row.measurementDate || selectedDate,
              weight_kg: row.weight,
              height_cm: row.height,
              lila_cm: row.lila,
              weight_status: row.weightStatus // Akan dihitung ulang
            }]);
            
          if (mErr) console.error("Error inserting measurement:", mErr);
          else successCount++;
        }
      }

      // 3. REKALKULASI STATUS BERAT BADAN SECARA KRONOLOGIS
      for (const tid of affectedToddlers) {
         const { data: tMs, error: errMs } = await supabase
           .from('measurements')
           .select('*')
           .eq('toddler_id', tid)
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
      }

      onSuccess(successCount);
    } catch (error) {
      console.error(error);
      setFeedback({
        isOpen: true,
        title: 'Error',
        message: 'Terjadi kesalahan sistem saat melakukan import.',
        type: 'error'
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  const validCount = data.filter(d => d.isValid).length;
  const errorCount = data.filter(d => !d.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Preview Data Import</h2>
            <p className="text-sm text-slate-500 mt-1">Periksa data sebelum dimasukkan ke database</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mb-4"></div>
              <p className="font-medium">Memproses file Excel...</p>
            </div>
          ) : errorMsg ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-500">
              <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-bold">{errorMsg}</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-6 items-center justify-between">
                <div className="flex gap-6">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Total Data</div>
                    <div className="text-2xl font-black text-slate-800">{data.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-emerald-600 mb-1">Valid (Siap Import)</div>
                    <div className="text-2xl font-black text-emerald-600">{validCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-red-500 mb-1">Error (Diabaikan)</div>
                    <div className="text-2xl font-black text-red-500">{errorCount}</div>
                  </div>
                </div>
                
                <div className="flex gap-6 flex-wrap">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Dusun (Wajib) <span className="text-red-500">*</span></label>
                    <select 
                      value={selectedDusun}
                      onChange={(e) => setSelectedDusun(e.target.value)}
                      className="w-full md:w-56 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 bg-white"
                    >
                      <option value="">-- Pilih Dusun --</option>
                      {dusunOptions.map(dusun => (
                        <option key={dusun} value={dusun}>{dusun}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tgl Penimbangan Global <span className="text-red-500">*</span></label>
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full md:w-48 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 bg-white"
                    />
                    <p className="text-[11px] text-slate-500 mt-1 max-w-[190px]">Dipakai jika di Excel kosong</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Baris Excel</th>
                        <th className="px-4 py-3">Nama Balita</th>
                        <th className="px-4 py-3">Nama Ibu</th>
                        <th className="px-4 py-3">Tgl Lahir</th>
                        <th className="px-4 py-3">BB (kg)</th>
                        <th className="px-4 py-3">Pesan Error / Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((row, i) => (
                        <tr key={i} className={!row.isValid ? "bg-red-50/50" : row.existingId ? "bg-amber-50/40" : ""}>
                          <td className="px-4 py-3">
                            {row.isValid ? (
                              <div className="flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle className="w-4 h-4" /> Valid
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-red-500 font-medium">
                                <AlertCircle className="w-4 h-4" /> Error
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500">#{row.rowNumber}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{row.name || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{row.motherName || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{row.birthDate || '-'}</td>
                          <td className="px-4 py-3 text-slate-800 font-medium">{row.weight || '-'}</td>
                          <td className="px-4 py-3">
                            {!row.isValid ? (
                              <span className="text-red-500 font-medium">{row.errors.join(', ')}</span>
                            ) : row.existingMeasurementId ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                Diperbarui (Bulan Sama)
                              </span>
                            ) : row.existingId ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                Balita Lama, Tambah Pengukuran
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                Balita Baru
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white">
          <button 
            onClick={onClose}
            disabled={isImporting}
            className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          
          <button 
            onClick={handleImport}
            disabled={isImporting || isLoading || validCount === 0 || !selectedDusun || !selectedDate}
            className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-sky-500 to-teal-500 text-white font-bold rounded-xl hover:from-sky-600 hover:to-teal-600 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              `Konfirmasi Import (${validCount} Data)`
            )}
          </button>
        </div>
      </div>
      
      <FeedbackModal 
        {...feedback} 
        onClose={() => setFeedback({ ...feedback, isOpen: false })} 
      />
    </div>
  );
}
