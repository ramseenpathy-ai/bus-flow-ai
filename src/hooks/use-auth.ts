import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useCallback } from "react";

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

  // Derive isLoading directly from the dependencies instead of managing separate state
  const isLoading = isAuthLoading || user === undefined;

  // Only consider the user explicitly authenticated if they signed in via email
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
