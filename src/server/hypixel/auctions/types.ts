export interface HypixelAuctionBid {
  auction_id: string;
  bidder: string;
  profile_id: string;
  amount: number;
  timestamp: number;
}

export interface HypixelAuction {
  uuid: string;

  auctioneer: string;
  profile_id: string;

  coop?: string[];

  start: number;
  end: number;

  item_name: string;
  item_lore?: string;
  extra?: string;

  category?: string;
  tier?: string;

  starting_bid: number;

  item_bytes: string;

  claimed?: boolean;
  claimed_bidders?: string[];

  highest_bid_amount?: number;

  last_updated?: number;

  bin?: boolean;

  bids?: HypixelAuctionBid[];

  item_uuid?: string;
}

export interface HypixelAuctionsPageResponse {
  success: boolean;
  cause?: string;

  page: number;

  totalPages: number;
  totalAuctions: number;

  lastUpdated: number;

  auctions: HypixelAuction[];
}