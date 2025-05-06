-- ///////////////////////// 
-- This migration is writtern by developer to enable full text search
--    because prisma does not support full text search yet in postgres.
-- This migration should be the last migration to be run.
-- ////////////////////////


-- function for updating search_vector
CREATE
OR REPLACE FUNCTION document_chunks_search_vector_update
() RETURNS trigger AS $$ 
BEGIN NEW.search_vector := to_tsvector
('english', NEW.content);

RETURN NEW;

END;

$$ LANGUAGE plpgsql;

-- trigger to run the function on insert or update for each row
CREATE TRIGGER document_chunks_search_vector_trigger BEFORE
INSERT
  OR
UPDATE
  OF content ON document_chunks FOR EACH ROW
EXECUTE FUNCTION document_chunks_search_vector_update
();

-- Insert default folder
INSERT INTO "document_folders"
  ("id", "name", "isRoot", "created_at", "updated_at")
VALUES
  ('cmachor880000f17ocy9jh46i', 'Default', 'true', '2025-05-07 00:20:45', '2025-05-07 00:20:46');
