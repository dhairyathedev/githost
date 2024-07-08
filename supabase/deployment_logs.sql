-- Create the deployment_logs table
CREATE TABLE deployment_logs (
    id TEXT PRIMARY KEY,
    logs JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on the id column for faster lookups
CREATE INDEX idx_deployment_logs_id ON deployment_logs(id);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before each update
CREATE TRIGGER update_deployment_logs_modtime
BEFORE UPDATE ON deployment_logs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add a comment to the table for documentation
COMMENT ON TABLE deployment_logs IS 'Stores logs for each deployment process';

-- Add comments to the columns for documentation
COMMENT ON COLUMN deployment_logs.id IS 'Unique identifier for the deployment, matches the id in upload_statuses';
COMMENT ON COLUMN deployment_logs.logs IS 'JSON array of log entries, each containing a timestamp and a message';
COMMENT ON COLUMN deployment_logs.created_at IS 'Timestamp when the log entry was first created';
COMMENT ON COLUMN deployment_logs.updated_at IS 'Timestamp when the log entry was last updated';