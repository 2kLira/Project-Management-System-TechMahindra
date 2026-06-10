-- ----------------------------------------------------------------------------
-- ENUM types
-- ----------------------------------------------------------------------------
CREATE TYPE user_role         AS ENUM ('admin', 'pm', 'viewer');
CREATE TYPE milestone_status  AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE risk_level        AS ENUM ('low', 'medium', 'high');
CREATE TYPE risk_status       AS ENUM ('active', 'closed', 'discarded');
CREATE TYPE semaphore_status  AS ENUM ('green', 'yellow', 'red');
CREATE TYPE sprint_status     AS ENUM ('planned', 'active', 'cancelled', 'done');

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id_user        SERIAL PRIMARY KEY,
    email          VARCHAR UNIQUE,
    password_hash  VARCHAR,
    username       VARCHAR UNIQUE,
    last_login     TIMESTAMPTZ,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    full_name      TEXT,
    status         VARCHAR DEFAULT 'Active'
);

-- ----------------------------------------------------------------------------
-- role  (1..n por usuario; status = rol del sistema)
-- ----------------------------------------------------------------------------
CREATE TABLE role (
    id_role  SERIAL PRIMARY KEY,
    id_user  INT NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
    status   user_role
);

-- ----------------------------------------------------------------------------
-- project
-- ----------------------------------------------------------------------------
CREATE TABLE project (
    id_project    SERIAL PRIMARY KEY,
    id_pm         INT NOT NULL REFERENCES users(id_user),
    project_name  VARCHAR,
    description   VARCHAR,
    deadline      TIMESTAMP,
    start_date    TIMESTAMP,
    client_name   VARCHAR,
    estimated_sp  INT,
    created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    id_notifications  SERIAL PRIMARY KEY,
    id_user           INT NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
    subject           VARCHAR,
    write             VARCHAR,
    kind              VARCHAR,
    delivered_at      TIMESTAMP,
    read_at           TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT now(),
    id_project        INT REFERENCES project(id_project) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- gamification
-- ----------------------------------------------------------------------------
CREATE TABLE gamification (
    id_gamification  SERIAL PRIMARY KEY,
    id_user          INT NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
    level            INT
);

-- ----------------------------------------------------------------------------
-- scorehistory
-- ----------------------------------------------------------------------------
CREATE TABLE scorehistory (
    id_score_gained  SERIAL PRIMARY KEY,
    id_gamification  INT NOT NULL REFERENCES gamification(id_gamification) ON DELETE CASCADE,
    level_gained     INT,
    old_level        INT,
    new_level        INT,
    created_at       TIMESTAMP NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- project_update  (histórico de cambios de proyecto)
-- ----------------------------------------------------------------------------
CREATE TABLE project_update (
    id_project_update  SERIAL PRIMARY KEY,
    id_project         INT NOT NULL REFERENCES project(id_project) ON DELETE CASCADE,
    previous_value     VARCHAR,
    new_value          VARCHAR,
    changed_at         TIMESTAMP NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- milestones
-- ----------------------------------------------------------------------------
CREATE TABLE milestones (
    id_milestone  SERIAL PRIMARY KEY,
    id_project    INT NOT NULL REFERENCES project(id_project) ON DELETE CASCADE,
    title         VARCHAR,
    status        milestone_status,
    due_date      TIMESTAMP,
    completed_at  TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- story_points
-- ----------------------------------------------------------------------------
CREATE TABLE story_points (
    id_story    SERIAL PRIMARY KEY,
    id_project  INT NOT NULL REFERENCES project(id_project) ON DELETE CASCADE,
    sp_value    INT,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- auditory
-- ----------------------------------------------------------------------------
CREATE TABLE auditory (
    id_auditory   SERIAL PRIMARY KEY,
    id_project    INT NOT NULL REFERENCES project(id_project) ON DELETE CASCADE,
    id_story      INT NOT NULL REFERENCES story_points(id_story) ON DELETE CASCADE,
    old_sp_value  INT,
    old_deadline  TIMESTAMP,
    new_sp_value  INT,
    new_deadline  TIMESTAMP,
    changed_at    TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- risk
-- ----------------------------------------------------------------------------
CREATE TABLE risk (
    id_risk      SERIAL PRIMARY KEY,
    id_project   INT NOT NULL REFERENCES project(id_project) ON DELETE CASCADE,
    title        VARCHAR,
    description  TEXT,
    level        risk_level NOT NULL,
    status       risk_status,
    closed_at    TIMESTAMP,
    created_at   TIMESTAMP NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- semaphore  (un registro por proyecto)
-- ----------------------------------------------------------------------------
CREATE TABLE semaphore (
    id_semaphore         SERIAL PRIMARY KEY,
    id_project           INT NOT NULL UNIQUE REFERENCES project(id_project) ON DELETE CASCADE,
    status               semaphore_status,
    semaphore_update_at  TIMESTAMP NOT NULL DEFAULT now(),
    risk_score           INT
);

-- ----------------------------------------------------------------------------
-- budget
-- ----------------------------------------------------------------------------
CREATE TABLE budget (
    id_budget        SERIAL PRIMARY KEY,
    id_project       INT NOT NULL REFERENCES project(id_project) ON DELETE CASCADE,
    can_view_budget  BOOLEAN,
    total_cost       NUMERIC,
    description      VARCHAR
);

-- ----------------------------------------------------------------------------
-- spend
-- ----------------------------------------------------------------------------
CREATE TABLE spend (
    id_spend      SERIAL PRIMARY KEY,
    id_budget     INT NOT NULL REFERENCES budget(id_budget) ON DELETE CASCADE,
    spendmoney    NUMERIC,
    type          VARCHAR,
    description   TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    status        VARCHAR NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_by  INT REFERENCES users(id_user),
    decided_by    INT REFERENCES users(id_user),
    decided_at    TIMESTAMP,
    spend_date    DATE
);

-- ----------------------------------------------------------------------------
-- sprint
-- ----------------------------------------------------------------------------
CREATE TABLE sprint (
    id_sprint     SERIAL PRIMARY KEY,
    id_project    INT NOT NULL REFERENCES project(id_project) ON DELETE CASCADE,
    name          VARCHAR,
    begin_at      TIMESTAMP,
    deadline      TIMESTAMP,
    status        sprint_status,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    "SP_estimated" BIGINT
);

-- ----------------------------------------------------------------------------
-- sprint_plan  (SP planeados por sprint)
-- ----------------------------------------------------------------------------
CREATE TABLE sprint_plan (
    id_sprintplan  SERIAL PRIMARY KEY,
    id_sprint      INT NOT NULL REFERENCES sprint(id_sprint) ON DELETE CASCADE,
    planed_sp      INT
);

-- ----------------------------------------------------------------------------
-- sprint_progress  (SP completados por fecha)
-- ----------------------------------------------------------------------------
CREATE TABLE sprint_progress (
    id_sprint_progress  SERIAL PRIMARY KEY,
    id_sprint           INT NOT NULL REFERENCES sprint(id_sprint) ON DELETE CASCADE,
    date                TIMESTAMP NOT NULL DEFAULT now(),
    completed_sp        INT
);

-- ----------------------------------------------------------------------------
-- project_member  (vínculo viewer <-> proyecto)
-- ----------------------------------------------------------------------------
CREATE TABLE project_member (
    id_member   SERIAL PRIMARY KEY,
    id_project  INT NOT NULL REFERENCES project(id_project) ON DELETE CASCADE,
    id_user     INT NOT NULL REFERENCES users(id_user) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- audit_log
-- ----------------------------------------------------------------------------
CREATE TABLE audit_log (
    id_audit    SERIAL PRIMARY KEY,
    id_user     INT NOT NULL REFERENCES users(id_user),
    action      VARCHAR NOT NULL,
    entity      VARCHAR NOT NULL,
    entity_id   VARCHAR,
    payload     JSONB,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- work_item  (historias / tareas / bugs)
-- ----------------------------------------------------------------------------
CREATE TABLE work_item (
    id_work_item        SERIAL PRIMARY KEY,
    id_sprint           INT NOT NULL REFERENCES sprint(id_sprint) ON DELETE CASCADE,
    title               VARCHAR NOT NULL,
    description         TEXT,
    assignee_id         INT REFERENCES users(id_user),
    created_by          INT REFERENCES users(id_user),
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now(),
    type                VARCHAR DEFAULT 'task'
                          CHECK (type IN ('user_story', 'task', 'bug')),
    status              VARCHAR DEFAULT 'todo'
                          CHECK (status IN ('todo', 'in_progress', 'done')),
    start_date          DATE,
    end_date            DATE,
    story_points        INT DEFAULT 0,
    gamification_weight INT DEFAULT 1,
    bonus_archive       BOOLEAN
);

-- ----------------------------------------------------------------------------
-- blocker_implication  (bloqueadores e implicaciones)
-- ----------------------------------------------------------------------------
CREATE TABLE blocker_implication (
    id_blocker       SERIAL PRIMARY KEY,
    id_work_item     INT NOT NULL REFERENCES work_item(id_work_item) ON DELETE CASCADE,
    id_project       INT NOT NULL REFERENCES project(id_project) ON DELETE CASCADE,
    kind             VARCHAR NOT NULL CHECK (kind IN ('blocker', 'implication')),
    severity         VARCHAR NOT NULL CHECK (severity IN ('low', 'medium', 'critical')),
    description      TEXT NOT NULL,
    impact           TEXT NOT NULL,
    created_by       INT NOT NULL REFERENCES users(id_user),
    created_at       TIMESTAMP DEFAULT now(),
    approved_by      INT REFERENCES users(id_user),
    approval_status  VARCHAR DEFAULT 'pending'
                       CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    rejected_reason  TEXT,
    decided_at       TIMESTAMP,
    deadline         TIMESTAMPTZ,
    resolved_at      TIMESTAMPTZ,
    resolved_by      INT REFERENCES users(id_user)
);

-- ----------------------------------------------------------------------------
-- project_alert_config  (config de alertas por proyecto; un registro por proyecto)
-- ----------------------------------------------------------------------------
CREATE TABLE project_alert_config (
    id_config            SERIAL PRIMARY KEY,
    id_project           INT NOT NULL UNIQUE REFERENCES project(id_project) ON DELETE CASCADE,
    notify_to_yellow     BOOLEAN NOT NULL DEFAULT true,
    notify_to_red        BOOLEAN NOT NULL DEFAULT true,
    notify_score_jump    BOOLEAN NOT NULL DEFAULT true,
    score_jump_threshold INT NOT NULL DEFAULT 15
                           CHECK (score_jump_threshold >= 5 AND score_jump_threshold <= 50),
    updated_by           INT REFERENCES users(id_user),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- VIEW: all_data_project
-- Consumida por el chatbot (modules/suggestions). Es una VISTA, no una tabla.
-- Agrega datos de proyecto + story_points + budget + spend + risk.
-- ----------------------------------------------------------------------------
CREATE VIEW all_data_project AS
SELECT p.id_project,
       p.project_name,
       p.description       AS project_description,
       p.deadline,
       p.start_date,
       p.estimated_sp,
       sp.sp_value,
       b.total_cost,
       b.description       AS budget_description,
       s.id_spend,
       s.id_budget,
       s.spendmoney,
       s.type,
       s.description,
       s.created_at,
       s.status,
       s.submitted_by,
       s.decided_by,
       s.decided_at,
       s.spend_date,
       r.title,
       r.description       AS risk_description,
       r.level,
       r.status            AS risk_status,
       r.closed_at
  FROM project p
       LEFT JOIN story_points sp ON sp.id_project = p.id_project
       LEFT JOIN budget       b  ON b.id_project  = p.id_project
       LEFT JOIN spend        s  ON s.id_budget   = b.id_budget
       LEFT JOIN risk         r  ON r.id_project  = p.id_project;
