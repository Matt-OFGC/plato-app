-- Fix MemberRole enum migration
-- This handles the case where the enum might need to be updated
-- First, check if we need to migrate existing data

-- If the enum already has the correct values, this migration does nothing
-- If there are old values (OWNER, EDITOR, VIEWER) that need to be migrated to new values (ADMIN, MANAGER, EMPLOYEE)
-- we handle that here

-- Note: This migration is safe to run multiple times
DO $$
BEGIN
  -- Check if enum values need updating
  -- If OWNER exists, map to ADMIN
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'OWNER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MemberRole')) THEN
    UPDATE "Membership" SET role = 'ADMIN'::text::"MemberRole" WHERE role::text = 'OWNER';
    UPDATE "Staff" SET role = 'ADMIN'::text::"MemberRole" WHERE role::text = 'OWNER';
  END IF;
  
  -- If EDITOR exists, map to MANAGER
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EDITOR' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MemberRole')) THEN
    UPDATE "Membership" SET role = 'MANAGER'::text::"MemberRole" WHERE role::text = 'EDITOR';
    UPDATE "Staff" SET role = 'MANAGER'::text::"MemberRole" WHERE role::text = 'EDITOR';
  END IF;
  
  -- If VIEWER exists, map to EMPLOYEE
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'VIEWER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MemberRole')) THEN
    UPDATE "Membership" SET role = 'EMPLOYEE'::text::"MemberRole" WHERE role::text = 'VIEWER';
    UPDATE "Staff" SET role = 'EMPLOYEE'::text::"MemberRole" WHERE role::text = 'VIEWER';
  END IF;
END $$;
