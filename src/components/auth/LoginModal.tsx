import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  ShieldCheck,
  KeyRound,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Sparkles,
  User,
  Stethoscope,
  FlaskConical,
  Pill,
  ShieldAlert,
} from "lucide-react";
import {
  createAuthChallenge,
  verifyAuthOtp,
  fetchMockDevOtp,
  ApiError,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { AuthChallengeResponse } from "../../types/api";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessfulLogin?: (role?: string) => void;
}

const DEMO_PERSONAS = [
  {
    role: "patient" as const,
    name: "Rahul Verma",
    id: "rahul.verma@sbx",
    badge: "Patient",
    icon: User,
  },
  {
    role: "doctor" as const,
    name: "Dr. Ananya Sharma",
    id: "dr.ananya@hpr.sbx",
    badge: "Doctor (Cardiology)",
    icon: Stethoscope,
  },
  {
    role: "laboratory" as const,
    name: "Max Diagnostic Lab",
    id: "max.lab@hfr.sbx",
    badge: "Lab Technician",
    icon: FlaskConical,
  },
  {
    role: "pharmacy" as const,
    name: "Apollo Pharmacy",
    id: "apollo.rx@hfr.sbx",
    badge: "Pharmacist",
    icon: Pill,
  },
  {
    role: "admin" as const,
    name: "Neha Kapoor",
    id: "admin.neha@swasth.sbx",
    badge: "Administrator",
    icon: ShieldAlert,
  },
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessfulLogin,
}) => {
  const { loginSuccess } = useAuth();

  // State: step 1 = identifier, step 2 = OTP
  const [step, setStep] = useState<"IDENTIFIER" | "OTP">("IDENTIFIER");
  const [identifier, setIdentifier] = useState<string>("rahul.verma@sbx");
  const [otp, setOtp] = useState<string>("");
  const [challenge, setChallenge] = useState<AuthChallengeResponse | null>(null);

  // Loading and Error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mock dev OTP inspection state
  const [mockOtp, setMockOtp] = useState<string | null>(null);
  const [mockOtpLoading, setMockOtpLoading] = useState<boolean>(false);

  // Timer states
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [resendCooldown, setResendCooldown] = useState<number>(30);

  const otpInputRef = useRef<HTMLInputElement>(null);

  const resetModalState = () => {
    setStep("IDENTIFIER");
    setErrorMessage(null);
    setOtp("");
    setMockOtp(null);
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  // Countdown timers for OTP expiration & resend
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === "OTP" && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, secondsRemaining]);

  useEffect(() => {
    let resendTimer: ReturnType<typeof setInterval>;
    if (step === "OTP" && resendCooldown > 0) {
      resendTimer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(resendTimer);
  }, [step, resendCooldown]);

  // Fetch mock OTP via dev channel helper when challenge is created
  const fetchDevOtpHelper = async (challengeId: string) => {
    setMockOtpLoading(true);
    try {
      const devData = await fetchMockDevOtp(challengeId);
      setMockOtp(devData.demoOtp);
    } catch {
      // Dev channel may be disabled in production
      setMockOtp(null);
    } finally {
      setMockOtpLoading(false);
    }
  };

  // Step 1: Request OTP Challenge
  const handleRequestChallenge = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const challengeData = await createAuthChallenge(identifier.trim());
      setChallenge(challengeData);
      setStep("OTP");
      setSecondsRemaining(300);
      setResendCooldown(challengeData.resendAvailableInSeconds || 30);
      setOtp("");

      // Automatically query mock dev channel in demo mode
      fetchDevOtpHelper(challengeData.challengeId);

      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError ? err.message : "Failed to create login challenge."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!challenge || otp.length !== 6) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const verifyData = await verifyAuthOtp(challenge.challengeId, otp);
      loginSuccess(verifyData.user, verifyData.csrfToken);
      resetModalState();
      onClose();
      if (onSuccessfulLogin) {
        onSuccessfulLogin(verifyData.user.role);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : "Invalid verification code. Please check and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={step === "IDENTIFIER" ? "Continue with ABHA — Demo" : "Enter Verification Code"}
      description={
        step === "IDENTIFIER"
          ? "College demonstration using synthetic Ayushman Bharat Health Accounts (ABHA)."
          : `Enter the 6-digit verification code issued for ${challenge?.maskedIdentifier}`
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Authentication Notice</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* STEP 1: IDENTIFIER SELECTION / ENTRY */}
        {step === "IDENTIFIER" && (
          <form onSubmit={handleRequestChallenge} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ABHA Address or ABHA Number
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <input
                  type="text"
                  placeholder="e.g. rahul.verma@sbx or 32-8492-1920-4491"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 font-mono"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Synthetic format: <code>user@sbx</code> or <code>14-digit ABHA</code>
              </p>
            </div>

            {/* Quick Demo Persona Badges */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Or Select a Synthetic Demo Persona
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_PERSONAS.map((persona) => {
                  const Icon = persona.icon;
                  const isSelected = identifier === persona.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => setIdentifier(persona.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "bg-teal-50 border-teal-500 text-teal-900 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-teal-700 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate leading-tight">
                          {persona.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">
                          {persona.badge}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue with ABHA — Demo
            </Button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === "OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  6-Digit Verification Code
                </label>
                <span className="text-xs font-mono text-slate-500">
                  Expires in: <strong className="text-slate-800">{formatTimer(secondsRemaining)}</strong>
                </span>
              </div>

              <input
                ref={otpInputRef}
                type="text"
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full text-center text-xl tracking-[0.5em] font-mono font-bold py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white"
              />
            </div>

            {/* Development-only Mock Delivery Helper Box */}
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-900">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  <span>Mock Telephony Gateway (Development Assistant)</span>
                </div>
                <Badge variant="teal" size="sm">Demo Channel</Badge>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                In local development, the synthetic OTP is delivered via an isolated mock channel.
              </p>
              {mockOtpLoading ? (
                <div className="text-xs text-slate-400 font-mono">Fetching delivered mock OTP...</div>
              ) : mockOtp ? (
                <div className="flex items-center justify-between p-2 bg-white border border-teal-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-xs text-slate-700 font-medium">Delivered OTP:</span>
                    <strong className="text-sm font-mono text-teal-800 tracking-wider">
                      {mockOtp}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtp(mockOtp)}
                    className="text-xs text-teal-700 font-semibold hover:text-teal-900 underline"
                  >
                    Auto-Fill
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  Mock OTP inspection unavailable in this environment.
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="flex-1"
                isLoading={isLoading}
                disabled={otp.length !== 6 || secondsRemaining === 0}
              >
                Verify &amp; Establish Session
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => handleRequestChallenge()}
                disabled={resendCooldown > 0 || isLoading}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend OTP"}
              </Button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setStep("IDENTIFIER")}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                ← Back to Identifier Selection
              </button>
            </div>
          </form>
        )}

        {/* Security & Academic Disclaimer */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-start gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
          <span>
            <strong>Academic Demonstration:</strong> Authentications are processed by the local
            Next.js Route Handlers session engine. Synthetic credentials do not access real ABDM
            registers.
          </span>
        </div>
      </div>
    </Dialog>
  );
};
