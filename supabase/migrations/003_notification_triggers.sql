-- ============================================================================
-- Medicare-AI Database Schema Update: Notification Triggers
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- Function to create a notification when a new appointment is booked
CREATE OR REPLACE FUNCTION notify_new_appointment()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_name TEXT;
  v_doctor_name TEXT;
BEGIN
  -- Get names
  SELECT full_name INTO v_patient_name FROM profiles WHERE id = NEW.patient_id;
  SELECT full_name INTO v_doctor_name FROM profiles WHERE id = NEW.doctor_id;

  -- Notify the doctor
  IF NEW.doctor_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.doctor_id,
      'New Appointment Scheduled',
      'You have a new ' || NEW.type || ' appointment scheduled with ' || COALESCE(v_patient_name, 'a patient') || ' on ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH12:MI AM'),
      'info'
    );
  END IF;

  -- Notify the patient
  IF NEW.patient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.patient_id,
      'Appointment Confirmed',
      'Your ' || NEW.type || ' appointment with ' || COALESCE(v_doctor_name, 'a doctor') || ' is scheduled for ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH12:MI AM'),
      'success'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to fire after insert on appointments table
DROP TRIGGER IF EXISTS on_appointment_created ON appointments;
CREATE TRIGGER on_appointment_created
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_appointment();

-- Example trigger for updating a report analysis status
CREATE OR REPLACE FUNCTION notify_report_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status AND NEW.status = 'completed' THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.patient_id,
      'Medical Report Analyzed',
      'Your AI analysis for the recent ' || NEW.report_type || ' report is complete and ready for review.',
      'success'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_report_status_changed ON report_analyses;
CREATE TRIGGER on_report_status_changed
  AFTER UPDATE ON report_analyses
  FOR EACH ROW
  EXECUTE FUNCTION notify_report_status();
