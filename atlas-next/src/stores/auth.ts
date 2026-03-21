import { create } from 'zustand';
import type { PermissionIndex } from '@/types';
import { getConfig } from '@/config';

export interface AuthStore {
  token: string | null;
  subject: string | null;
  fullName: string | null;
  permissions: PermissionIndex | null;
  authProvider: string | null;
  authClient: string | null;
  tokenExpired: boolean;
  signInOpened: boolean;

  setAuthParams: (token: string, permissions?: string) => void;
  resetAuthParams: () => void;
  isAuthenticated: () => boolean;
  isPermitted: (permission: string) => boolean;
}

/**
 * Decode a base64url-encoded string to a regular string.
 * Handles the URL-safe alphabet (+/- replaced with -/_) and missing padding.
 */
function base64urlDecode(input: string): string {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  switch (s.length % 4) {
    case 0:
      break;
    case 2:
      s += '==';
      break;
    case 3:
      s += '=';
      break;
    default:
      throw new Error('Illegal base64url string!');
  }
  return atob(s);
}

/**
 * Parse a JWT token and return the payload as a typed object.
 */
export function parseJwtPayload(jwt: string): { sub?: string; name?: string; exp?: number; [key: string]: unknown } {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error('JSON Web Token must have three parts');
  }
  const payload = base64urlDecode(parts[1]!);
  return JSON.parse(payload) as { sub?: string; name?: string; exp?: number };
}

/**
 * Parse a permission index string (JSON) into a PermissionIndex.
 * If the input is already an object, return it directly.
 */
export function parsePermissions(permissions: string | PermissionIndex): PermissionIndex {
  if (typeof permissions === 'string') {
    return JSON.parse(permissions) as PermissionIndex;
  }
  return permissions;
}

/**
 * Apache Shiro wildcard permission matching.
 *
 * Adapted from:
 * https://github.com/apache/shiro/blob/fa518ec/core/src/main/java/org/apache/shiro/authz/permission/WildcardPermission.java#L201
 *
 * - Permissions are colon-separated parts (e.g., "cohortdefinition:put:123")
 * - `*` matches all values at that level
 * - Comma-separated values are OR conditions within a level
 * - If the etalon (granted permission) has fewer parts than the requested permission,
 *   everything beyond is automatically implied (granted).
 * - If the etalon has more parts than the requested permission, those extra parts
 *   must all be wildcards for the permission to be granted.
 */
export function checkPermission(permission: string, etalon: string): boolean {
  if (!etalon || !permission) {
    return false;
  }

  if (permission === etalon) {
    return true;
  }

  const etalonLevels = etalon.split(':');
  const permissionLevels = permission.split(':');

  let i = 0;
  for (const permissionLevel of permissionLevels) {
    if (etalonLevels.length - 1 < i) {
      // Etalon has fewer parts — everything after is implied
      return true;
    }
    const etalonPart = etalonLevels[i]!.split(',');
    const permissionPart = permissionLevel.split(',');
    if (!etalonPart.includes('*') && !permissionPart.every((pp) => etalonPart.includes(pp))) {
      return false;
    }
    i++;
  }

  // If etalon has more parts, remaining must all contain wildcard
  for (; i < etalonLevels.length; i++) {
    const etalonPart = etalonLevels[i]!.split(',');
    if (!etalonPart.includes('*')) {
      return false;
    }
  }

  return true;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  subject: null,
  fullName: null,
  permissions: null,
  authProvider: null,
  authClient: null,
  tokenExpired: false,
  signInOpened: false,

  setAuthParams: (tokenHeader: string, permissionsStr?: string) => {
    const updates: Partial<AuthStore> = {};

    if (tokenHeader) {
      updates.token = tokenHeader;
      try {
        const payload = parseJwtPayload(tokenHeader);
        if (payload.sub) {
          updates.subject = payload.sub;
        }
        if (payload.name) {
          updates.fullName = payload.name;
        }
      } catch {
        // If JWT parsing fails, just set the token without extracting claims
      }
    }

    if (permissionsStr) {
      updates.permissions = parsePermissions(permissionsStr);
    }

    set(updates);
  },

  resetAuthParams: () => {
    set({
      token: null,
      subject: null,
      fullName: null,
      permissions: null,
      authProvider: null,
      authClient: null,
      tokenExpired: false,
      signInOpened: false,
    });
  },

  isAuthenticated: () => {
    const config = getConfig();
    if (!config.userAuthenticationEnabled) {
      return true;
    }
    return !!get().subject;
  },

  isPermitted: (permission: string) => {
    const config = getConfig();
    if (!config.userAuthenticationEnabled) {
      return true;
    }

    const perms = get().permissions;
    if (!perms) return false;

    const firstPerm = permission.split(':')[0]!;
    const etalons = [...(perms['*'] ?? []), ...(perms[firstPerm] ?? [])];

    for (const etalon of etalons) {
      if (checkPermission(permission, etalon)) {
        return true;
      }
    }

    return false;
  },
}));
