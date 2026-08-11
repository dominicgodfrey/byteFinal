import { BASE_URL } from "../config";

export type UploadedPhoto = { url: string; publicId: string };

/** Via the backend, so no API secret ships. */
export async function uploadPhoto(photoUri: string, token: string): Promise<UploadedPhoto> {
  const formData = new FormData();

  // React Native accepts this; TypeScript cannot model it.
  formData.append("file", {
    uri: photoUri,
    name: "cook.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const res = await fetch(`${BASE_URL}/api/uploads`, {
    method: "POST",
    // No Content-Type, so fetch sets the multipart boundary.
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Upload failed (${res.status})`);
  }

  return res.json();
}
