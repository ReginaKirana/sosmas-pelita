-- Tabel data balita
CREATE TABLE public.toddlers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mother_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('L', 'P')) NOT NULL,
    birth_date DATE NOT NULL,
    dusun VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel pengukuran bulanan
CREATE TABLE public.measurements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    toddler_id UUID REFERENCES public.toddlers(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    height_cm DECIMAL(5,2) NOT NULL,
    lila_cm DECIMAL(5,2) NOT NULL,
    weight_status VARCHAR(20) CHECK (weight_status IN ('Naik', 'Turun', 'Tetap', 'Baru')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Aturan Row Level Security (RLS)
ALTER TABLE public.toddlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- Kebijakan: Hanya user yang terautentikasi (admin/kader) yang bisa akses semua data
CREATE POLICY "Allow full access to authenticated users for toddlers" 
ON public.toddlers FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow full access to authenticated users for measurements" 
ON public.measurements FOR ALL TO authenticated USING (true);

-- (Opsional) Jika ingin allow anon (sementara untuk testing tanpa login)
CREATE POLICY "Allow read access to anon for toddlers" 
ON public.toddlers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read access to anon for measurements" 
ON public.measurements FOR SELECT TO anon USING (true);

CREATE POLICY "Allow insert access to anon for toddlers" 
ON public.toddlers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow insert access to anon for measurements" 
ON public.measurements FOR INSERT TO anon WITH CHECK (true);
