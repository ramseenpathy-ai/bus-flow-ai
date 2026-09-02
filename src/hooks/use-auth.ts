import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useCallback } from "react";

/**
 * The Freebuff platform injects a federated JWT that makes useConvexAuth()
 * return isAuthenticated=true immediately. We track whether the user has
 * explicitly chosen a sign-in method (email or guest) to prevent the
 * platform's auto-auth from gating access to the dashboard.
 */
const AUTHORIZED_KEY = "busflow_explicit_auth";

function hasExplicitAuth(): boolean {
  try {
    return sessionStorage.getItem(AUTHORIZED_KEY) === "true";
  } catch {
    return false;
  }
}

function setExplicitAuth(value: boolean): void {
  try {
    if (value) {
      sessionStorage.setItem(AUTHORIZED_KEY, "true");
    } else {
      sessionStorage.removeItem(AUTHORIZED_KEY);
    }
  } catch {
    // ignore
  }
}

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn: rawSignIn, signOut: rawSignOut } = useAuthActions();

  const isLoading = isAuthLoading || user === undefined;

  /**
   * Only treat the user as authenticated when they have explicitly chosen
   * a sign-in method. Platform auto-auth (federated JWT) is intentionally
   * ignored here so that the auth page can present its two choices first.
   */
  const isExplicitlyAuthenticated = isAuthenticated && hasExplicitAuth();

  const signIn = useCallback(
    async (provider: string, formData?: FormData) => {
      await rawSignIn(provider, formData);
      setExplicitAuth(true);
    },
    [rawSignIn],
  );

  const signOut = useCallback(async () => {
    setExplicitAuth(false);
    await rawSignOut();
  }, [rawSignOut]);

  return {
    isLoading,
    isAuthenticated: isExplicitlyAuthenticated,
    user,
    signIn,
    signOut,
  };
}
