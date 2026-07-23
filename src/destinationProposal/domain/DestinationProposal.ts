export type DestinationProposalStatus =
  | "pendiente"
  | "aprobada"
  | "rechazada";

export interface DestinationProposalImage {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  order: number;
  createdAt: Date;
}

export interface DestinationProposalLocation {
  id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  municipality: string | null;
  state: string | null;
  mapProvider: string | null;
}

export interface DestinationProposal {
  id: string;

  userId: string | null;

  name: string;

  description: string | null;

  categoryId: string;

  categoryName: string;

  locationId: string;

  location:
    DestinationProposalLocation;

  status:
    DestinationProposalStatus;

  rejectionReason:
    string | null;

  reviewedBy:
    string | null;

  reviewedAt:
    Date | null;

  createdDestinationId:
    string | null;

  createdAt: Date;

  updatedAt: Date;

  images:
    DestinationProposalImage[];
}
