import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function ToddlerReport({ toddler, measurements }) {
  if (!toddler) return null;

  const calculateAgeInMonths = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const months = (today.getFullYear() - birth.getFullYear()) * 12;
    return months - birth.getMonth() + today.getMonth();
  };

  const ageMonths = calculateAgeInMonths(toddler.birth_date);
  
  // Sort measurements chronologically (oldest to newest)
  const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.measurement_date) - new Date(b.measurement_date));
  
  // Get last 3 months
  const last3Measurements = sortedMeasurements.slice(-3);
  
  // Get the absolute latest measurement
  const latestM = last3Measurements[last3Measurements.length - 1];

  // Chart data for last 3 months
  const chartData = last3Measurements.map(m => {
    const dateObj = new Date(m.measurement_date);
    return {
      name: `${dateObj.toLocaleString('id-ID', { month: 'short' })} '${dateObj.getFullYear().toString().slice(-2)}`,
      Berat: m.weight_kg,
      Tinggi: m.height_cm
    };
  });

  // Simple Analysis Logic
  let analysisText = "Belum ada cukup data untuk analisis pertumbuhan bulan ini.";
  if (latestM) {
    if (latestM.weight_status === 'Naik') {
      analysisText = `Berdasarkan hasil pengukuran bulan ini, berat badan ananda ${toddler.name} mengalami kenaikan dibandingkan bulan sebelumnya. Status pertumbuhan: NAIK.`;
    } else if (latestM.weight_status === 'Turun') {
      analysisText = `Berdasarkan hasil pengukuran bulan ini, berat badan ananda ${toddler.name} mengalami penurunan dibandingkan bulan sebelumnya. Status pertumbuhan: TURUN.`;
    } else if (latestM.weight_status === 'Tetap') {
      analysisText = `Berdasarkan hasil pengukuran bulan ini, berat badan ananda ${toddler.name} tidak mengalami perubahan dibandingkan bulan sebelumnya. Status pertumbuhan: TETAP.`;
    } else {
      analysisText = `Ini adalah pencatatan data pengukuran pertama untuk ananda ${toddler.name}. Pemantauan tren pertumbuhan akan dievaluasi pada bulan berikutnya.`;
    }
  }

  return (
    <div className="hidden print:block bg-white text-black py-4 px-8 max-w-[190mm] mx-auto font-sans text-[13px]">
      {/* Header Kop Surat */}
      <div className="border-b-4 border-slate-800 pb-4 mb-6 text-center flex flex-col items-center">
        <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">POSYANDU PELITA</h1>
        <p className="text-sm font-semibold tracking-wide text-slate-600 mt-1">Laporan Hasil Pemantauan Pertumbuhan Balita</p>
        <p className="text-xs text-slate-500 mt-1">Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Identitas Balita */}
      <div className="mb-6">
        <h2 className="text-base font-bold border-b-2 border-slate-200 pb-1 mb-3 uppercase tracking-wide">Identitas Balita</h2>
        <div className="grid grid-cols-2 gap-y-2">
          <div><span className="text-slate-500 inline-block w-32">Nama Lengkap</span>: <span className="font-bold">{toddler.name}</span></div>
          <div><span className="text-slate-500 inline-block w-32">Nama Orang Tua</span>: <span className="font-bold">{toddler.mother_name}</span></div>
          <div><span className="text-slate-500 inline-block w-32">Jenis Kelamin</span>: <span className="font-bold">{toddler.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span></div>
          <div><span className="text-slate-500 inline-block w-32">Dusun / Wilayah</span>: <span className="font-bold">{toddler.dusun}</span></div>
          <div><span className="text-slate-500 inline-block w-32">Tanggal Lahir</span>: <span className="font-bold">{new Date(toddler.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
          <div><span className="text-slate-500 inline-block w-32">Usia Saat Ini</span>: <span className="font-bold">{ageMonths} Bulan</span></div>
        </div>
      </div>

      {/* Kesimpulan Utama */}
      <div className={`p-3 rounded-lg border mb-6 ${
        latestM?.weight_status === 'Naik' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
        latestM?.weight_status === 'Turun' ? 'bg-red-50 border-red-200 text-red-900' :
        'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <h3 className="font-bold uppercase mb-1">Catatan Pertumbuhan (Bulan Ini)</h3>
        <p>{analysisText}</p>
      </div>

      {/* Grafik 3 Bulan */}
      <div className="mb-6">
        <h2 className="text-base font-bold border-b-2 border-slate-200 pb-1 mb-3 uppercase tracking-wide">Grafik 3 Bulan Terakhir</h2>
        {chartData.length > 0 ? (
          <div className="w-full flex justify-between items-center gap-4">
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[11px] font-bold mb-2">Berat Badan (kg)</span>
              <LineChart width={320} height={180} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fill: '#475569', fontSize: 10}} tickLine={false} axisLine={false} dy={5} />
                <YAxis tick={{fill: '#475569', fontSize: 10}} tickLine={false} axisLine={false} />
                <Line type="monotone" dataKey="Berat" stroke="#000" strokeWidth={2} dot={{r: 4, fill: '#000'}} isAnimationActive={false} />
              </LineChart>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[11px] font-bold mb-2">Tinggi Badan (cm)</span>
              <LineChart width={320} height={180} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fill: '#475569', fontSize: 10}} tickLine={false} axisLine={false} dy={5} />
                <YAxis tick={{fill: '#475569', fontSize: 10}} tickLine={false} axisLine={false} />
                <Line type="monotone" dataKey="Tinggi" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={{r: 4, fill: '#64748b'}} isAnimationActive={false} />
              </LineChart>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">Belum ada data pengukuran.</p>
        )}
      </div>

      {/* Tabel Rincian */}
      <div>
        <h2 className="text-base font-bold border-b-2 border-slate-200 pb-1 mb-3 uppercase tracking-wide">Rincian Pengukuran</h2>
        <table className="w-full text-[13px] border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-4 py-2 text-left">Tanggal</th>
              <th className="border border-slate-300 px-4 py-2 text-center">Berat (kg)</th>
              <th className="border border-slate-300 px-4 py-2 text-center">Tinggi (cm)</th>
              <th className="border border-slate-300 px-4 py-2 text-center">LILA (cm)</th>
              <th className="border border-slate-300 px-4 py-2 text-center">Status BB</th>
            </tr>
          </thead>
          <tbody>
            {last3Measurements.slice().reverse().map((m, idx) => (
              <tr key={idx}>
                <td className="border border-slate-300 px-4 py-2 font-medium">
                  {new Date(m.measurement_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                </td>
                <td className="border border-slate-300 px-4 py-2 text-center">{m.weight_kg}</td>
                <td className="border border-slate-300 px-4 py-2 text-center">{m.height_cm}</td>
                <td className="border border-slate-300 px-4 py-2 text-center">{m.lila_cm}</td>
                <td className="border border-slate-300 px-4 py-2 text-center uppercase text-xs font-bold">{m.weight_status}</td>
              </tr>
            ))}
            {last3Measurements.length === 0 && (
              <tr>
                <td colSpan="5" className="border border-slate-300 px-4 py-4 text-center italic text-slate-500">Tidak ada data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
