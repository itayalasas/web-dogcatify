/*
  # Sistema CRM de Chatbot Dotty
  
  1. Nuevas Tablas
    - `chatbot_conversations`
      - `id` (uuid, primary key) - ID único de la conversación
      - `visitor_name` (text) - Nombre del visitante
      - `visitor_email` (text) - Email del visitante
      - `status` (text) - Estado de la conversación
      - `assigned_agent_id` (uuid) - Agente asignado
      - `started_at` (timestamptz) - Inicio de conversación
      - `ended_at` (timestamptz) - Fin de conversación
      - `last_message_at` (timestamptz) - Última actividad
      - `rating` (integer) - Calificación del servicio
      - `metadata` (jsonb) - Datos adicionales
      
    - `chatbot_messages`
      - `id` (uuid, primary key) - ID del mensaje
      - `conversation_id` (uuid) - Conversación relacionada
      - `sender_type` (text) - visitor/bot/agent
      - `sender_id` (uuid) - ID del agente si aplica
      - `message` (text) - Contenido
      - `created_at` (timestamptz) - Fecha de envío
      - `read_at` (timestamptz) - Fecha de lectura
      - `metadata` (jsonb) - Datos adicionales
  
  2. Seguridad
    - RLS habilitado
    - Políticas públicas para visitantes
    - Políticas para agentes autenticados
*/

-- Tabla de conversaciones del chatbot
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text,
  visitor_email text,
  status text NOT NULL DEFAULT 'bot' CHECK (status IN ('bot', 'waiting_agent', 'with_agent', 'resolved', 'abandoned')),
  assigned_agent_id uuid,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  last_message_at timestamptz DEFAULT now(),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Tabla de mensajes del chatbot
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('visitor', 'bot', 'agent')),
  sender_id uuid,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_status ON chatbot_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_agent ON chatbot_conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_last_message ON chatbot_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created ON chatbot_messages(created_at DESC);

-- RLS
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para conversaciones
CREATE POLICY "Anyone can create chatbot conversations"
  ON chatbot_conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read chatbot conversations"
  ON chatbot_conversations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update chatbot conversations"
  ON chatbot_conversations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para mensajes
CREATE POLICY "Anyone can insert chatbot messages"
  ON chatbot_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read chatbot messages"
  ON chatbot_messages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update chatbot messages"
  ON chatbot_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Función para actualizar última actividad
CREATE OR REPLACE FUNCTION update_chatbot_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chatbot_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_chatbot_conversation_last_message ON chatbot_messages;
CREATE TRIGGER trigger_update_chatbot_conversation_last_message
  AFTER INSERT ON chatbot_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_conversation_last_message();
