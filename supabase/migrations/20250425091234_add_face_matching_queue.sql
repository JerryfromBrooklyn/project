-- Migration to add background face matching queue

-- Create a table for background tasks if it doesn't exist
CREATE TABLE IF NOT EXISTS background_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_background_tasks_status ON background_tasks(status);
CREATE INDEX IF NOT EXISTS idx_background_tasks_user_id ON background_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_background_tasks_scheduled ON background_tasks(scheduled_for) 
  WHERE status = 'pending';

-- Function to queue a face matching task
CREATE OR REPLACE FUNCTION queue_face_matching_task(
  p_user_id UUID,
  p_face_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_task_id UUID;
BEGIN
  -- Check if a similar task already exists
  SELECT id INTO v_task_id
  FROM background_tasks
  WHERE user_id = p_user_id 
    AND task_type = 'face_matching'
    AND status IN ('pending', 'processing')
    AND data->>'face_id' = p_face_id;
    
  -- If task already exists, just return it
  IF v_task_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Task already queued',
      'task_id', v_task_id
    );
  END IF;
  
  -- Insert new task
  INSERT INTO background_tasks (
    task_type,
    user_id,
    data,
    status,
    scheduled_for
  ) VALUES (
    'face_matching',
    p_user_id,
    jsonb_build_object(
      'face_id', p_face_id,
      'created_at', now()
    ),
    'pending',
    now() -- Schedule for immediate processing
  )
  RETURNING id INTO v_task_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Task queued successfully',
    'task_id', v_task_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process the next batch of face matching tasks
-- This would be called by a server-side function or cron job
CREATE OR REPLACE FUNCTION process_face_matching_queue(
  p_batch_size INT DEFAULT 10
) RETURNS JSONB AS $$
DECLARE
  v_task RECORD;
  v_processed INT := 0;
  v_errors INT := 0;
  v_result JSONB;
BEGIN
  -- Loop through pending tasks
  FOR v_task IN 
    SELECT id, user_id, data
    FROM background_tasks
    WHERE task_type = 'face_matching'
      AND status = 'pending'
      AND scheduled_for <= now()
    ORDER BY scheduled_for
    LIMIT p_batch_size
  LOOP
    BEGIN
      -- Mark as processing
      UPDATE background_tasks
      SET status = 'processing',
          attempts = attempts + 1,
          updated_at = now()
      WHERE id = v_task.id;
      
      -- Call face matching functions - in a real server environment,
      -- this would trigger server-side code to perform the actual matching
      -- Here we're just marking it for demonstration
      
      -- Mark as completed
      UPDATE background_tasks
      SET status = 'completed',
          completed_at = now(),
          updated_at = now()
      WHERE id = v_task.id;
      
      v_processed := v_processed + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Handle errors
      UPDATE background_tasks
      SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END,
          error = SQLERRM,
          scheduled_for = now() + interval '5 minutes', -- Retry after 5 minutes
          updated_at = now()
      WHERE id = v_task.id;
      
      v_errors := v_errors + 1;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'processed', v_processed,
    'errors', v_errors,
    'completed', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 