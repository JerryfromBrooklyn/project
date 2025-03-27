-- Fix function parameter order mismatch
-- This script adds function overloads to handle different parameter orders

-- Create a wrapper function that accepts parameters in the order the frontend expects
CREATE OR REPLACE FUNCTION public.update_photo_basic_details(
  p_date_taken DATE,
  p_event_details JSONB,
  p_id UUID,
  p_title TEXT,
  p_venue JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the original function with the correct parameter order
  RETURN public.update_photo_basic_details(
    p_id := p_id,
    p_title := p_title,
    p_date_taken := p_date_taken,
    p_event_details := p_event_details,
    p_venue := p_venue,
    p_location := NULL::JSONB,  -- Default value for missing parameter
    p_event_id := NULL::UUID    -- Default value for missing parameter
  );
END;
$$;

-- Create another wrapper function that accepts parameters in the exact order shown in the error message
CREATE OR REPLACE FUNCTION public.update_photo_basic_details(
  p_date_taken DATE,
  p_event_details JSONB,
  p_event_id UUID,
  p_id UUID,
  p_location JSONB,
  p_title TEXT,
  p_venue JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the original function with named parameters to ensure correct mapping
  RETURN public.update_photo_basic_details(
    p_id := p_id,
    p_title := p_title,
    p_date_taken := p_date_taken,
    p_event_details := p_event_details,
    p_venue := p_venue,
    p_location := p_location,
    p_event_id := p_event_id
  );
END;
$$;

-- Grant appropriate permissions to allow function execution
GRANT EXECUTE ON FUNCTION public.update_photo_basic_details(DATE, JSONB, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_photo_basic_details(DATE, JSONB, UUID, UUID, JSONB, TEXT, JSONB) TO authenticated; 