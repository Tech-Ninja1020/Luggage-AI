export type TravelOutfitItem = {
  name: string;
  quantity: number;
};

export type TravelOutfitGroup = {
  occasion: string;
  items: TravelOutfitItem[];
};

export type TravelOutfitPlan = {
  outfits: TravelOutfitGroup[];
};

export type TravelOutfitsRequest = {
  destination: string;
  startDate: string;
  endDate: string;
  occasions: string[];
  travelerProfile?: Record<string, unknown>;
  weatherSummary?: string | null;
};

export type TravelOutfitsResponse = {
  authMode?: string;
  data?: TravelOutfitPlan;
  error?: string;
};
