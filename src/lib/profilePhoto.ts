import { supabase } from "@/integrations/supabase/client";

const PROFILE_PHOTOS_BUCKET = "profile-photos";
const SIGNED_URL_SECONDS = 60 * 60 * 24 * 7;

export const getProfilePhotoPath = (userId: string, file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `${userId}/profile-photo.${extension}`;
};

export const extractProfilePhotoPath = (value?: string | null) => {
  if (!value) return null;
  if (!value.startsWith("http")) return value.replace(/^profile-photos\//, "");

  try {
    const pathname = new URL(value).pathname;
    const marker = `/${PROFILE_PHOTOS_BUCKET}/`;
    const markerIndex = pathname.indexOf(marker);
    return markerIndex >= 0 ? decodeURIComponent(pathname.slice(markerIndex + marker.length)) : null;
  } catch {
    return null;
  }
};

export const createProfilePhotoUrl = async (storedValue?: string | null) => {
  const path = extractProfilePhotoPath(storedValue);
  if (!path) return storedValue || null;

  const { data, error } = await supabase.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);

  if (error || !data?.signedUrl) return storedValue?.startsWith("http") ? storedValue : null;
  return `${data.signedUrl}${data.signedUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
};

export const uploadProfilePhoto = async (userId: string, file: File) => {
  const path = getProfilePhotoPath(userId, file);
  const { error: uploadError } = await supabase.storage.from(PROFILE_PHOTOS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  });

  if (uploadError) return { path, signedUrl: null, error: uploadError };
  const signedUrl = await createProfilePhotoUrl(path);
  return { path, signedUrl, error: null };
};