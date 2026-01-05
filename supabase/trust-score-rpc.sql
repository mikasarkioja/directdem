-- RPC functions for trust score management

CREATE OR REPLACE FUNCTION decrement_trust_score(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET trust_score = GREATEST(0, COALESCE(trust_score, 50) - amount)
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_trust_score(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET trust_score = LEAST(100, COALESCE(trust_score, 50) + amount)
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

