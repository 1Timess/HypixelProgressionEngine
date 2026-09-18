CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auction_snapshots (
    id BIGSERIAL PRIMARY KEY,

    hypixel_last_updated BIGINT NOT NULL,

    total_pages INTEGER NOT NULL CHECK (total_pages >= 0),
    total_auctions INTEGER NOT NULL CHECK (total_auctions >= 0),

    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    status TEXT NOT NULL
        CHECK (status IN ('INGESTING', 'COMPLETE', 'FAILED')),

    failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_auction_snapshots_last_updated
    ON auction_snapshots (hypixel_last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_auction_snapshots_status
    ON auction_snapshots (status);

CREATE INDEX IF NOT EXISTS idx_auction_snapshots_completed_at
    ON auction_snapshots (completed_at DESC);


CREATE TABLE IF NOT EXISTS auctions (
    snapshot_id BIGINT NOT NULL
        REFERENCES auction_snapshots(id)
        ON DELETE CASCADE,

    auction_uuid TEXT NOT NULL,

    auctioneer_uuid TEXT NOT NULL,
    profile_id TEXT NOT NULL,

    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,

    tier TEXT,
    category TEXT,

    starting_bid BIGINT NOT NULL CHECK (starting_bid >= 0),
    highest_bid BIGINT NOT NULL DEFAULT 0 CHECK (highest_bid >= 0),

    is_bin BOOLEAN NOT NULL,

    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,

    stars INTEGER CHECK (
        stars IS NULL OR stars >= 0
    ),

    recombobulated BOOLEAN,

    reforge TEXT,

    enchantments JSONB NOT NULL DEFAULT '{}'::jsonb,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    extra_attributes JSONB NOT NULL DEFAULT '{}'::jsonb,

    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (snapshot_id, auction_uuid)
);

CREATE INDEX IF NOT EXISTS idx_auctions_snapshot
    ON auctions (snapshot_id);

CREATE INDEX IF NOT EXISTS idx_auctions_item
    ON auctions (item_id);

CREATE INDEX IF NOT EXISTS idx_auctions_snapshot_item
    ON auctions (snapshot_id, item_id);

CREATE INDEX IF NOT EXISTS idx_auctions_item_bin_price
    ON auctions (
        snapshot_id,
        item_id,
        starting_bid
    )
    WHERE is_bin = TRUE;

CREATE INDEX IF NOT EXISTS idx_auctions_end_time
    ON auctions (end_time);


CREATE TABLE IF NOT EXISTS market_item_stats (
    snapshot_id BIGINT NOT NULL
        REFERENCES auction_snapshots(id)
        ON DELETE CASCADE,

    item_id TEXT NOT NULL,

    lowest_bin BIGINT CHECK (
        lowest_bin IS NULL OR lowest_bin >= 0
    ),

    second_lowest_bin BIGINT CHECK (
        second_lowest_bin IS NULL OR second_lowest_bin >= 0
    ),

    fifth_lowest_bin BIGINT CHECK (
        fifth_lowest_bin IS NULL OR fifth_lowest_bin >= 0
    ),

    median_lowest_five BIGINT CHECK (
        median_lowest_five IS NULL OR median_lowest_five >= 0
    ),

    median_bin BIGINT CHECK (
        median_bin IS NULL OR median_bin >= 0
    ),

    bin_listing_count INTEGER NOT NULL DEFAULT 0
        CHECK (bin_listing_count >= 0),

    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (snapshot_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_market_item_stats_item
    ON market_item_stats (item_id);


CREATE TABLE IF NOT EXISTS market_price_history (
    id BIGSERIAL PRIMARY KEY,

    item_id TEXT NOT NULL,

    hypixel_last_updated BIGINT NOT NULL,

    observed_at TIMESTAMPTZ NOT NULL,

    lowest_bin BIGINT CHECK (
        lowest_bin IS NULL OR lowest_bin >= 0
    ),

    median_lowest_five BIGINT CHECK (
        median_lowest_five IS NULL OR median_lowest_five >= 0
    ),

    median_bin BIGINT CHECK (
        median_bin IS NULL OR median_bin >= 0
    ),

    bin_listing_count INTEGER NOT NULL DEFAULT 0
        CHECK (bin_listing_count >= 0),

    UNIQUE (item_id, hypixel_last_updated)
);

CREATE INDEX IF NOT EXISTS idx_market_price_history_item_time
    ON market_price_history (
        item_id,
        observed_at DESC
    );