ALTER TABLE auctions
    ADD COLUMN IF NOT EXISTS market_key TEXT;

ALTER TABLE auctions
    ADD COLUMN IF NOT EXISTS pet_type TEXT;

ALTER TABLE auctions
    ADD COLUMN IF NOT EXISTS pet_tier TEXT;

ALTER TABLE auctions
    ADD COLUMN IF NOT EXISTS pet_experience DOUBLE PRECISION;

ALTER TABLE auctions
    ADD COLUMN IF NOT EXISTS pet_held_item TEXT;

ALTER TABLE auctions
    ADD COLUMN IF NOT EXISTS pet_candy_used INTEGER;

UPDATE auctions
SET market_key = item_id
WHERE market_key IS NULL;

ALTER TABLE auctions
    ALTER COLUMN market_key SET NOT NULL;


CREATE INDEX IF NOT EXISTS idx_auctions_market_key
    ON auctions (market_key);

CREATE INDEX IF NOT EXISTS idx_auctions_snapshot_market_key
    ON auctions (
        snapshot_id,
        market_key
    );

CREATE INDEX IF NOT EXISTS idx_auctions_market_bin_price
    ON auctions (
        snapshot_id,
        market_key,
        starting_bid
    )
    WHERE is_bin = TRUE;


ALTER TABLE market_item_stats
    RENAME COLUMN item_id TO market_key;

DROP INDEX IF EXISTS idx_market_item_stats_item;

CREATE INDEX IF NOT EXISTS idx_market_item_stats_market_key
    ON market_item_stats (market_key);


ALTER TABLE market_price_history
    RENAME COLUMN item_id TO market_key;

DROP INDEX IF EXISTS idx_market_price_history_item_time;

CREATE INDEX IF NOT EXISTS idx_market_price_history_key_time
    ON market_price_history (
        market_key,
        observed_at DESC
    );