import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Gunakan Service Role Key untuk bypass RLS (atau Anon Key jika RLS dibuka)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dusunList = ['Dusun 1', 'Dusun 2', 'Dusun 3', 'Dusun 4', 'Dusun 5', 'Dusun 6'];

const toddlersData = [
  { name: 'Budi Santoso', mother_name: 'Siti Rahma', gender: 'L', birth_date: '2023-01-15', dusun: 'Dusun 1' },
  { name: 'Ayu Lestari', mother_name: 'Dewi Anjani', gender: 'P', birth_date: '2024-03-20', dusun: 'Dusun 2' },
  { name: 'Candra Wijaya', mother_name: 'Rina Marlina', gender: 'L', birth_date: '2022-11-05', dusun: 'Dusun 3' },
  { name: 'Dina Amelia', mother_name: 'Fitri Handayani', gender: 'P', birth_date: '2023-08-10', dusun: 'Dusun 4' },
  { name: 'Eka Pratama', mother_name: 'Nia Ramadhani', gender: 'L', birth_date: '2024-01-02', dusun: 'Dusun 5' },
  { name: 'Farhan Naufal', mother_name: 'Maya Sari', gender: 'L', birth_date: '2023-10-12', dusun: 'Dusun 6' },
  { name: 'Gita Andini', mother_name: 'Yulia Citra', gender: 'P', birth_date: '2023-05-18', dusun: 'Dusun 1' },
];

async function generateData() {
  console.log("Menghapus data lama...");
  await supabase.from('measurements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('toddlers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("Memasukkan data balita...");
  const { data: toddlers, error: tError } = await supabase
    .from('toddlers')
    .insert(toddlersData)
    .select();

  if (tError) {
    console.error("Error insert balita:", tError);
    return;
  }

  const measurements = [];
  const currentDate = new Date();
  
  // Buat data pengukuran untuk 3 bulan terakhir
  for (const toddler of toddlers) {
    let lastWeight = null;
    
    for (let i = 2; i >= 0; i--) {
      const measureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 15);
      
      // Berat badan naik secara bertahap atau turun acak
      const weightDelta = (Math.random() * 0.5) - 0.1; // -0.1 to +0.4 kg
      
      let currentWeight;
      if (lastWeight === null) {
        // Base weight based on age (rough estimate)
        currentWeight = 5 + (Math.random() * 5); 
      } else {
        currentWeight = lastWeight + weightDelta;
      }
      currentWeight = Math.max(2, parseFloat(currentWeight.toFixed(2))); // minimum 2kg
      
      const currentHeight = parseFloat((60 + (Math.random() * 20)).toFixed(2));
      const currentLila = parseFloat((12 + (Math.random() * 3)).toFixed(2));
      
      let weightStatus = 'Baru';
      if (lastWeight !== null) {
        if (currentWeight > lastWeight) weightStatus = 'Naik';
        else if (currentWeight < lastWeight) weightStatus = 'Turun';
        else weightStatus = 'Tetap';
      }

      measurements.push({
        toddler_id: toddler.id,
        measurement_date: measureDate.toISOString().split('T')[0],
        weight_kg: currentWeight,
        height_cm: currentHeight,
        lila_cm: currentLila,
        weight_status: weightStatus
      });
      
      lastWeight = currentWeight;
    }
  }

  console.log("Memasukkan data pengukuran...");
  const { error: mError } = await supabase
    .from('measurements')
    .insert(measurements);

  if (mError) {
    console.error("Error insert pengukuran:", mError);
  } else {
    console.log("Dummy data berhasil dimasukkan!");
  }
}

generateData();
