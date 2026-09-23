ALTER TABLE admin_trusted_device_requests ADD COLUMN collaborator_email TEXT NOT NULL DEFAULT '';
ALTER TABLE admin_trusted_device_requests ADD COLUMN request_country TEXT;
