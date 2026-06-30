export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  municipality: string | null;
  state: string | null;
  originId: string | null;
  mapProvider: string | null;
  providerPlaceId: string | null;
  createdByUserId: string | null;
  reviewStatusId: string | null;
  createdAt: Date;
}