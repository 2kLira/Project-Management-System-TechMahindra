-- =============================================
-- HU-08: Vinculación de viewers al proyecto
-- Esquema de base de datos para Supabase
-- =============================================

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
  id_project SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de asignación de Project Managers a proyectos
-- Un PM puede gestionar múltiples proyectos
CREATE TABLE IF NOT EXISTS project_managers (
  id_project INT REFERENCES projects(id_project) ON DELETE CASCADE,
  id_user INT REFERENCES users(id_user) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id_project, id_user)
);

-- Tabla de vinculación de viewers a proyectos
-- CA-03: El mismo viewer puede ser agregado a más de un proyecto
CREATE TABLE IF NOT EXISTS project_viewers (
  id_project INT REFERENCES projects(id_project) ON DELETE CASCADE,
  id_user INT REFERENCES users(id_user) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id_project, id_user)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_project_managers_user ON project_managers(id_user);
CREATE INDEX IF NOT EXISTS idx_project_viewers_user ON project_viewers(id_user);
CREATE INDEX IF NOT EXISTS idx_project_viewers_project ON project_viewers(id_project);

-- =============================================
-- Datos de prueba (opcional)
-- =============================================

-- Insertar proyecto de prueba
-- INSERT INTO projects (name, description) VALUES 
--   ('Proyecto Demo', 'Un proyecto de demostración para testing');

-- Asignar PM al proyecto (reemplaza 1 con el id_user del PM)
-- INSERT INTO project_managers (id_project, id_user) VALUES (1, 1);
