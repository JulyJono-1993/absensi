-- ============================================
-- Supabase Schema UPDATE - Fitur Scan RFID
-- EduAttend
-- Jalankan di SQL Editor Supabase (aman dijalankan berulang / idempoten)
-- ============================================

-- ----------------------------------------------------------
-- 1. Kolom RFID pada tabel students
--    rfid_uid NULL = belum registrasi
-- ----------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'rfid_uid'
  ) THEN
    ALTER TABLE public.students ADD COLUMN rfid_uid TEXT;
  END IF;
END $$;

-- Unique hanya untuk yang sudah registrasi (NULL boleh banyak)
DROP INDEX IF EXISTS public.students_rfid_uid_key;
CREATE UNIQUE INDEX students_rfid_uid_key
  ON public.students (rfid_uid) WHERE rfid_uid IS NOT NULL;

-- ----------------------------------------------------------
-- 2. Pengaturan sekolah (batas jam masuk)
--    Default batas_jam_masuk = 07:00.
--    Scan <= batas => H (Masuk), scan > batas => T (Terlambat)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_settings (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  school_name     TEXT,
  batas_jam_masuk TIME        NOT NULL DEFAULT '07:00',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.school_settings (id, batas_jam_masuk)
VALUES (1, '07:00')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------
-- 3. Tambahan kolom pada tabel attendance
--    scan_time   : waktu presisi saat RFID dipindai
--    scan_method : 'rfid' | 'manual' | 'auto'
--    Satu baris per siswa per hari (termasuk yang Hadir)
-- ----------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'scan_time'
  ) THEN
    ALTER TABLE public.attendance ADD COLUMN scan_time TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'scan_method'
  ) THEN
    ALTER TABLE public.attendance ADD COLUMN scan_method TEXT DEFAULT 'manual';
  END IF;
END $$;

-- Unique (student_id, date) -> mencegah scan ganda dalam 1 hari
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attendance_student_date_key'
  ) THEN
    -- amankan dulu kalau ada duplikat (simpan baris terakhir diupdate)
    DELETE FROM public.attendance a
    USING public.attendance b
    WHERE a.student_id = b.student_id
      AND a.date = b.date
      AND a.ctid < b.ctid;

    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_student_date_key UNIQUE (student_id, date);
  END IF;
END $$;

-- Index agar lookup per hari/kelas cepat
CREATE INDEX IF NOT EXISTS attendance_date_class_idx
  ON public.attendance (date, class_id);

-- ==========================================================
-- RPC FUNCTIONS
-- ==========================================================

-- ----------------------------------------------------------
-- Registrasi / ubah ID RFID milik seorang siswa
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_rfid(
  p_student_id INTEGER,
  p_rfid_uid   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict INTEGER;
BEGIN
  -- cek kalau rfid_uid sudah dipakai siswa lain
  SELECT s.id INTO v_conflict
  FROM students s
  WHERE s.rfid_uid = p_rfid_uid AND s.id <> p_student_id
  LIMIT 1;

  IF v_conflict IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'RFID sudah terdaftar pada siswa lain'
    );
  END IF;

  UPDATE students
  SET rfid_uid = NULLIF(TRIM(p_rfid_uid), '')
  WHERE id = p_student_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', CASE WHEN NULLIF(TRIM(p_rfid_uid), '') IS NULL
                    THEN 'RFID dibatalkan' ELSE 'RFID berhasil diregistrasi' END
  );
END;
$$;

-- ----------------------------------------------------------
-- Scan RFID: otomatis menentukan Masuk / Terlambat
-- Mengembalikan data siswa + status
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_rfid_scan(
  p_rfid_uid TEXT,
  p_date     DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student   RECORD;
  v_batas     TIME;
  v_status    TEXT;
  v_scan_time TIMESTAMPTZ;
BEGIN
  SELECT s.id, s.name, s.nisn, s.class_id, c.name AS class_name
    INTO v_student
    FROM students s
    LEFT JOIN classes c ON c.id = s.class_id
   WHERE s.rfid_uid = p_rfid_uid;

  IF v_student.id IS NULL THEN
    RETURN jsonb_build_object(
      'found',   FALSE,
      'message', 'RFID belum terdaftar'
    );
  END IF;

  SELECT COALESCE(batas_jam_masuk, '07:00'::TIME)
    INTO v_batas
    FROM school_settings
   LIMIT 1;

  -- tentukan status berdasarkan batas jam masuk
  v_status := CASE WHEN CURRENT_TIME <= v_batas THEN 'H' ELSE 'T' END;

  INSERT INTO attendance (student_id, class_id, date, status, scan_time, scan_method)
  VALUES (v_student.id, v_student.class_id, p_date, v_status, NOW(), 'rfid')
  ON CONFLICT (student_id, date)
  DO UPDATE SET
    status      = EXCLUDED.status,
    scan_time   = EXCLUDED.scan_time,
    scan_method = 'rfid',
    updated_at  = NOW()
  RETURNING scan_time INTO v_scan_time;

  RETURN jsonb_build_object(
    'found',      TRUE,
    'studentId',  v_student.id,
    'name',       v_student.name,
    'nisn',       v_student.nisn,
    'className',  v_student.class_name,
    'status',     v_status,
    'statusLabel', CASE WHEN v_status = 'H' THEN 'Masuk' ELSE 'Terlambat' END,
    'scanTime',   v_scan_time,
    'message',    CASE WHEN v_status = 'H' THEN 'Masuk' ELSE 'Terlambat' END
  );
END;
$$;

-- ----------------------------------------------------------
-- Ambil daftar absensi kelas untuk 1 tanggal.
-- Siswa TANPA record otomatis dianggap 'A' (Alpa).
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_attendance(
  p_class_id INTEGER,
  p_date     DATE
)
RETURNS TABLE (
  student_id   INTEGER,
  name         TEXT,
  nisn         TEXT,
  status       TEXT,
  scan_time    TIMESTAMPTZ,
  scan_method  TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    s.nisn,
    COALESCE(a.status, 'A') AS status,
    a.scan_time,
    a.scan_method
  FROM students s
  LEFT JOIN attendance a
    ON a.student_id = s.id
   AND a.date = p_date
   AND a.class_id = p_class_id
  WHERE s.class_id = p_class_id
  ORDER BY s.name ASC;
$$;

-- ----------------------------------------------------------
-- Auto-Alpa: siswa di kelas yg BELUM punya record absensi
-- (belum scan / belum diisi manual) ditandai 'A' (Alpa).
-- Mengembalikan jumlah siswa yang ditandai.
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_fill_alpa(
  p_class_id INTEGER,
  p_date     DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO attendance (student_id, class_id, date, status, scan_method)
  SELECT s.id, s.class_id, p_date, 'A', 'auto'
  FROM students s
  WHERE s.class_id = p_class_id
    AND NOT EXISTS (
      SELECT 1 FROM attendance a
      WHERE a.student_id = s.id AND a.date = p_date
    )
  ON CONFLICT (student_id, date) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ----------------------------------------------------------
-- Helper: ubah batas jam masuk (dipanggil dari menu pengaturan)
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_batas_jam_masuk(p_time TIME)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE school_settings SET batas_jam_masuk = p_time, updated_at = NOW()
  WHERE id = 1;
  RETURN FOUND;
END;
$$;
