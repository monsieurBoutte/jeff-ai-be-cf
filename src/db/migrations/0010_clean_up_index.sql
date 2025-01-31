-- First drop the existing index if it exists
DROP INDEX IF EXISTS feedback_vector_index;

-- Then create it fresh
CREATE INDEX feedback_vector_index ON feedback(vector);