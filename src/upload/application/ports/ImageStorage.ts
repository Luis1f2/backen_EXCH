export interface StoredImage {
  url: string;
  publicId: string;
}

export interface ImageStorage {
  upload(
    buffer: Buffer,
    folder: string
  ): Promise<StoredImage>;

  delete(
    publicId: string
  ): Promise<void>;
}