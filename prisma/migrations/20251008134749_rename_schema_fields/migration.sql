ALTER TABLE node_execution_logs ADD COLUMN status varchar;

UPDATE node_execution_logs SET status = event_type;

ALTER TABLE node_execution_logs ALTER COLUMN status SET NOT NULL; 

ALTER TABLE node_execution_logs DROP COLUMN event_type;
