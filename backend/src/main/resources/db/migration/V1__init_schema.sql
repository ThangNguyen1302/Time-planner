-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            CHAR(36)     PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
CREATE TABLE user_preferences (
  id          CHAR(36)     PRIMARY KEY,
  user_id     CHAR(36)     NOT NULL UNIQUE,
  wake_time   TIME         NOT NULL DEFAULT '07:00:00',
  sleep_time  TIME         NOT NULL DEFAULT '23:00:00',
  work_start  TIME         NOT NULL DEFAULT '08:00:00',
  work_end    TIME         NOT NULL DEFAULT '17:00:00',
  timezone    VARCHAR(64)  NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  rest_days   VARCHAR(32)  NOT NULL DEFAULT '0,6',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prefs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE tasks (
  id           CHAR(36)     PRIMARY KEY,
  user_id      CHAR(36)     NOT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT         NULL,
  duration     INT          NOT NULL DEFAULT 30,
  deadline     TIMESTAMP    NULL,
  priority     INT          NOT NULL DEFAULT 2,
  status       VARCHAR(32)  NOT NULL DEFAULT 'pending',
  color        VARCHAR(16)  NOT NULL DEFAULT '#3B82F6',
  completed_at TIMESTAMP    NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE events (
  id              CHAR(36)     PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT         NULL,
  start_time      TIMESTAMP    NOT NULL,
  end_time        TIMESTAMP    NOT NULL,
  is_recurring    BOOLEAN      NOT NULL DEFAULT FALSE,
  recurrence_rule VARCHAR(255) NULL,
  color           VARCHAR(16)  NOT NULL DEFAULT '#8B5CF6',
  external_id     VARCHAR(255) NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- HABITS
-- ============================================================
CREATE TABLE habits (
  id                   CHAR(36)     PRIMARY KEY,
  user_id              CHAR(36)     NOT NULL,
  title                VARCHAR(255) NOT NULL,
  description          TEXT         NULL,
  duration             INT          NOT NULL DEFAULT 30,
  frequency            INT          NOT NULL DEFAULT 1,
  preferred_time_start TIME         NULL,
  preferred_time_end   TIME         NULL,
  color                VARCHAR(16)  NOT NULL DEFAULT '#10B981',
  is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_habits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE habit_completions (
  id           CHAR(36)  PRIMARY KEY,
  habit_id     CHAR(36)  NOT NULL,
  user_id      CHAR(36)  NOT NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes        TEXT      NULL,
  CONSTRAINT fk_hc_habit FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  CONSTRAINT fk_hc_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TIME BLOCKS
-- ============================================================
CREATE TABLE time_blocks (
  id                 CHAR(36)     PRIMARY KEY,
  user_id            CHAR(36)     NOT NULL,
  title              VARCHAR(255) NOT NULL,
  start_time         TIMESTAMP    NOT NULL,
  end_time           TIMESTAMP    NOT NULL,
  block_type         VARCHAR(16)  NOT NULL,
  source_id          CHAR(36)     NULL,
  status             VARCHAR(32)  NOT NULL DEFAULT 'scheduled',
  color              VARCHAR(16)  NOT NULL DEFAULT '#6366F1',
  is_manual_override BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tb_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
