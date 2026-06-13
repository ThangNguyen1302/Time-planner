-- ============================================================
-- PERSONAS & AVATARS
-- ============================================================
CREATE TABLE personas (
  id          CHAR(36)     PRIMARY KEY,
  user_id     CHAR(36)     NOT NULL,
  name        VARCHAR(100) NOT NULL,
  tone        VARCHAR(32)  NOT NULL DEFAULT 'friendly',
  addressing  VARCHAR(16)  NOT NULL DEFAULT 'ban',
  emoji_level INT          NOT NULL DEFAULT 2,
  verbosity   VARCHAR(16)  NOT NULL DEFAULT 'normal',
  strictness  INT          NOT NULL DEFAULT 3,
  style_rules JSON         NULL,
  is_preset   BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_personas_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE avatars (
  id         CHAR(36)     PRIMARY KEY,
  user_id    CHAR(36)     NOT NULL,
  name       VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  mood       VARCHAR(32)  NOT NULL DEFAULT 'neutral',
  is_preset  BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active  BOOLEAN      NOT NULL DEFAULT FALSE,
  config     JSON         NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_avatars_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================
CREATE TABLE conversations (
  id         CHAR(36)     PRIMARY KEY,
  user_id    CHAR(36)     NOT NULL,
  title      VARCHAR(255) NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_conv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
  id              CHAR(36)     PRIMARY KEY,
  conversation_id CHAR(36)     NOT NULL,
  user_id         CHAR(36)     NOT NULL,
  role            VARCHAR(16)  NOT NULL,
  content         TEXT         NOT NULL,
  mood            VARCHAR(32)  NULL,
  actions         JSON         NULL,
  quick_replies   JSON         NULL,
  is_proactive    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- ASSISTANT ACTION LOGS
-- ============================================================
CREATE TABLE assistant_action_logs (
  id          CHAR(36)     PRIMARY KEY,
  user_id     CHAR(36)     NOT NULL,
  message_id  CHAR(36)     NULL,
  action_type VARCHAR(64)  NOT NULL,
  action_data JSON         NOT NULL,
  result      JSON         NULL,
  can_undo    BOOLEAN      NOT NULL DEFAULT FALSE,
  undone_at   DATETIME     NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- USER MEMORY & REMINDER RULES
-- ============================================================
CREATE TABLE user_memory (
  id          CHAR(36)     PRIMARY KEY,
  user_id     CHAR(36)     NOT NULL,
  memory_type VARCHAR(32)  NOT NULL,
  `key`       VARCHAR(255) NOT NULL,
  value       JSON         NOT NULL,
  confidence  DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  source      VARCHAR(16)  NOT NULL DEFAULT 'inferred',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_um_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE reminder_rules (
  id              CHAR(36)     PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  rule_type       VARCHAR(32)  NOT NULL,
  trigger_minutes INT          NOT NULL DEFAULT 15,
  max_reminders   INT          NOT NULL DEFAULT 3,
  nudge_style     VARCHAR(16)  NOT NULL DEFAULT 'gentle',
  is_enabled      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- GOOGLE CALENDAR TOKENS
-- ============================================================
CREATE TABLE google_calendar_tokens (
  id            CHAR(36)     PRIMARY KEY,
  user_id       CHAR(36)     NOT NULL UNIQUE,
  access_token  TEXT         NOT NULL,
  refresh_token TEXT         NOT NULL,
  expires_at    DATETIME     NOT NULL,
  scope         VARCHAR(500) NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_gct_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);