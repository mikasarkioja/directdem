-- RPC to increment expertise points
CREATE OR REPLACE FUNCTION increment_expertise_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET expertise_points = COALESCE(expertise_points, 0) + amount
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

