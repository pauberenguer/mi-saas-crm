-- Crear tabla para respuestas rápidas
CREATE TABLE IF NOT EXISTS respuestas_rapidas (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_respuestas_rapidas_created_by ON respuestas_rapidas(created_by);
CREATE INDEX IF NOT EXISTS idx_respuestas_rapidas_created_at ON respuestas_rapidas(created_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE respuestas_rapidas ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver respuestas rápidas de su organización
-- (por simplicidad, permitimos ver todas las respuestas rápidas a todos los usuarios autenticados)
CREATE POLICY "Usuarios pueden ver todas las respuestas rápidas" ON respuestas_rapidas
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para que los usuarios puedan crear respuestas rápidas
CREATE POLICY "Usuarios pueden crear respuestas rápidas" ON respuestas_rapidas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- Política para que los usuarios puedan actualizar sus propias respuestas rápidas
CREATE POLICY "Usuarios pueden actualizar sus respuestas rápidas" ON respuestas_rapidas
  FOR UPDATE USING (auth.uid() = created_by);

-- Política para que los usuarios puedan eliminar sus propias respuestas rápidas
CREATE POLICY "Usuarios pueden eliminar sus respuestas rápidas" ON respuestas_rapidas
  FOR DELETE USING (auth.uid() = created_by);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_respuestas_rapidas_updated_at 
  BEFORE UPDATE ON respuestas_rapidas 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 