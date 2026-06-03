-- HU-27 — Alertas internas al PM por cambio de riesgo
-- Aplicar en Supabase (SQL Editor). Idempotente.

-- 1) Extender notifications con el proyecto afectado (nullable: notifs futuras pueden no tener proyecto)
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS id_project INT REFERENCES project(id_project) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (id_user, read_at);

-- 2) Config de alertas por proyecto (lazy creation: sin fila por defecto)
CREATE TABLE IF NOT EXISTS project_alert_config (
  id_config            SERIAL PRIMARY KEY,
  id_project           INT NOT NULL UNIQUE REFERENCES project(id_project) ON DELETE CASCADE,
  notify_to_yellow     BOOLEAN NOT NULL DEFAULT TRUE,
  notify_to_red        BOOLEAN NOT NULL DEFAULT TRUE,
  notify_score_jump    BOOLEAN NOT NULL DEFAULT TRUE,
  score_jump_threshold INT NOT NULL DEFAULT 15 CHECK (score_jump_threshold BETWEEN 5 AND 50),
  updated_by           INT REFERENCES users(id_user),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
