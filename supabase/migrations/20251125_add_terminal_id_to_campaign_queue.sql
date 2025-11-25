-- Agregar columna terminal_id a campaign_queue
ALTER TABLE campaign_queue
ADD COLUMN terminal_id uuid REFERENCES terminals(id);

-- Crear índice para mejorar performance
CREATE INDEX idx_campaign_queue_terminal_id ON campaign_queue(terminal_id);

-- Comentario
COMMENT ON COLUMN campaign_queue.terminal_id IS 'ID del terminal asociado a este mensaje de campaña';
