# Configuración de Supabase

## Paso 1: Crear cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Inicia sesión con GitHub (recomendado) o crea una cuenta

## Paso 2: Crear un nuevo proyecto

1. Haz clic en "New Project"
2. Completa el formulario:
   - **Name**: `split-expense-app` (o el nombre que prefieras)
   - **Database Password**: Elige una contraseña segura (guárdala)
   - **Region**: Elige la región más cercana a tus usuarios
   - **Pricing Plan**: Free (gratis)
3. Haz clic en "Create new project"
4. Espera 1-2 minutos mientras se crea el proyecto

## Paso 3: Obtener las credenciales

1. En el dashboard de Supabase, ve a **Settings** (⚙️) → **API**
2. Encontrarás:
   - **Project URL**: Copia este valor (será `VITE_SUPABASE_URL`)
   - **anon public key**: Copia este valor (será `VITE_SUPABASE_ANON_KEY`)

## Paso 4: Crear la tabla en la base de datos

1. En el dashboard, ve a **SQL Editor** (en el menú lateral)
2. Haz clic en "New query"
3. Copia y pega el siguiente SQL:

```sql
-- Crear tabla para grupos
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY CHECK (char_length(id) = 8),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_groups_id ON groups(id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura pública (cualquiera puede leer)
CREATE POLICY "Allow public read access" ON groups
  FOR SELECT
  USING (true);

-- Política: Permitir inserción pública (cualquiera puede crear)
CREATE POLICY "Allow public insert" ON groups
  FOR INSERT
  WITH CHECK (true);

-- Política: Permitir actualización pública (cualquiera puede actualizar)
CREATE POLICY "Allow public update" ON groups
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en cada UPDATE
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Haz clic en "Run" (o presiona Cmd/Ctrl + Enter)
5. Deberías ver "Success. No rows returned"

## Paso 5: Configurar variables de entorno

1. Crea un archivo `.env` en la raíz del proyecto (si no existe)
2. Agrega las siguientes líneas:

```env
VITE_SUPABASE_URL=tu_project_url_aqui
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

3. Reemplaza `tu_project_url_aqui` y `tu_anon_key_aqui` con los valores que copiaste en el Paso 3

## Paso 6: Verificar la configuración

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre la aplicación en el navegador
3. Abre la consola del navegador (F12)
4. Deberías ver que Supabase está configurado correctamente

## Notas importantes

- **Seguridad**: El `anon key` es seguro para usar en el frontend porque las políticas RLS controlan el acceso
- **Límites del plan gratuito**: 
  - 500 MB de base de datos
  - 1 GB de almacenamiento de archivos
  - 2 GB de ancho de banda
  - Suficiente para miles de grupos compartidos
- **Tiempo real**: Las actualizaciones se sincronizan automáticamente entre todos los usuarios conectados

## Solución de problemas

- **Error "Invalid API key"**: Verifica que copiaste correctamente las credenciales
- **Error "relation does not exist"**: Asegúrate de haber ejecutado el SQL del Paso 4
- **No se sincronizan los cambios**: Verifica que las políticas RLS estén configuradas correctamente
