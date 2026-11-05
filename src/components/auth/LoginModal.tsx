import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import {
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  User,
  Stethoscope,
  FlaskConical,
  Pill,
  Zap,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Copy,
  Check,
  UserPlus,
  LogIn,
  KeyRound,
  IdCard,
  Mail,
  HelpCircle,
  ArrowLeft,
  Clock,
} from "lucide-react";
import {
  verifyAuthOtp,
  fetchDeliveryChannels,
  fetchGoogleConfig,
  authenticateWithGoogle,
  loginWithPassword,
  registerPatient,
  registerUser,
  verifyEmailOtp,
  resendEmailVerification,
  forgotPassword,
  resetPassword,
  ApiError,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type {
  AuthChallengeResponse,
  OtpDeliveryChannel,
} from "../../types/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              width?: number | string;
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessfulLogin?: (role?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessfulLogin,
}) => {
  const { loginSuccess } = useAuth();

  // Primary Modal View Modes
  // SIGN_IN | SIGN_UP | EMAIL_VERIFICATION | FORGOT_PASSWORD | RESET_PASSWORD | DEMO_OTP
  const [modalMode, setModalMode] = useState<
    "SIGN_IN" | "SIGN_UP" | "EMAIL_VERIFICATION" | "FORGOT_PASSWORD" | "RESET_PASSWORD" | "DEMO_OTP"
  >("SIGN_IN");

  // Sign In with Password State
  const [passwordIdentifier, setPasswordIdentifier] = useState<string>("");
  const [loginPasswordValue, setLoginPasswordValue] = useState<string>("");
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isPasswordLoginLoading, setIsPasswordLoginLoading] = useState<boolean>(false);

  // Role Selection State for Sign Up
  const [signupRole, setSignupRole] = useState<"patient" | "doctor" | "laboratory" | "pharmacy">("patient");
  const [roleSelectionStep, setRoleSelectionStep] = useState<boolean>(true);

  // Doctor Professional Registration Fields
  const [docQualification, setDocQualification] = useState<string>("");
  const [docSpecialization, setDocSpecialization] = useState<string>("");
  const [docRegNumber, setDocRegNumber] = useState<string>("");
  const [docHospital, setDocHospital] = useState<string>("");
  const [docAddress, setDocAddress] = useState<string>("");

  // Laboratory Organization Registration Fields
  const [labOrgName, setLabOrgName] = useState<string>("");
  const [labRepName, setLabRepName] = useState<string>("");
  const [labRegNumber, setLabRegNumber] = useState<string>("");
  const [labAddress, setLabAddress] = useState<string>("");

  // Pharmacy Organization Registration Fields
  const [pharmOrgName, setPharmOrgName] = useState<string>("");
  const [pharmRepName, setPharmRepName] = useState<string>("");
  const [pharmRegNumber, setPharmRegNumber] = useState<string>("");
  const [pharmAddress, setPharmAddress] = useState<string>("");

  // Registration Pending Approval Display (Doctor, Laboratory, Pharmacy)
  const [registeredPendingApproval, setRegisteredPendingApproval] = useState<{
    role: string;
    name: string;
    orgOrHospital?: string;
    regNumber?: string;
  } | null>(null);

  // Patient Sign Up State
  const [signupName, setSignupName] = useState<string>("");
  const [signupEmail, setSignupEmail] = useState<string>("");
  const [signupPassword, setSignupPassword] = useState<string>("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState<string>("");
  const [signupPhone, setSignupPhone] = useState<string>("");
  const [signupGender, setSignupGender] = useState<"Male" | "Female" | "Other">("Male");
  const [signupDob, setSignupDob] = useState<string>("");
  const [showSignupPassword, setShowSignupPassword] = useState<boolean>(false);
  const [isSignupLoading, setIsSignupLoading] = useState<boolean>(false);

  // Email Verification State
  const [emailChallengeId, setEmailChallengeId] = useState<string>("");
  const [emailToVerify, setEmailToVerify] = useState<string>("");
  const [maskedEmailAddress, setMaskedEmailAddress] = useState<string>("");
  const [emailOtp, setEmailOtp] = useState<string>("");
  const [devEmailOtp, setDevEmailOtp] = useState<string | null>(null);
  const [isEmailVerifyLoading, setIsEmailVerifyLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(30);
  const [resendTimerActive, setResendTimerActive] = useState<boolean>(false);

  // Registration Success Display
  const [registeredPatient, setRegisteredPatient] = useState<{
    patientId: string;
    name: string;
    email: string;
  } | null>(null);
  const [copiedPatientId, setCopiedPatientId] = useState<boolean>(false);

  // Forgot / Reset Password State
  const [forgotIdentifier, setForgotIdentifier] = useState<string>("");
  const [forgotChallengeId, setForgotChallengeId] = useState<string>("");
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState<string>("");
  const [forgotOtp, setForgotOtp] = useState<string>("");
  const [devForgotOtp, setDevForgotOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [isForgotLoading, setIsForgotLoading] = useState<boolean>(false);
  const [isResetLoading, setIsResetLoading] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Demo OTP Authentication State
  const [_selectedChannel, setSelectedChannel] = useState<OtpDeliveryChannel>("mock");
  const [demoChallenge, setDemoChallenge] = useState<AuthChallengeResponse | null>(null);
  const [demoOtpValue, setDemoOtpValue] = useState<string>("");
  const [mockDevOtp, _setMockDevOtp] = useState<string | null>(null);
  const [demoOtpSecondsRemaining, setDemoOtpSecondsRemaining] = useState<number>(300);
  const [isDemoLoading, setIsDemoLoading] = useState<boolean>(false);

  // Global / Notification State
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unregisteredGooglePrompt, setUnregisteredGooglePrompt] = useState<boolean>(false);

  // Configuration
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [googleRedirectUri, setGoogleRedirectUri] = useState<string>(
    "http://localhost:3000/api/auth/callback/google"
  );

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const googleSignupBtnContainerRef = useRef<HTMLDivElement>(null);

  // Fetch configured channels and Google OAuth configuration
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    fetchDeliveryChannels()
      .then((data) => {
        if (isMounted && data.channels) {
          const mockChan = data.channels.find((c) => c.id === "mock" && c.enabled);
          if (mockChan) {
            setSelectedChannel("mock");
          } else {
            const firstEnabled = data.channels.find((c) => c.enabled && c.configured);
            if (firstEnabled) setSelectedChannel(firstEnabled.id);
          }
        }
      })
      .catch(() => {
        setSelectedChannel("mock");
      });

    fetchGoogleConfig()
      .then((cfg) => {
        if (isMounted && cfg.clientId) {
          setGoogleClientId(cfg.clientId);
          if (cfg.redirectUri) setGoogleRedirectUri(cfg.redirectUri);
        }
      })
      .catch(() => { });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const resetModalState = useCallback(() => {
    setModalMode("SIGN_IN");
    setErrorMessage(null);
    setUnregisteredGooglePrompt(false);
    setIsPasswordLoginLoading(false);
    setIsSignupLoading(false);
    setIsEmailVerifyLoading(false);
    setIsForgotLoading(false);
    setIsResetLoading(false);
    setIsGoogleLoading(false);
    setIsDemoLoading(false);
    setRegisteredPatient(null);
    setRegisteredPendingApproval(null);
    setRoleSelectionStep(true);
    setSignupRole("patient");
    setCopiedPatientId(false);
    setEmailOtp("");
    setForgotOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setResetSuccessMessage(null);
    setDemoChallenge(null);
    setDemoOtpValue(null as any);
  }, []);

  // Handle Google OAuth callback with explicit mode (login vs register)
  const handleGoogleCredential = useCallback(
    async (credential: string, mode: "login" | "register" = "login") => {
      setIsGoogleLoading(true);
      setErrorMessage(null);
      setUnregisteredGooglePrompt(false);

      try {
        const verifyData = await authenticateWithGoogle({ credential, mode });
        loginSuccess(verifyData.user, verifyData.csrfToken);

        if (mode === "register" || !verifyData.user.patientId) {
          // If newly created, show patient ID card
          setRegisteredPatient({
            patientId: verifyData.user.patientId || "SS-PAT-000001",
            name: verifyData.user.name,
            email: verifyData.user.email || "",
          });
        } else {
          resetModalState();
          onClose();
          if (onSuccessfulLogin) {
            onSuccessfulLogin(verifyData.user.role);
          }
        }
      } catch (err: any) {
        if (err.code === "ACCOUNT_NOT_FOUND" && mode === "login") {
          setUnregisteredGooglePrompt(true);
          setErrorMessage(
            "This Google account is not registered yet. Click 'Sign Up with Google' below to create your account and receive your unique Patient ID."
          );
        } else if (err.code === "ACCOUNT_LINK_REQUIRED") {
          setErrorMessage(
            "An account already exists with this email address. Please sign in with your Patient ID or password to securely link your Google account."
          );
        } else {
          setErrorMessage(
            err instanceof ApiError
              ? err.message
              : "Google authentication failed. Please try again."
          );
        }
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [loginSuccess, onClose, onSuccessfulLogin, resetModalState]
  );

  // Initialize Google Identity Services (GSI)
  useEffect(() => {
    if (!isOpen || !googleClientId || typeof window === "undefined") return;

    const setupGoogleGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              if (response.credential) {
                const targetMode = modalMode === "SIGN_UP" ? "register" : "login";
                await handleGoogleCredential(response.credential, targetMode);
              }
            },
            auto_select: false,
          });

          // Render button into Login container if visible
          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: "outline",
              size: "large",
              width: "100%",
              text: "continue_with",
              shape: "rectangular",
            });
          }

          // Render button into Sign Up container if visible
          if (googleSignupBtnContainerRef.current) {
            googleSignupBtnContainerRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(googleSignupBtnContainerRef.current, {
              theme: "outline",
              size: "large",
              width: "100%",
              text: "signup_with",
              shape: "rectangular",
            });
          }
        } catch (err) {
          console.warn("Google GSI initialization notice:", err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogleGsi();
    } else {
      const timer = setTimeout(setupGoogleGsi, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, googleClientId, handleGoogleCredential, modalMode]);

  const handleGoogleOAuthFallback = (mode: "login" | "register" = "login") => {
    if (!googleClientId) {
      // In dev fallback mode when CLIENT_ID is unconfigured, simulate mock Google verification
      const mockSub = `goog_${Date.now()}`;
      const mockEmail = mode === "register" ? signupEmail || "new.patient@gmail.com" : "rahul.verma@synthetic.demo";
      const mockToken = `mock-google-token:${mockSub}:${mockEmail}`;
      handleGoogleCredential(mockToken, mode);
      return;
    }
    const stateParam = encodeURIComponent(JSON.stringify({ mode }));
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      googleClientId
    )}&redirect_uri=${encodeURIComponent(
      googleRedirectUri
    )}&response_type=code&scope=openid%20email%20profile&state=${stateParam}&prompt=select_account`;
    window.location.href = authUrl;
  };

  // Cooldown timer for email OTP resend
  useEffect(() => {
    if (!resendTimerActive) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          setResendTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimerActive]);

  // Demo OTP Countdown
  useEffect(() => {
    if (modalMode !== "DEMO_OTP") return;
    const interval = setInterval(() => {
      setDemoOtpSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [modalMode]);

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const copyPatientIdToClipboard = (pid: string) => {
    navigator.clipboard.writeText(pid);
    setCopiedPatientId(true);
    setTimeout(() => setCopiedPatientId(false), 2000);
  };

  // 1. Password Login Handler (Patient ID or Registered Email)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordIdentifier.trim()) {
      setErrorMessage("Please enter your Patient ID or registered email.");
      return;
    }
    if (!loginPasswordValue) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsPasswordLoginLoading(true);
    setErrorMessage(null);

    try {
      const data = await loginWithPassword(passwordIdentifier.trim(), loginPasswordValue);
      loginSuccess(data.user, data.csrfToken);
      resetModalState();
      onClose();
      if (onSuccessfulLogin) {
        onSuccessfulLogin(data.user.role);
      }
    } catch (err: any) {
      if (err.code === "EMAIL_VERIFICATION_REQUIRED") {
        setEmailToVerify(passwordIdentifier.trim());
        setErrorMessage("Your email address is not verified yet. Please enter the verification code sent to your email.");
        setModalMode("EMAIL_VERIFICATION");
      } else {
        setErrorMessage(
          err instanceof ApiError ? err.message : "Invalid Patient ID, email, or password."
        );
      }
    } finally {
      setIsPasswordLoginLoading(false);
    }
  };

  // 2. Patient Registration Handler
  const handlePatientSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || signupName.trim().length < 2) {
      setErrorMessage("Please enter your full name (minimum 2 characters).");
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!signupPassword || signupPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).*$/.test(signupPassword)) {
      setErrorMessage("Password must contain at least one letter and at least one number.");
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setIsSignupLoading(true);
    setErrorMessage(null);

    try {
      const data = await registerPatient({
        name: signupName.trim(),
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
        phone: signupPhone.trim() || undefined,
        gender: signupGender,
        dateOfBirth: signupDob || undefined,
      });

      setEmailChallengeId(data.challengeId);
      setEmailToVerify(signupEmail.trim().toLowerCase());
      setMaskedEmailAddress(data.maskedEmail);
      setDevEmailOtp(data.devOtp || null);
      setResendCooldown(data.resendAvailableInSeconds || 30);
      setResendTimerActive(true);

      // Transition to Email OTP Verification view
      setModalMode("EMAIL_VERIFICATION");
    } catch (err: any) {
      setErrorMessage(
        err instanceof ApiError ? err.message : "Failed to register patient account."
      );
    } finally {
      setIsSignupLoading(false);
    }
  };

  // Professional / Organization Registration Handler (Doctor, Laboratory, Pharmacy)
  const handleProfessionalSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (signupPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setIsSignupLoading(true);

    try {
      let payload: any = {
        role: signupRole,
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
        phone: signupPhone.trim(),
      };

      if (signupRole === "doctor") {
        if (!signupName.trim()) throw new Error("Doctor full name is required.");
        if (!docRegNumber.trim()) throw new Error("Registration / license number is required.");
        payload = {
          ...payload,
          name: signupName.trim(),
          email: signupEmail.trim().toLowerCase(),
          medicalQualification: docQualification.trim(),
          specialization: docSpecialization.trim(),
          registrationNumber: docRegNumber.trim(),
          hospitalOrClinicName: docHospital.trim(),
          address: docAddress.trim(),
        };
      } else if (signupRole === "laboratory") {
        if (!labOrgName.trim()) throw new Error("Laboratory name is required.");
        if (!labRepName.trim()) throw new Error("Authorized representative name is required.");
        payload = {
          ...payload,
          name: labOrgName.trim(),
          organizationName: labOrgName.trim(),
          email: signupEmail.trim().toLowerCase(),
          authorizedRepresentative: labRepName.trim(),
          registrationNumber: labRegNumber.trim(),
          address: labAddress.trim(),
        };
      } else if (signupRole === "pharmacy") {
        if (!pharmOrgName.trim()) throw new Error("Pharmacy name is required.");
        if (!pharmRepName.trim()) throw new Error("Authorized pharmacist name is required.");
        payload = {
          ...payload,
          name: pharmOrgName.trim(),
          organizationName: pharmOrgName.trim(),
          email: signupEmail.trim().toLowerCase(),
          authorizedRepresentative: pharmRepName.trim(),
          registrationNumber: pharmRegNumber.trim(),
          address: pharmAddress.trim(),
        };
      }

      await registerUser(payload);

      setRegisteredPendingApproval({
        role: signupRole,
        name: payload.name,
        orgOrHospital: payload.hospitalOrClinicName || payload.organizationName,
        regNumber: payload.registrationNumber,
      });
    } catch (err: any) {
      setErrorMessage(
        err instanceof ApiError ? err.message : err.message || "Registration failed. Please check details."
      );
    } finally {
      setIsSignupLoading(false);
    }
  };

  // 3. Email OTP Verification Handler
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtp.length !== 6) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }

    setIsEmailVerifyLoading(true);
    setErrorMessage(null);

    try {
      const verifyData = await verifyEmailOtp({
        challengeId: emailChallengeId,
        otp: emailOtp,
        email: emailToVerify,
      });

      loginSuccess(verifyData.user, verifyData.csrfToken);

      // Show Permanent Patient ID card
      setRegisteredPatient({
        patientId: verifyData.user.patientId || "SS-PAT-000001",
        name: verifyData.user.name,
        email: verifyData.user.email || emailToVerify,
      });
    } catch (err: any) {
      setErrorMessage(
        err instanceof ApiError ? err.message : "Invalid or expired verification code."
      );
    } finally {
      setIsEmailVerifyLoading(false);
    }
  };

  // 4. Resend Email Verification Code Handler
  const handleResendEmailOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage(null);
    try {
      const res = await resendEmailVerification({
        email: emailToVerify,
        challengeId: emailChallengeId,
      });
      setEmailChallengeId(res.challengeId);
      setMaskedEmailAddress(res.maskedEmail);
      if (res.devOtp) setDevEmailOtp(res.devOtp);
      setResendCooldown(res.resendAvailableInSeconds || 30);
      setResendTimerActive(true);
    } catch (err: any) {
      setErrorMessage(
        err instanceof ApiError ? err.message : "Failed to resend verification code."
      );
    }
  };

  // 5. Forgot Password Request Handler
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setErrorMessage("Please enter your Patient ID or registered email.");
      return;
    }

    setIsForgotLoading(true);
    setErrorMessage(null);

    try {
      const res = await forgotPassword(forgotIdentifier.trim());
      setForgotChallengeId(res.challengeId);
      setForgotMaskedEmail(res.maskedEmail);
      if (res.devOtp) setDevForgotOtp(res.devOtp);
      setModalMode("RESET_PASSWORD");
    } catch (err: any) {
      setErrorMessage(
        err instanceof ApiError ? err.message : "Failed to initiate password reset."
      );
    } finally {
      setIsForgotLoading(false);
    }
  };

  // 6. Reset Password Completion Handler
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotOtp.length !== 6) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }
    if (newPassword.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d).*$/.test(newPassword)) {
      setErrorMessage("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsResetLoading(true);
    setErrorMessage(null);

    try {
      const res = await resetPassword({
        challengeId: forgotChallengeId,
        otp: forgotOtp,
        newPassword,
      });
      setResetSuccessMessage(res.message || "Your password has been reset successfully. Please sign in.");
      setPasswordIdentifier(forgotIdentifier);
      setLoginPasswordValue(newPassword);
      setModalMode("SIGN_IN");
    } catch (err: any) {
      setErrorMessage(
        err instanceof ApiError ? err.message : "Failed to reset password. Please verify your OTP."
      );
    } finally {
      setIsResetLoading(false);
    }
  };

  // 8. Demo Persona OTP Verification
  const handleVerifyDemoOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoChallenge || demoOtpValue.length !== 6) return;

    setIsDemoLoading(true);
    setErrorMessage(null);

    try {
      const verifyData = await verifyAuthOtp(demoChallenge.challengeId, demoOtpValue);
      loginSuccess(verifyData.user, verifyData.csrfToken);
      resetModalState();
      onClose();
      if (onSuccessfulLogin) {
        onSuccessfulLogin(verifyData.user.role);
      }
    } catch (err: any) {
      setErrorMessage(
        err instanceof ApiError ? err.message : "Invalid demo code."
      );
    } finally {
      setIsDemoLoading(false);
    }
  };

  const getTitle = () => {
    if (registeredPatient) return "Permanent Patient ID Issued";
    if (registeredPendingApproval) return `${registeredPendingApproval.role.toUpperCase()} Account Created`;
    if (modalMode === "SIGN_UP") {
      if (roleSelectionStep) return "Choose Your Account Type";
      return `Register as ${signupRole.charAt(0).toUpperCase() + signupRole.slice(1)}`;
    }
    if (modalMode === "EMAIL_VERIFICATION") return "Verify Your Email Address";
    if (modalMode === "FORGOT_PASSWORD") return "Reset Account Password";
    if (modalMode === "RESET_PASSWORD") return "Set New Password";
    if (modalMode === "DEMO_OTP") return "Enter 6-Digit Verification Code";
    return "Sign in to SwaasthSaarthi";
  };

  const getDescription = () => {
    if (registeredPatient) return "Your account is activated and ready for health records exchange.";
    if (registeredPendingApproval) return "Your registration is under administrative verification.";
    if (modalMode === "SIGN_UP") {
      if (roleSelectionStep) return "Select your portal role to continue with registration.";
      if (signupRole === "patient") return "Sign up using Google or register with email to receive a permanent Patient ID.";
      if (signupRole === "doctor") return "Enter your medical registration details for hospital credentialing.";
      if (signupRole === "laboratory") return "Enter diagnostic facility details for laboratory onboarding.";
      if (signupRole === "pharmacy") return "Enter pharmacy license and dispensation facility credentials.";
    }
    if (modalMode === "EMAIL_VERIFICATION") return `Enter the 6-digit verification code sent to ${maskedEmailAddress || emailToVerify}.`;
    if (modalMode === "FORGOT_PASSWORD") return "Enter your Patient ID or registered email to receive a password reset code.";
    if (modalMode === "RESET_PASSWORD") return `Enter the verification code sent to ${forgotMaskedEmail} and your new password.`;
    if (modalMode === "DEMO_OTP") return `Enter the 6-digit code for ${demoChallenge?.maskedDestination || demoChallenge?.maskedIdentifier}.`;
    return undefined;
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      description={getDescription()}
      maxWidth="md"
    >
      <div className="space-y-4 font-sans">
        {/* Top Tab Mode Switcher: Sign In vs Sign Up */}
        {!registeredPatient && !registeredPendingApproval && modalMode !== "EMAIL_VERIFICATION" && modalMode !== "DEMO_OTP" && modalMode !== "RESET_PASSWORD" && (
          <div className="flex p-1 bg-[#F0F7F6] rounded-none border border-[#D0E5E1]">
            <button
              type="button"
              onClick={() => {
                setModalMode("SIGN_IN");
                setErrorMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-none text-xs font-semibold transition-all cursor-pointer ${modalMode === "SIGN_IN" || modalMode === "FORGOT_PASSWORD"
                ? "bg-[#1A1918] text-white border border-[#1A1918] shadow-2xs"
                : "text-[#5C574F] hover:text-[#191817]"
                }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setModalMode("SIGN_UP");
                setRoleSelectionStep(true);
                setErrorMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-none text-xs font-semibold transition-all cursor-pointer ${modalMode === "SIGN_UP"
                ? "bg-[#1A1918] text-white border border-[#1A1918] shadow-2xs"
                : "text-[#5C574F] hover:text-[#191817]"
                }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        )}

        {/* Success Alert */}
        {resetSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-none flex items-start gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{resetSuccessMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-none flex items-start gap-2.5 text-xs text-red-900 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Authentication Notice</span>
              <span>{errorMessage}</span>
              {unregisteredGooglePrompt && (
                <div className="mt-2 pt-2 border-t border-red-200">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setModalMode("SIGN_UP");
                      setErrorMessage(null);
                      setUnregisteredGooglePrompt(false);
                    }}
                    rightIcon={<UserPlus className="w-3.5 h-3.5" />}
                  >
                    Go to Patient Registration
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: SIGN IN (Continue with Google + Patient ID/Email & Password)      */}
        {/* ========================================================================= */}
        {modalMode === "SIGN_IN" && !registeredPatient && (
          <div className="space-y-4">
            {/* OPTION A: CONTINUE WITH GOOGLE */}
            <div>
              <div ref={googleBtnContainerRef} className="w-full min-h-[42px] flex items-center justify-center">
                <button
                  type="button"
                  disabled={isGoogleLoading}
                  onClick={() => handleGoogleOAuthFallback("login")}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-none border border-[#B6D6D0] bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isGoogleLoading ? "Verifying Google Identity..." : "Continue with Google"}</span>
                </button>
              </div>
            </div>

            {/* DIVIDER: OR */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#B6D6D0]"></div>
              <span className="flex-shrink mx-3 text-slate-400 text-xs font-bold uppercase tracking-wider">
                OR
              </span>
              <div className="flex-grow border-t border-[#B6D6D0]"></div>
            </div>

            {/* OPTION B: PATIENT ID OR EMAIL + PASSWORD FORM */}
            <form onSubmit={handlePasswordLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient ID or Registered Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <IdCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={passwordIdentifier}
                    onChange={(e) => setPasswordIdentifier(e.target.value)}
                    placeholder="Enter Patient ID or registered email"
                    className="w-full pl-9 pr-3 py-2 text-xs text-[#1A1918] border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-[#F0F7F6] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPasswordValue}
                    onChange={(e) => setLoginPasswordValue(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2 text-xs text-[#1A1918] border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-[#F0F7F6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Controls: Remember Me + Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded-none border-[#B6D6D0] text-[#0F766E] focus:ring-[#1A1918]"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotIdentifier(passwordIdentifier);
                    setModalMode("FORGOT_PASSWORD");
                    setErrorMessage(null);
                  }}
                  className="text-[#0F766E] hover:text-[#0D655E] font-semibold hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full rounded-none"
                isLoading={isPasswordLoginLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: ROLE SELECTION & ROLE-BASED REGISTRATION                          */}
        {/* ========================================================================= */}
        {modalMode === "SIGN_UP" && !registeredPatient && !registeredPendingApproval && (
          <div className="space-y-4 animate-fadeIn">
            {/* STEP 1: 4 VISUALLY DISTINCT ROLE CARDS */}
            {roleSelectionStep ? (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Role 1: Patient */}
                  <div
                    onClick={() => setSignupRole("patient")}
                    className={`p-3.5 border rounded-none cursor-pointer transition-all flex flex-col justify-between ${
                      signupRole === "patient"
                        ? "border-[#1A1918] bg-[#F0F7F6] shadow-2xs"
                        : "border-[#D0E5E1] bg-white hover:border-[#C5BEB2] hover:bg-[#F0F7F6]/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 shrink-0 rounded-none flex items-center justify-center transition-colors ${
                          signupRole === "patient"
                            ? "bg-[#1A1918] text-white"
                            : "bg-[#F0F7F6] text-[#5C574F] border border-[#D0E5E1]"
                        }`}
                      >
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-[#191817]">Patient</span>
                          {signupRole === "patient" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#6E685F] leading-snug mt-1">
                          Personal health records, prescriptions, and consent control.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Role 2: Doctor */}
                  <div
                    onClick={() => setSignupRole("doctor")}
                    className={`p-3.5 border rounded-none cursor-pointer transition-all flex flex-col justify-between ${
                      signupRole === "doctor"
                        ? "border-[#1A1918] bg-[#F0F7F6] shadow-2xs"
                        : "border-[#D0E5E1] bg-white hover:border-[#C5BEB2] hover:bg-[#F0F7F6]/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 shrink-0 rounded-none flex items-center justify-center transition-colors ${
                          signupRole === "doctor"
                            ? "bg-[#1A1918] text-white"
                            : "bg-[#F0F7F6] text-[#5C574F] border border-[#D0E5E1]"
                        }`}
                      >
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-[#191817]">Doctor</span>
                          {signupRole === "doctor" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#6E685F] leading-snug mt-1">
                          Clinical history review, digital prescriptions, and care plans.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Role 3: Laboratory */}
                  <div
                    onClick={() => setSignupRole("laboratory")}
                    className={`p-3.5 border rounded-none cursor-pointer transition-all flex flex-col justify-between ${
                      signupRole === "laboratory"
                        ? "border-[#1A1918] bg-[#F0F7F6] shadow-2xs"
                        : "border-[#D0E5E1] bg-white hover:border-[#C5BEB2] hover:bg-[#F0F7F6]/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 shrink-0 rounded-none flex items-center justify-center transition-colors ${
                          signupRole === "laboratory"
                            ? "bg-[#1A1918] text-white"
                            : "bg-[#F0F7F6] text-[#5C574F] border border-[#D0E5E1]"
                        }`}
                      >
                        <FlaskConical className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-[#191817]">Laboratory</span>
                          {signupRole === "laboratory" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#6E685F] leading-snug mt-1">
                          Diagnostic order processing and verified report publication.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Role 4: Pharmacy */}
                  <div
                    onClick={() => setSignupRole("pharmacy")}
                    className={`p-3.5 border rounded-none cursor-pointer transition-all flex flex-col justify-between ${
                      signupRole === "pharmacy"
                        ? "border-[#1A1918] bg-[#F0F7F6] shadow-2xs"
                        : "border-[#D0E5E1] bg-white hover:border-[#C5BEB2] hover:bg-[#F0F7F6]/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 shrink-0 rounded-none flex items-center justify-center transition-colors ${
                          signupRole === "pharmacy"
                            ? "bg-[#1A1918] text-white"
                            : "bg-[#F0F7F6] text-[#5C574F] border border-[#D0E5E1]"
                        }`}
                      >
                        <Pill className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-[#191817]">Pharmacy</span>
                          {signupRole === "pharmacy" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#6E685F] leading-snug mt-1">
                          Prescription verification and dispensation tracking.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full rounded-none mt-2 shadow-2xs"
                  onClick={() => setRoleSelectionStep(false)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue as {signupRole.charAt(0).toUpperCase() + signupRole.slice(1)}
                </Button>
              </div>
            ) : (
              /* STEP 2: ROLE-SPECIFIC REGISTRATION FORM */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <button
                    type="button"
                    onClick={() => setRoleSelectionStep(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#0F766E] hover:text-[#0D655E] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Choose different role</span>
                  </button>
                </div>

                {/* ROLE 1 FORM: PATIENT */}
                {signupRole === "patient" && (
                  <div className="space-y-4">
                    {/* OPTION A: CONTINUE WITH GOOGLE REGISTRATION */}
                    <div>
                      <div ref={googleSignupBtnContainerRef} className="w-full min-h-[42px] flex items-center justify-center">
                        <button
                          type="button"
                          disabled={isGoogleLoading}
                          onClick={() => handleGoogleOAuthFallback("register")}
                          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-none border border-[#D0E5E1] bg-white hover:bg-[#F0F7F6] text-[#191817] text-xs font-semibold shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>{isGoogleLoading ? "Creating Patient Account..." : "Sign Up with Google"}</span>
                        </button>
                      </div>
                    </div>

                    {/* DIVIDER: OR REGISTER MANUALLY */}
                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-[#D0E5E1]"></div>
                      <span className="flex-shrink mx-3 text-[#7A746B] text-[10px] font-medium uppercase tracking-wider">
                        OR REGISTER WITH EMAIL
                      </span>
                      <div className="flex-grow border-t border-[#D0E5E1]"></div>
                    </div>

                    {/* MANUAL PATIENT REGISTRATION FORM */}
                    <form onSubmit={handlePatientSignup} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-[#191817] mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="Full name"
                          className="w-full px-3 py-2 text-xs text-[#191817] border border-[#D0E5E1] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#191817] mb-1">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="Enter Your Email"
                          className="w-full px-3 py-2 text-xs text-[#191817] border border-[#D0E5E1] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-medium text-[#191817] mb-1">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showSignupPassword ? "text" : "password"}
                              required
                              minLength={8}
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              placeholder="Password"
                              className="w-full px-3 py-2 text-xs text-[#191817] border border-[#D0E5E1] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white pr-8 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignupPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#7A746B] hover:text-[#191817] cursor-pointer"
                              aria-label={showSignupPassword ? "Hide password" : "Show password"}
                            >
                              {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#191817] mb-1">
                            Confirm Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            type={showSignupPassword ? "text" : "password"}
                            required
                            value={signupConfirmPassword}
                            onChange={(e) => setSignupConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            className="w-full px-3 py-2 text-xs text-[#191817] border border-[#D0E5E1] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-medium text-[#191817] mb-1">
                            Mobile Number
                          </label>
                          <input
                            type="tel"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            placeholder="Enter Mobile number"
                            className="w-full px-3 py-2 text-xs text-[#191817] border border-[#D0E5E1] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#191817] mb-1">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={signupDob}
                            onChange={(e) => setSignupDob(e.target.value)}
                            className="w-full px-3 py-2 text-xs text-[#191817] border border-[#D0E5E1] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#191817] mb-1">
                          Gender
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["Male", "Female", "Other"] as const).map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setSignupGender(g)}
                              className={`py-1.5 px-3 text-xs border rounded-none transition-all cursor-pointer text-center ${signupGender === g
                                ? "border-[#1A1918] bg-[#1A1918] text-white font-medium shadow-2xs"
                                : "border-[#D0E5E1] bg-white text-[#5C574F] hover:bg-[#F0F7F6] hover:text-[#191817]"
                                }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        className="w-full rounded-none mt-2 shadow-2xs"
                        isLoading={isSignupLoading}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Continue to Email Verification
                      </Button>
                    </form>
                  </div>
                )}

                {/* ROLE 2 FORM: DOCTOR */}
                {signupRole === "doctor" && (
                  <form onSubmit={handleProfessionalSignup} className="space-y-3">
                    <div className="p-2.5 bg-amber-50 border border-amber-300 text-xs text-amber-900">
                      <strong>Credentialing Notice:</strong> Doctor registrations require verification and administrator approval before access to clinical dashboards and patient records is granted.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Full Name (with Title) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="e.g. Dr. Vikram Seth"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Professional Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="e.g. dr.vikram@hospital.org"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Medical Qualification <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={docQualification}
                          onChange={(e) => setDocQualification(e.target.value)}
                          placeholder="e.g. MBBS, MD (Medicine)"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Specialization <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={docSpecialization}
                          onChange={(e) => setDocSpecialization(e.target.value)}
                          placeholder="e.g. Cardiology, Internal Medicine"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Registration / License Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={docRegNumber}
                          onChange={(e) => setDocRegNumber(e.target.value)}
                          placeholder="e.g. MCI-2024-8841"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Hospital / Clinic Affiliation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={docHospital}
                          onChange={(e) => setDocHospital(e.target.value)}
                          placeholder="e.g. Apollo Care Hospital"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          placeholder="+91 Mobile number"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Clinic / Hospital Address
                        </label>
                        <input
                          type="text"
                          value={docAddress}
                          onChange={(e) => setDocAddress(e.target.value)}
                          placeholder="City, State"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          required
                          minLength={8}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Min 8 chars"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          required
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full rounded-none mt-2"
                      isLoading={isSignupLoading}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Submit Doctor Registration for Approval
                    </Button>
                  </form>
                )}

                {/* ROLE 3 FORM: LABORATORY */}
                {signupRole === "laboratory" && (
                  <form onSubmit={handleProfessionalSignup} className="space-y-3">
                    <div className="p-2.5 bg-amber-50 border border-amber-300 text-xs text-amber-900">
                      <strong>Organization Notice:</strong> Diagnostic laboratories require organizational accreditation verification before report submission capabilities are enabled.
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Diagnostic Laboratory Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={labOrgName}
                        onChange={(e) => setLabOrgName(e.target.value)}
                        placeholder="e.g. Metropolis Diagnostics Hub"
                        className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Authorized Representative <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={labRepName}
                          onChange={(e) => setLabRepName(e.target.value)}
                          placeholder="e.g. Dr. Rajesh Kumar"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Organization Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="e.g. lab@metropolis.com"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Registration / NABL License <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={labRegNumber}
                          onChange={(e) => setLabRegNumber(e.target.value)}
                          placeholder="e.g. NABL-2024-5512"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Contact Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          placeholder="+91-80-23000000"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Facility Address
                      </label>
                      <input
                        type="text"
                        value={labAddress}
                        onChange={(e) => setLabAddress(e.target.value)}
                        placeholder="Street, City, Pincode"
                        className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          required
                          minLength={8}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Min 8 chars"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          required
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full rounded-none mt-2"
                      isLoading={isSignupLoading}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Submit Laboratory Registration for Approval
                    </Button>
                  </form>
                )}

                {/* ROLE 4 FORM: PHARMACY */}
                {signupRole === "pharmacy" && (
                  <form onSubmit={handleProfessionalSignup} className="space-y-3">
                    <div className="p-2.5 bg-amber-50 border border-amber-300 text-xs text-amber-900">
                      <strong>Organization Notice:</strong> Pharmacy accounts require drug authority licensing validation by administrators before medicine dispensation operations are enabled.
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pharmacy Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={pharmOrgName}
                        onChange={(e) => setPharmOrgName(e.target.value)}
                        placeholder="e.g. Apollo Care Pharmacy"
                        className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Authorized Pharmacist / Representative <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={pharmRepName}
                          onChange={(e) => setPharmRepName(e.target.value)}
                          placeholder="e.g. Pooja Sharma, R.Ph"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Organization Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="e.g. rx@apollocare.org"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Drug License / Registration Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={pharmRegNumber}
                          onChange={(e) => setPharmRegNumber(e.target.value)}
                          placeholder="e.g. DL-2024-9912"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Contact Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          placeholder="+91-80-26000000"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pharmacy Facility Address
                      </label>
                      <input
                        type="text"
                        value={pharmAddress}
                        onChange={(e) => setPharmAddress(e.target.value)}
                        placeholder="Street, City, Pincode"
                        className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          required
                          minLength={8}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Min 8 chars"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          required
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full rounded-none mt-2"
                      isLoading={isSignupLoading}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Submit Pharmacy Registration for Approval
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2.5: PRACTITIONER / ORG PENDING APPROVAL SCREEN                      */}
        {/* ========================================================================= */}
        {registeredPendingApproval && (
          <div className="space-y-4 text-center py-2 animate-fadeIn">
            <div className="w-12 h-12 bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto rounded-none">
              <Clock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {registeredPendingApproval.role.toUpperCase()} Registration Submitted!
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Your credentials have been securely stored and queued for review. In accordance with healthcare data protection standards, accounts must be approved by an administrator before accessing clinical records.
              </p>
            </div>

            {/* Sharp Status Card */}
            <div className="p-4 bg-amber-50 border-2 border-amber-500 rounded-none text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                  Account Verification Status
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-2 py-0.5 rounded-none border border-amber-400">
                  PENDING REVIEW
                </span>
              </div>

              <div className="bg-white p-3 rounded-none border border-amber-300 text-xs space-y-1.5 text-slate-800">
                <div>
                  <span className="text-slate-500 font-semibold block">Registrant Name:</span>
                  <span className="font-bold text-slate-900">{registeredPendingApproval.name}</span>
                </div>
                {registeredPendingApproval.orgOrHospital && (
                  <div>
                    <span className="text-slate-500 font-semibold block">Facility / Organization:</span>
                    <span className="font-bold text-slate-900">{registeredPendingApproval.orgOrHospital}</span>
                  </div>
                )}
                {registeredPendingApproval.regNumber && (
                  <div>
                    <span className="text-slate-500 font-semibold block">License / Registration Number:</span>
                    <span className="font-mono font-bold text-slate-900">{registeredPendingApproval.regNumber}</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-amber-800 flex items-start gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <span>An administrator will review your medical credentials. Once approved, your role dashboard will unlock automatically.</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full rounded-none"
              onClick={() => {
                setRegisteredPendingApproval(null);
                resetModalState();
                onClose();
              }}
            >
              Return to Portal
            </Button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: EMAIL VERIFICATION (During Manual Registration)                   */}
        {/* ========================================================================= */}
        {modalMode === "EMAIL_VERIFICATION" && !registeredPatient && (
          <form onSubmit={handleVerifyEmail} className="space-y-4 animate-fadeIn">
            <div className="p-3 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none text-xs text-[#1A1918] flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Verification Code Sent</span>
                <span>
                  Please enter the 6-digit security code sent to <strong>{maskedEmailAddress || emailToVerify}</strong> to activate your patient account.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                Enter 6-Digit Email Code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="• • • • • •"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full text-center text-2xl tracking-[0.4em] font-mono font-bold py-3 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white text-slate-900"
              />
            </div>

            {devEmailOtp && (
              <div className="p-2.5 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#69655E]">
                  <Zap className="w-4 h-4 text-[#0F766E]" />
                  <span>Dev Simulation Code:</span>
                  <span className="font-mono font-bold text-[#0F766E] text-sm">
                    {devEmailOtp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailOtp(devEmailOtp)}
                  className="px-2.5 py-1 bg-white border border-[#B6D6D0] rounded-none text-xs font-semibold text-[#1A1918] hover:bg-[#F0F7F6] cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="flex-1 rounded-none"
                isLoading={isEmailVerifyLoading}
                disabled={emailOtp.length !== 6}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Verify &amp; Activate Account
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                className="rounded-none"
                onClick={handleResendEmailOtp}
                disabled={resendCooldown > 0}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                {resendCooldown > 0 ? `${resendCooldown}s` : "Resend"}
              </Button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setModalMode("SIGN_UP")}
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to registration details</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: FORGOT PASSWORD (Step 1: Enter Identifier)                        */}
        {/* ========================================================================= */}
        {modalMode === "FORGOT_PASSWORD" && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 animate-fadeIn">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-none text-xs text-slate-700 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
              <span>
                Enter your unique <strong>Patient ID (SS-PAT-XXXXXX)</strong> or registered email address. We will dispatch a 6-digit verification code to reset your password.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient ID or Registered Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <IdCard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="Enter Patient ID or registered email"
                  className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full rounded-none"
              isLoading={isForgotLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Send Password Reset Code
            </Button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setModalMode("SIGN_IN")}
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: RESET PASSWORD (Step 2: Enter OTP and New Password)               */}
        {/* ========================================================================= */}
        {modalMode === "RESET_PASSWORD" && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 animate-fadeIn">
            <div className="p-3 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none text-xs text-[#1A1918] flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Reset Code Sent</span>
                <span>
                  Enter the 6-digit code sent to <strong>{forgotMaskedEmail}</strong> and your new password.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 text-center">
                6-Digit Reset Code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                required
                placeholder="• • • • • •"
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full text-center text-xl tracking-[0.4em] font-mono font-bold py-2.5 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white text-slate-900"
              />
            </div>

            {devForgotOtp && (
              <div className="p-2 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none flex items-center justify-between text-xs">
                <span className="text-[#69655E] font-mono">Dev Code: <strong className="text-[#0F766E]">{devForgotOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => setForgotOtp(devForgotOtp)}
                  className="px-2 py-0.5 bg-white border border-[#B6D6D0] rounded-none text-xs font-semibold text-[#1A1918] hover:bg-[#F0F7F6]"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 text-xs text-slate-900 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full rounded-none"
              isLoading={isResetLoading}
              disabled={forgotOtp.length !== 6 || newPassword.length < 8}
            >
              Reset Password &amp; Continue
            </Button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setModalMode("FORGOT_PASSWORD")}
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to reset request</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: PERMANENT PATIENT ID ISSUED (Card with Copy Button)               */}
        {/* ========================================================================= */}
        {registeredPatient && (
          <div className="space-y-4 py-2 animate-fadeIn text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-none flex items-center justify-center mx-auto border border-emerald-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Patient Account Created &amp; Activated!
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Your permanent Patient ID has been issued. You can now use either this ID or your registered email with your password to log in.
              </p>
            </div>

            {/* Sharp Patient ID Display Card */}
            <div className="p-4 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#1A1918] uppercase tracking-wider font-mono">
                  Assigned Patient ID
                </span>
                <span className="text-[10px] bg-[#F0F7F6] text-[#0F766E] font-mono font-bold px-2 py-0.5 rounded-none border border-[#D0E5E1]">
                  Immutable Account Identifier
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-none border border-[#D0E5E1]">
                <span className="text-2xl font-mono font-extrabold text-[#0F766E] tracking-wide">
                  {registeredPatient.patientId}
                </span>
                <button
                  type="button"
                  onClick={() => copyPatientIdToClipboard(registeredPatient.patientId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F7F6] hover:bg-[#D0E5E1] text-[#1A1918] text-xs font-mono font-bold rounded-none border border-[#B6D6D0] transition-colors cursor-pointer"
                >
                  {copiedPatientId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                <div>
                  <span className="text-slate-500 block">Patient Name:</span>
                  <span className="font-bold text-slate-900">{registeredPatient.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Registered Email:</span>
                  <span className="font-bold text-slate-900 truncate block">{registeredPatient.email}</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full rounded-none"
              onClick={() => {
                resetModalState();
                onClose();
                if (onSuccessfulLogin) {
                  onSuccessfulLogin("patient");
                }
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Enter Health Portal Dashboard
            </Button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: DEMO OTP VERIFICATION                                            */}
        {/* ========================================================================= */}
        {modalMode === "DEMO_OTP" && (
          <form onSubmit={handleVerifyDemoOtp} className="space-y-4 animate-fadeIn">
            <div className="p-3 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none text-xs text-[#1A1918] flex items-center justify-between">
              <span>Code sent to <strong className="font-mono">{demoChallenge?.maskedDestination || demoChallenge?.maskedIdentifier}</strong></span>
              <span className="font-mono font-bold text-[#0F766E]">{Math.floor(demoOtpSecondsRemaining / 60)}:{(demoOtpSecondsRemaining % 60).toString().padStart(2, "0")}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                Enter 6-Digit Demo Code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="• • • • • •"
                value={demoOtpValue}
                onChange={(e) => setDemoOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full text-center text-2xl tracking-[0.4em] font-mono font-bold py-3 border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-white text-slate-900"
              />
            </div>

            {mockDevOtp && (
              <div className="p-2.5 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none flex items-center justify-between text-xs">
                <span className="text-[#69655E] font-mono">Demo Auto-Fill: <strong className="text-[#0F766E]">{mockDevOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => setDemoOtpValue(mockDevOtp)}
                  className="px-2.5 py-1 bg-white border border-[#B6D6D0] rounded-none text-xs font-bold text-[#1A1918] hover:bg-[#F0F7F6]"
                >
                  Auto-Fill
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full rounded-none"
              isLoading={isDemoLoading}
              disabled={demoOtpValue.length !== 6}
            >
              Verify &amp; Enter Portal
            </Button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setModalMode("SIGN_IN")}
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                ← Back to sign-in options
              </button>
            </div>
          </form>
        )}


      </div>
    </Dialog>
  );
};
