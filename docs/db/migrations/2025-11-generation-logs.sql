-- Generation Logs Table
-- Stores detailed logs of NPC generation process for debugging and analysis

CREATE TABLE IF NOT EXISTS generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_request_id UUID REFERENCES generation_request(id) ON DELETE CASCADE,
  world_id UUID REFERENCES world(id) ON DELETE CASCADE,
  step TEXT NOT NULL, -- 'procedural', 'context_fetch', 'ai_enhance', 'critique', 'style_fix', 'grammar_fix', 'final'
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  log_type TEXT NOT NULL, -- 'info', 'warning', 'error', 'debug'
  message TEXT NOT NULL,
  data JSONB, -- Additional structured data (context snippets, AI responses, etc.)
  duration_ms INTEGER, -- Time taken for this step in milliseconds
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_generation_log_request_id ON generation_log(generation_request_id);
CREATE INDEX IF NOT EXISTS idx_generation_log_world_id ON generation_log(world_id);
CREATE INDEX IF NOT EXISTS idx_generation_log_timestamp ON generation_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_generation_log_step ON generation_log(step);

-- View for easy log retrieval
CREATE OR REPLACE VIEW generation_log_summary AS
SELECT 
  gl.id,
  gl.generation_request_id,
  gl.world_id,
  gl.step,
  gl.timestamp,
  gl.log_type,
  gl.message,
  gl.duration_ms,
  gr.kind as generation_kind,
  gr.prompt as generation_prompt
FROM generation_log gl
LEFT JOIN generation_request gr ON gl.generation_request_id = gr.id
ORDER BY gl.timestamp DESC;

COMMENT ON TABLE generation_log IS 'Detailed logs of generation process for debugging and analysis';
COMMENT ON COLUMN generation_log.step IS 'Generation step: procedural, context_fetch, ai_enhance, critique, style_fix, grammar_fix, final';
COMMENT ON COLUMN generation_log.log_type IS 'Log level: info, warning, error, debug';
COMMENT ON COLUMN generation_log.data IS 'Additional structured data (context snippets, AI responses, etc.)';

