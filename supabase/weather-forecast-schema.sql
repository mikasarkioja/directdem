-- supabase/weather-forecast-schema.sql

-- Store the generated predictions for bills
CREATE TABLE IF NOT EXISTS bill_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  predicted_jaa INTEGER NOT NULL,
  predicted_ei INTEGER NOT NULL,
  predicted_abstain INTEGER NOT NULL,
  weather_type TEXT NOT NULL, -- 'sunny', 'stormy', 'cloudy'
  rebel_ids JSONB, -- Array of MP IDs with high rebel probability
  analysis_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bill_id)
);

-- Store user predictions (Prediction Market)
CREATE TABLE IF NOT EXISTS user_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL, -- 'outcome' (pass/fail), 'rebels'
  predicted_value TEXT NOT NULL, -- 'pass', 'fail' or comma-separated MP IDs
  is_correct BOOLEAN,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, bill_id, prediction_type)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_forecast_bill ON bill_forecasts(bill_id);
CREATE INDEX IF NOT EXISTS idx_user_pred_user ON user_predictions(user_id);


