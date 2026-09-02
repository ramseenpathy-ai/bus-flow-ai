import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo.svg";
import { ArrowRight, ArrowLeft, Loader2, Mail, UserX } from "lucide-react";
import { Suspense, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

/**
 * Auth page presents two explicit choices:
 *   1. Sign in with Email (OTP)
 *   2. Continue as Guest
 *
 * The page NEVER auto-redirects. The user must explicitly choose.
 * Platform auto-authentication (federated JWT) is blocked by the
 * explicit-auth gate in useAuth().
 */
function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );

  // "choose" | "email" | "otp" — controls which view is shown
  const [view, setView] = useState<"choose" | "email" | "otp">("choose");
  const [emailAddress, setEmailAddress] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Email OTP flow ────────────────────────────────────────────────

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setEmailAddress(formData.get("email") as string);
      setView("otp");
      setIsLoading(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch {
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  // ── Guest flow ────────────────────────────────────────────────────

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to continue as guest. Please try again.",
      );
      setIsLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      {/* Back to Home */}
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Button>
      </div>

      {/* Auth Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center h-full flex-col">
          <Card className="min-w-[350px] max-w-[400px] border shadow-md">
            {/* ── Header (always visible) ─────────────────────── */}
            <CardHeader className="text-center">
              <div className="flex justify-center">
                <img
                  src={logo}
                  alt="BusFlow AI Logo"
                  width={64}
                  height={64}
                  className="rounded-lg mb-4 mt-2 cursor-pointer"
                  onClick={() => navigate("/")}
                />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">
                Welcome to Bus Flow AI
              </CardTitle>
              <CardDescription>
                Chennai City Bus Control Room
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* ── VIEW: Choose ──────────────────────────────── */}
              {view === "choose" && (
                <>
                  <Button
                    className="w-full gap-2 text-sm font-semibold"
                    size="lg"
                    onClick={() => setView("email")}
                    disabled={isLoading}
                  >
                    <Mail className="size-4" />
                    Sign In with Email
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        or
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full gap-2 text-sm font-medium"
                    size="lg"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserX className="size-4" />
                    )}
                    Continue as Guest
                  </Button>

                  {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                  )}
                </>
              )}

              {/* ── VIEW: Email input ─────────────────────────── */}
              {view === "email" && (
                <form onSubmit={handleEmailSubmit}>
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => {
                        setView("choose");
                        setError(null);
                      }}
                    >
                      <ArrowLeft className="size-3" />
                      Back
                    </Button>
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="email"
                          placeholder="name@example.com"
                          type="email"
                          className="pl-9"
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="outline"
                        size="icon"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {error && (
                      <p className="text-sm text-red-500">{error}</p>
                    )}
                  </div>
                </form>
              )}

              {/* ── VIEW: OTP verification ────────────────────── */}
              {view === "otp" && (
                <form onSubmit={handleOtpSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => {
                          setView("email");
                          setOtp("");
                          setError(null);
                        }}
                      >
                        <ArrowLeft className="size-3" />
                        Back
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        We've sent a code to{" "}
                        <span className="font-medium text-foreground">
                          {emailAddress}
                        </span>
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            otp.length === 6 &&
                            !isLoading
                          ) {
                            const form = (
                              e.target as HTMLElement
                            ).closest("form");
                            if (form) form.requestSubmit();
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 text-center">
                        {error}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify Code
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      Didn't receive a code?{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => {
                          setView("email");
                          setOtp("");
                          setError(null);
                        }}
                      >
                        Try again
                      </Button>
                    </p>
                  </div>
                </form>
              )}
            </CardContent>

            <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted border-t rounded-b-lg">
              Secured by{" "}
              <a
                href="https://freebuff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary transition-colors"
              >
                freebuff.com
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
