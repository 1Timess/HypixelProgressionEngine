-- Preserve concrete display evidence for Armor empirical-variant contradiction checks.
ALTER TABLE auctions ADD COLUMN raw_lore JSONB;
