const ROLE_CHECK_TIMEOUT_MS = 8000;

export const checkHasRole = async (
  userId: string,
  role: "admin" | "moderator" | "user",
  accessToken?: string | null
): Promise<boolean> => {
  if (!accessToken) return false;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), ROLE_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/has_role`, {
      method: "POST",
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ _user_id: userId, _role: role }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Role check failed with ${response.status}`);
    return Boolean(await response.json());
  } finally {
    window.clearTimeout(timeout);
  }
};