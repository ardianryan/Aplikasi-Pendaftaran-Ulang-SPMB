/**
 * ScholarGate SSO Service
 * Fetches guru/tendik data from ScholarGate API
 * Used by admin to pull operator accounts
 */

// ============================================
// Types
// ============================================

export interface SSOmember {
  id: string;
  nama: string;
  role: string;
  jenis_kelamin: string;
  nik: string;
  nip: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  google_email: string;
  google_name: string;
  google_avatar: string;
  email_pribadi: string;
  no_telepon: string;
  is_claimed: boolean;
  claimed_at: string | null;
}

export interface SSOListResponse {
  success: boolean;
  data: SSOmember[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface SSOLookupResponse {
  success: boolean;
  found: boolean;
  data: SSOmember | null;
}

// ============================================
// Config
// ============================================

function getBaseUrl(): string {
  const url = process.env.SSO_BASE_URL;
  if (!url) throw new Error("SSO_BASE_URL environment variable is not set");
  return url.replace(/\/$/, ""); // Remove trailing slash
}

function getApiKey(): string {
  const key = process.env.SSO_API_KEY;
  if (!key) throw new Error("SSO_API_KEY environment variable is not set");
  return key;
}

// ============================================
// API Functions
// ============================================

/**
 * Fetch members from ScholarGate (guru & tendik)
 * @param role - Filter by role: "guru", "tendik", or empty for all
 * @param page - Page number (default 1)
 * @param perPage - Items per page (default 100)
 */
export async function fetchSSOMembers(
  role: string = "",
  page: number = 1,
  perPage: number = 100
): Promise<SSOListResponse> {
  const baseUrl = getBaseUrl();
  const apiKey = getApiKey();

  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (role) params.set("role", role);

  const response = await fetch(`${baseUrl}/api/v1/members?${params.toString()}`, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      "Referer": process.env.APP_URL || "https://spmb-wa.local",
      "User-Agent": "SPMB-WA-Client/1.0",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ScholarGate API error (${response.status}): ${text}`);
  }

  return response.json() as Promise<SSOListResponse>;
}

/**
 * Fetch ALL members across all pages (auto-paginate)
 * @param role - Filter by role
 */
export async function fetchAllSSOMembers(role: string = ""): Promise<SSOmember[]> {
  const allMembers: SSOmember[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await fetchSSOMembers(role, page, 100);
    allMembers.push(...res.data);
    totalPages = res.meta.total_pages;
    page++;
  } while (page <= totalPages);

  return allMembers;
}

/**
 * Lookup a single member by identifier (email, NIP, etc.)
 * First tries the /lookup endpoint, then falls back to searching /members list
 * @param identifier - The value to search for (email)
 */
export async function lookupSSOMember(identifier: string): Promise<SSOLookupResponse> {
  const baseUrl = getBaseUrl();
  const apiKey = getApiKey();

  // Try lookup endpoint first
  try {
    const params = new URLSearchParams({ identifier });

    const response = await fetch(`${baseUrl}/api/v1/members/lookup?${params.toString()}`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        "Referer": process.env.APP_URL || "https://spmb-wa.local",
        "User-Agent": "SPMB-WA-Client/1.0",
      },
    });

    if (response.status === 404) {
      // Not found via lookup — try fallback search below
    } else if (response.ok) {
      const result = await response.json() as any;
      if (result.found && result.data) {
        return { success: true, found: true, data: result.data };
      }
    }
  } catch (lookupErr) {
    console.warn("[SSO] Lookup endpoint failed, trying members list:", lookupErr);
  }

  // Fallback: search in members list by google_email
  try {
    const allMembers = await fetchAllSSOMembers("");
    const member = allMembers.find(
      (m) => m.google_email?.toLowerCase() === identifier.toLowerCase()
    );

    if (member) {
      return { success: true, found: true, data: member };
    }
  } catch (listErr) {
    console.error("[SSO] Members list fetch also failed:", listErr);
    throw new Error("Layanan SSO tidak dapat dihubungi.");
  }

  return { success: true, found: false, data: null };
}

/**
 * Verify Google token and get user info
 * Uses Google's tokeninfo endpoint to validate the ID token
 */
export async function verifyGoogleToken(idToken: string): Promise<{
  email: string;
  name: string;
  picture: string;
  sub: string;
} | null> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!response.ok) return null;

    const data: any = await response.json();

    // Verify the token is for our app
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && data.aud !== clientId) {
      return null;
    }

    return {
      email: data.email,
      name: data.name || data.email,
      picture: data.picture || "",
      sub: data.sub,
    };
  } catch {
    return null;
  }
}
