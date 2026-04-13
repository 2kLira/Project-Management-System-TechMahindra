-- =============================================
-- TechMahindra PMS — Schema Reference
-- Matches Supabase production tables
-- =============================================

-- Users and authentication
CREATE TABLE IF NOT EXISTS users (
    id_user SERIAL PRIMARY KEY,
    email VARCHAR(255),
    username VARCHAR(255),
    password_hash VARCHAR(255),
    full_name TEXT,
    status VARCHAR(50),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role (
    id_role SERIAL PRIMARY KEY,
    id_user INT REFERENCES users(id_user) ON DELETE CASCADE,
    status VARCHAR(50) -- 'admin', 'pm', 'viewer'
);

-- Projects
CREATE TABLE IF NOT EXISTS project (
    id_project SERIAL PRIMARY KEY,
    id_pm INT REFERENCES users(id_user),
    project_name VARCHAR(255),
    description VARCHAR(500),
    deadline TIMESTAMP,
    start_date TIMESTAMP,
    client_name VARCHAR(255),
    estimated_sp INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Project members (viewers linked to projects)
CREATE TABLE IF NOT EXISTS project_member (
    id_member SERIAL PRIMARY KEY,
    id_project INT REFERENCES project(id_project) ON DELETE CASCADE,
    id_user INT REFERENCES users(id_user) ON DELETE CASCADE
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id_audit SERIAL PRIMARY KEY,
    id_user INT REFERENCES users(id_user),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    payload JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_member_user ON project_member(id_user);
CREATE INDEX IF NOT EXISTS idx_project_member_project ON project_member(id_project);
CREATE INDEX IF NOT EXISTS idx_role_user ON role(id_user);
