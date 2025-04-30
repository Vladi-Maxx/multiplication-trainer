-- Създаване на таблица за дракони
CREATE TABLE public.dragons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR NOT NULL,
  image_path VARCHAR NOT NULL,
  unlock_requirement INTEGER DEFAULT 300 NOT NULL,
  unlocked BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Настройка на RLS (Row Level Security)
ALTER TABLE public.dragons ENABLE ROW LEVEL SECURITY;

-- Създаване на политика за четене от всички
CREATE POLICY "Dragons are viewable by everyone" ON public.dragons
  FOR SELECT USING (true);

-- Създаване на политика за редакция само за автентикирани потребители
CREATE POLICY "Dragons can be updated by authenticated users only" ON public.dragons
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Добавяне на индекс за по-бързо търсене по име
CREATE INDEX IF NOT EXISTS dragons_name_idx ON public.dragons(name);
