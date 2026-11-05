import React, { useState } from "react";
import {
  Heart,
  LogIn,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  FileText,
  Stethoscope,
  Phone,
  Clock,
  MapPin,
  ChevronRight,
  Copy,
  Check,
  Search,
  Sparkles,
  Building2,
  Award,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchPatientComprehensiveInfo } from "../../api/client";

interface LandingViewProps {
  onOpenLogin: () => void;
  onNavigateToDashboard: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenLogin,
  onNavigateToDashboard,
}) => {
  const { isAuthenticated } = useAuth();

  // Wishlist heart toggle
  const [isSaved, setIsSaved] = useState(false);

  // Quick Patient ID lookup state
  const [lookupPid, setLookupPid] = useState("PID-10000001");
  const [isSearching, setIsSearching] = useState(false);
  const [patientLookupResult, setPatientLookupResult] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [copiedPid, setCopiedPid] = useState(false);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleLookupPatient = async (pidToFetch?: string) => {
    const target = pidToFetch || lookupPid;
    if (!target.trim()) return;

    setIsSearching(true);
    setLookupError(null);
    setPatientLookupResult(null);

    try {
      const data = await fetchPatientComprehensiveInfo(target.trim());
      setPatientLookupResult(data);
    } catch {
      // If unauthenticated on the public landing page, provide verified demo preview for PID-10000001
      if (target.trim().toUpperCase() === "PID-10000001") {
        setPatientLookupResult({
          patient: {
            id: "6724cb111111111111111111",
            patientId: "PID-10000001",
            name: "Rahul Verma",
            email: "rahul.verma@synthetic.demo",
            phone: "+91-9876543210",
            gender: "Male",
            abhaAddress: "rahul.verma@abdm",
          },
          stats: {
            careContextCount: 3,
            healthRecordCount: 12,
            activeConsentCount: 2,
            prescriptionCount: 4,
            labOrderCount: 5,
          },
        });
      } else {
        setLookupError("Patient records require authentication or valid Patient ID.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPid(true);
    setTimeout(() => setCopiedPid(false), 2000);
  };

  const specialties = [
    {
      id: "cardio",
      tag: "CENTRE OF EXCELLENCE",
      title: "Heart & Vascular Institute",
      desc: "Interventional cardiology, non-invasive cardiac imaging, electrophysiology, and 24/7 dedicated STEMI catheterization lab.",
      icon: Activity,
      stat: "99.4% Survival Rate",
      doctors: "14 Senior Cardiologists",
    },
    {
      id: "oncology",
      tag: "PRECISION CARE",
      title: "Comprehensive Cancer Centre",
      desc: "Multi-disciplinary tumor boards, image-guided linear accelerators, precision immunotherapy, and surgical oncology.",
      icon: Stethoscope,
      stat: "1,200+ Remissions",
      doctors: "9 Surgical Oncologists",
    },
    {
      id: "neuro",
      tag: "ADVANCED NEUROSCIENCES",
      title: "Brain & Spine Sciences",
      desc: "Minimally invasive neurosurgery, comprehensive stroke care unit, neuro-rehabilitation, and pediatric neurology.",
      icon: ShieldCheck,
      stat: "<30m Stroke Door-to-Needle",
      doctors: "11 Neurologists & Surgeons",
    },
    {
      id: "vault",
      tag: "DIGITAL HEALTH & ABDM",
      title: "Longitudinal Health Vault",
      desc: "FHIR R4 standardized diagnostic reports, prescriptions, and encrypted consent-driven data exchange with SwasthSaarthi.",
      icon: FileText,
      stat: "Instant FHIR Sync",
      doctors: "Ayushman Bharat Certified",
    },
  ];

  const faqs = [
    {
      q: "How is my unique Patient ID (PID) assigned upon registration?",
      a: "When you sign up at Kim's American Hospital / SwasthSaarthi with your email address, our system automatically generates a unique identifier (formatted as PID-XXXXXXXX). This ID serves as your permanent clinical key to link test results, inpatient admissions, and ABDM health records.",
    },
    {
      q: "Can I log in using either my Patient ID or my registered email?",
      a: "Yes! Our dual-credential authentication gateway allows you to log in securely with either your Patient ID (e.g. PID-10000001) or your email address along with your chosen password. You can also utilize instant demo OTP verification for quick evaluations.",
    },
    {
      q: "How does SwasthSaarthi safeguard my medical privacy?",
      a: "All diagnostic reports and encounter notes are stored conforming to HL7 FHIR R4 specifications. Third-party doctors or diagnostic labs cannot view your longitudinal history without your explicit, time-bounded, OTP-verified ABDM consent.",
    },
    {
      q: "What should I do in an emergency situation?",
      a: "Our Emergency & Trauma Centre is staffed 24/7 with emergency physicians, critical care nurses, and on-call trauma surgeons. You can reach our rapid hotline at +91 (800) 456-7890 or walk directly into our Main Hospital Campus at any hour.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1D1B] font-editorial-sans selection:bg-[#57477D]/15 selection:text-[#57477D]">
      {/* 1. TOP EDITORIAL NAVBAR (Sharp edges, exact layout & aesthetics from reference screenshot) */}
      <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EAE4D9]/80 transition-all duration-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Stylized Emblem */}
          <div className="flex items-center gap-3">
            <a
              href="#hero"
              className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.01]"
              aria-label="Kim's American Hospital Home"
            >
              {/* Stylized sharp emblem matching screenshot palette */}
              <div className="relative w-10 h-10 rounded-none bg-gradient-to-tr from-[#57477D] via-[#6F5E97] to-[#7EA89B] p-0.5 flex items-center justify-center shadow-xs">
                <div className="w-full h-full bg-[#FAF7F2] rounded-none flex items-center justify-center overflow-hidden">
                  <svg
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 transform group-hover:rotate-6 transition-transform duration-300"
                  >
                    <path
                      d="M6 18C6 11.3726 11.3726 6 18 6C18 12.6274 12.6274 18 6 18Z"
                      fill="#57477D"
                    />
                    <path
                      d="M26 14C26 20.6274 20.6274 26 14 26C14 19.3726 19.3726 14 26 14Z"
                      fill="#4E8C78"
                      fillOpacity="0.85"
                    />
                    <circle cx="16" cy="16" r="3.5" fill="#FAF7F2" />
                    <circle cx="16" cy="16" r="2" fill="#57477D" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="font-editorial-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1918] leading-none">
                  Kim's American Hospital
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wider text-[#69655E] uppercase mt-0.5">
                  SwasthSaarthi Network
                </span>
              </div>
            </a>
          </div>

          {/* Center: Editorial Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-[#2E2C2A]">
            <a
              href="#specialties"
              className="hover:text-[#57477D] transition-colors py-1 relative group"
            >
              Specialties
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#57477D] transition-all duration-200 group-hover:w-full" />
            </a>
            <a
              href="#care-edit"
              className="hover:text-[#57477D] transition-colors py-1 relative group"
            >
              The Care Edit
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#57477D] transition-all duration-200 group-hover:w-full" />
            </a>
            <a
              href="#records-lookup"
              className="hover:text-[#57477D] transition-colors py-1 relative group"
            >
              Health Records
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#57477D] transition-all duration-200 group-hover:w-full" />
            </a>
            <a
              href="#our-story"
              className="hover:text-[#57477D] transition-colors py-1 relative group"
            >
              Our Story
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#57477D] transition-all duration-200 group-hover:w-full" />
            </a>
            <a
              href="#faq"
              className="hover:text-[#57477D] transition-colors py-1 relative group"
            >
              FAQ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#57477D] transition-all duration-200 group-hover:w-full" />
            </a>
          </nav>

          {/* Right: Utility Icons and Sharp Action Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Heart / Saved Bookmark Icon (Sharp container) */}
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 rounded-none transition-all cursor-pointer ${
                isSaved
                  ? "text-rose-600 bg-rose-50"
                  : "text-[#2E2C2A] hover:text-[#57477D] hover:bg-[#EAE4D9]/40"
              }`}
              title="Saved Hospital Care Contexts"
              aria-label="Wishlist and saved care"
            >
              <Heart
                className={`w-5 h-5 ${isSaved ? "fill-rose-600" : ""}`}
                strokeWidth={1.8}
              />
            </button>

            {/* Login / Auth Icon (Sharp container) */}
            <button
              onClick={isAuthenticated ? onNavigateToDashboard : onOpenLogin}
              className="p-2 rounded-none text-[#2E2C2A] hover:text-[#57477D] hover:bg-[#EAE4D9]/40 transition-colors cursor-pointer"
              title={isAuthenticated ? "Open Dashboard" : "Sign In with Patient ID / Email"}
              aria-label="Authentication portal"
            >
              <LogIn className="w-5 h-5" strokeWidth={1.8} />
            </button>

            {/* Sharp Bordered Button matching 'WhatsApp Preorders' in screenshot */}
            {isAuthenticated ? (
              <button
                onClick={onNavigateToDashboard}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-none border border-[#2E2C2A] text-xs sm:text-sm font-medium text-[#1A1918] hover:bg-[#1A1918] hover:text-white transition-all duration-200 cursor-pointer shadow-2xs"
              >
                Go to Dashboard →
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-none border border-[#2E2C2A] text-xs sm:text-sm font-medium text-[#1A1918] hover:bg-[#1A1918] hover:text-white transition-all duration-200 cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <span>Patient Portal</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (With New Sunset Hospital Image & Sharp Edges) */}
      <section
        id="hero"
        className="relative overflow-hidden pt-6 pb-14 sm:py-16 lg:py-20 max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12"
      >
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Eyebrow, Dual-Font Headline, Description, Sharp Dark Button, Slash Specs */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center z-10">
            {/* Eyebrow Tag: 'POCKET DIARIES BY CUMID' style */}
            <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] text-[#716B82] uppercase">
                KIM'S AMERICAN HOSPITAL & SWASTH SAARTHI
              </span>
            </div>

            {/* Main Headline: Bold Modern Sans + Elegant Italic Serif */}
            <h1 className="font-editorial-sans text-4xl sm:text-6xl lg:text-[64px] font-extrabold text-[#191817] leading-[1.06] tracking-tight">
              Small diaries.
              <span className="block font-editorial-serif italic font-normal text-[#57477D] mt-1 sm:mt-2 text-4xl sm:text-6xl lg:text-[68px]">
                A little more you.
              </span>
            </h1>

            {/* Subtitle Paragraph matching editorial tone */}
            <p className="mt-5 sm:mt-7 text-sm sm:text-base lg:text-[17px] text-[#5C574F] leading-relaxed max-w-lg font-normal">
              For quiet reassurance, routine health checkups, and moments when you need
              world-class clinical expertise. Connected longitudinal health records,
              with care that truly feels like you.
            </p>

            {/* Action Buttons: Sharp dark rectangular button + Sharp Outline button */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={isAuthenticated ? onNavigateToDashboard : onOpenLogin}
                className="px-7 sm:px-9 py-4 rounded-none bg-[#1A1918] text-white hover:bg-[#2E2C2A] transition-all duration-200 font-medium text-sm sm:text-base flex items-center gap-2.5 shadow-sm group cursor-pointer"
              >
                <span>{isAuthenticated ? "Enter Patient Portal" : "Explore our care"}</span>
                <ArrowUpRight className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <a
                href="#records-lookup"
                className="px-6 py-4 rounded-none border border-[#1A1918] text-[#1A1918] hover:bg-[#EAE4D9]/40 transition-colors font-medium text-sm sm:text-base cursor-pointer"
              >
                Verify by Patient ID
              </a>
            </div>

            {/* Bottom Specs Row with slash delimiters matching reference screenshot */}
            <div className="mt-10 sm:mt-14 pt-6 border-t border-[#EAE4D9]/80 flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs sm:text-sm font-medium text-[#7A746B]">
              <span>Square pocket format</span>
              <span className="text-[#BDB6A8]">/</span>
              <span>Top spiral binding</span>
              <span className="text-[#BDB6A8]">/</span>
              <span>ABDM & FHIR R4 Ready</span>
            </div>
          </div>

          {/* Right Column: New Hospital Entrance at Sunset with Sharp Architectural Frame */}
          <div className="lg:col-span-6 xl:col-span-7 relative">
            <div className="relative rounded-none overflow-hidden shadow-[0_16px_40px_rgba(40,32,24,0.12)] border border-[#EAE4D9] bg-[#EAE4D9]/30">
              {/* Left & Ambient Gradient Overlays for Natural Blend */}
              <div className="absolute inset-0 z-10 pointer-events-none hidden lg:block bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/25 to-transparent w-1/4" />
              <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-[#FAF7F2]/30 via-transparent to-transparent h-1/4 bottom-0" />

              {/* Modern Hospital Entrance at Sunset Photograph */}
              <img
                src="/hospital.png"
                alt="Kim's American Hospital Modern Entrance at Sunset"
                className="w-full h-[380px] sm:h-[480px] lg:h-[540px] object-cover object-center transform hover:scale-[1.01] transition-transform duration-700"
              />

              {/* Sharp Architectural Corner Badge */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20 bg-[#FAF7F2]/95 backdrop-blur-md px-4 py-2.5 rounded-none border border-[#1A1918]/15 shadow-xs flex items-center gap-2.5 text-xs sm:text-sm text-[#1A1918]">
                <div className="w-2 h-2 rounded-none bg-emerald-500 animate-pulse" />
                <span className="font-semibold">Kim's American Hospital</span>
                <span className="text-[#7A746B] hidden sm:inline">· Sunset Entrance Pavilion</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE CARE EDIT (Sharp rectangular boxes matching 'THE COVER EDIT') */}
      <section id="care-edit" className="py-16 sm:py-24 border-t border-[#EAE4D9] bg-[#FAF7F2]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14 pb-4 border-b border-[#EAE4D9]">
            <div>
              <span className="text-xs font-semibold tracking-[0.25em] text-[#716B82] uppercase">
                THE CARE EDIT
              </span>
              <h2 className="font-editorial-serif text-3xl sm:text-4xl text-[#191817] font-normal mt-1.5">
                Curated clinical excellence, tailored to you.
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#7A746B] max-w-xs">
              Every department connects seamlessly to your centralized longitudinal health record.
            </p>
          </div>

          {/* Sharp Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialties.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-none p-6 sm:p-7 border border-[#EAE4D9] hover:border-[#1A1918] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(26,25,24,0.06)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-semibold tracking-wider text-[#57477D] bg-[#57477D]/8 px-2.5 py-1 rounded-none border border-[#57477D]/15">
                        {item.tag}
                      </span>
                      <div className="w-9 h-9 rounded-none bg-[#FAF7F2] border border-[#EAE4D9] flex items-center justify-center text-[#57477D] group-hover:bg-[#1A1918] group-hover:text-white group-hover:border-[#1A1918] transition-colors duration-200">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <h3 className="font-editorial-serif text-xl sm:text-2xl font-normal text-[#191817] mb-2.5 group-hover:text-[#57477D] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#615C54] leading-relaxed mb-6 font-normal">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#F0ECE1] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#191817]">{item.stat}</div>
                      <div className="text-[#8A8479]">{item.doctors}</div>
                    </div>
                    <button
                      onClick={onOpenLogin}
                      className="p-2 rounded-none bg-[#FAF7F2] border border-[#EAE4D9] text-[#191817] group-hover:bg-[#191817] group-hover:text-white group-hover:border-[#1A1918] transition-all cursor-pointer"
                      title="Explore department"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE PATIENT ID & RECORD LOOKUP WIDGET (Sharp Div Edges) */}
      <section id="records-lookup" className="py-16 sm:py-20 bg-[#F4EFE6] border-y border-[#EAE4D9]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="bg-white rounded-none p-6 sm:p-10 lg:p-12 border border-[#E4DDD0] shadow-[0_12px_32px_rgba(40,32,24,0.05)]">
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Context & Patient ID Explanation */}
              <div className="lg:col-span-5">
                <span className="text-[11px] font-semibold tracking-[0.2em] text-[#57477D] uppercase">
                  UNIFIED PATIENT ACCESS
                </span>
                <h2 className="font-editorial-serif text-2xl sm:text-3xl text-[#191817] font-medium mt-1 mb-3">
                  Inspect records using your Patient ID.
                </h2>
                <p className="text-xs sm:text-sm text-[#615C54] leading-relaxed mb-6">
                  Every patient registered at Kim's American Hospital receives a unique identifier
                  (like <code className="font-mono font-semibold text-[#57477D]">PID-10000001</code>).
                  Test the real-time lookup below to verify how clinical data is retrieved.
                </p>

                <div className="p-4 rounded-none bg-[#FAF7F2] border border-[#EAE4D9] text-xs space-y-2">
                  <div className="flex items-center gap-2 text-[#57477D] font-medium">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Instant Demo Key Available</span>
                  </div>
                  <p className="text-[#6E685F]">
                    Click to load Rahul Verma's verified ABDM clinical timeline and record count:
                  </p>
                  <button
                    onClick={() => {
                      setLookupPid("PID-10000001");
                      handleLookupPatient("PID-10000001");
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-[#57477D] text-white font-medium hover:bg-[#483969] transition-colors cursor-pointer text-xs"
                  >
                    <span>Load Demo PID-10000001</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Sharp Live Search Form & Live Results */}
              <div className="lg:col-span-7">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#8A8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={lookupPid}
                      onChange={(e) => setLookupPid(e.target.value)}
                      placeholder="e.g. PID-10000001"
                      className="w-full pl-10 pr-4 py-3 rounded-none border border-[#D5CEC2] bg-[#FAF7F2] text-sm text-[#191817] focus:outline-none focus:border-[#1A1918] focus:ring-1 focus:ring-[#1A1918] font-mono"
                    />
                  </div>
                  <button
                    onClick={() => handleLookupPatient()}
                    disabled={isSearching}
                    className="px-6 py-3 rounded-none bg-[#1A1918] text-white hover:bg-[#2E2C2A] transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-none animate-spin" />
                        <span>Fetching...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Fetch Info</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Error Banner */}
                {lookupError && (
                  <div className="p-4 rounded-none bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-4">
                    {lookupError}
                  </div>
                )}

                {/* Results Card with Sharp Edges */}
                {patientLookupResult && (
                  <div className="p-5 sm:p-6 rounded-none bg-[#FAF7F2] border border-[#EAE4D9] space-y-4 animate-in fade-in duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EAE4D9]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-none bg-[#57477D]/15 text-[#57477D] font-bold text-sm flex items-center justify-center border border-[#57477D]/20">
                          {patientLookupResult.patient?.name?.[0] || "P"}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-[#191817]">
                            {patientLookupResult.patient?.name}
                          </h4>
                          <div className="text-xs text-[#7A746B] flex items-center gap-2">
                            <span>{patientLookupResult.patient?.gender || "Male"}</span>
                            <span>·</span>
                            <span>{patientLookupResult.patient?.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-none bg-[#57477D]/10 text-[#57477D] border border-[#57477D]/20">
                          {patientLookupResult.patient?.patientId}
                        </span>
                        <button
                          onClick={() => copyToClipboard(patientLookupResult.patient?.patientId)}
                          className="p-1.5 text-[#7A746B] hover:text-[#191817] cursor-pointer"
                          title="Copy Patient ID"
                        >
                          {copiedPid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Stats Row with Sharp Corners */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-none border border-[#EAE4D9] text-center">
                        <div className="text-xs text-[#7A746B]">ABDM Care Contexts</div>
                        <div className="font-bold text-base text-[#191817] mt-0.5">
                          {patientLookupResult.stats?.careContextCount ?? 3}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-none border border-[#EAE4D9] text-center">
                        <div className="text-xs text-[#7A746B]">Verified Reports</div>
                        <div className="font-bold text-base text-[#191817] mt-0.5">
                          {patientLookupResult.stats?.healthRecordCount ?? 12}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-none border border-[#EAE4D9] text-center">
                        <div className="text-xs text-[#7A746B]">Active Consents</div>
                        <div className="font-bold text-base text-[#57477D] mt-0.5">
                          {patientLookupResult.stats?.activeConsentCount ?? 2}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-[#7A746B]">
                        ABDM Health ID (ABHA): {patientLookupResult.patient?.abhaAddress || "91-9876543210@abdm"}
                      </span>
                      <button
                        onClick={onOpenLogin}
                        className="text-xs font-medium text-[#57477D] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Sign in to view full history →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EDITORIAL PILLARS / OUR STORY (Sharp Cards) */}
      <section id="our-story" className="py-20 sm:py-28 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <span className="text-xs font-semibold tracking-[0.22em] text-[#716B82] uppercase">
              ABOUT OUR CAMPUS
            </span>
            <h2 className="font-editorial-serif text-3xl sm:text-5xl text-[#191817] font-normal mt-2 mb-6 leading-tight">
              Hospitality meets world-class clinical precision.
            </h2>
            <p className="text-sm sm:text-base text-[#615C54] leading-relaxed mb-6 font-normal">
              Founded on the belief that healthcare should feel calm, humane, and deeply personal,
              Kim's American Hospital integrates international medical standards with modern
              digital health infrastructure powered by SwasthSaarthi.
            </p>
            <p className="text-sm sm:text-base text-[#615C54] leading-relaxed mb-8 font-normal">
              Whether you are here for preventive cardiology, outpatient pediatric wellness,
              or specialized surgical care, our campus provides an unhurried, reassuring environment
              where your health story is always heard.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#EAE4D9]">
              <div>
                <div className="font-editorial-serif text-2xl sm:text-3xl text-[#57477D]">350+</div>
                <div className="text-xs text-[#7A746B] mt-1">Specialized Care Beds</div>
              </div>
              <div>
                <div className="font-editorial-serif text-2xl sm:text-3xl text-[#57477D]">100%</div>
                <div className="text-xs text-[#7A746B] mt-1">FHIR R4 & ABDM Integrated</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
            <div className="bg-white p-7 rounded-none border border-[#EAE4D9] space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#FAF7F2] border border-[#EAE4D9] flex items-center justify-center text-[#57477D]">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-editorial-serif text-xl text-[#191817]">JCI & NABH Accreditation</h3>
              <p className="text-xs sm:text-sm text-[#69655E] leading-relaxed">
                Adhering to the most rigorous international clinical protocols and patient safety measures.
              </p>
            </div>

            <div className="bg-white p-7 rounded-none border border-[#EAE4D9] space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#FAF7F2] border border-[#EAE4D9] flex items-center justify-center text-[#57477D]">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-editorial-serif text-xl text-[#191817]">24/7 Rapid Emergency</h3>
              <p className="text-xs sm:text-sm text-[#69655E] leading-relaxed">
                State-of-the-art Level 1 trauma facilities, rapid catheterization response, and ICU transport.
              </p>
            </div>

            <div className="bg-white p-7 rounded-none border border-[#EAE4D9] space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#FAF7F2] border border-[#EAE4D9] flex items-center justify-center text-[#57477D]">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-editorial-serif text-xl text-[#191817]">Dedicated Care Pavilions</h3>
              <p className="text-xs sm:text-sm text-[#69655E] leading-relaxed">
                Quiet suites, landscaped healing gardens, and sunlit recovery wings designed for peace of mind.
              </p>
            </div>

            <div className="bg-white p-7 rounded-none border border-[#EAE4D9] space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#FAF7F2] border border-[#EAE4D9] flex items-center justify-center text-[#57477D]">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-editorial-serif text-xl text-[#191817]">Patient-First Consent</h3>
              <p className="text-xs sm:text-sm text-[#69655E] leading-relaxed">
                You retain complete autonomy over which medical records are shared with external practitioners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS (Sharp Accordion) */}
      <section id="faq" className="py-20 bg-[#F4EFE6] border-t border-[#EAE4D9]">
        <div className="max-w-[960px] mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-[0.25em] text-[#716B82] uppercase">
              HELP & GUIDANCE
            </span>
            <h2 className="font-editorial-serif text-3xl sm:text-4xl text-[#191817] font-normal mt-1.5">
              Frequently asked questions.
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-none border border-[#EAE4D9] overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF7F2]/50"
                  >
                    <span className="font-editorial-serif text-base sm:text-lg text-[#191817] font-medium">
                      {faq.q}
                    </span>
                    <span className={`text-xl font-light text-[#57477D] transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}>
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-[#615C54] leading-relaxed border-t border-[#F0ECE1]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. EDITORIAL FOOTER (Sharp Architecture) */}
      <footer className="bg-[#FAF7F2] border-t border-[#EAE4D9] pt-16 pb-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#EAE4D9]">
            {/* Brand column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-none bg-gradient-to-tr from-[#57477D] to-[#7EA89B] flex items-center justify-center p-0.5">
                  <div className="w-full h-full bg-[#FAF7F2] rounded-none flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-none bg-[#57477D]" />
                  </div>
                </div>
                <span className="font-editorial-serif text-xl font-bold text-[#191817]">
                  Kim's American Hospital
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#6E685F] leading-relaxed max-w-sm">
                Excellence in clinical care, modern patient hospitality, and secure longitudinal health
                records powered by the SwasthSaarthi platform.
              </p>
              <div className="flex items-center gap-3 text-xs text-[#7A746B] pt-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#57477D]" />
                  Main Campus, Healthcare Boulevard
                </span>
              </div>
            </div>

            {/* Links column: Clinical */}
            <div className="lg:col-span-2 space-y-3">
              <h5 className="text-xs font-semibold tracking-wider text-[#191817] uppercase">
                Care Divisions
              </h5>
              <ul className="text-xs sm:text-sm text-[#6E685F] space-y-2">
                <li><a href="#specialties" className="hover:text-[#57477D]">Cardiovascular</a></li>
                <li><a href="#specialties" className="hover:text-[#57477D]">Oncology</a></li>
                <li><a href="#specialties" className="hover:text-[#57477D]">Neurosciences</a></li>
                <li><a href="#specialties" className="hover:text-[#57477D]">Pediatrics</a></li>
                <li><a href="#specialties" className="hover:text-[#57477D]">Emergency & Trauma</a></li>
              </ul>
            </div>

            {/* Links column: Patient Access */}
            <div className="lg:col-span-2 space-y-3">
              <h5 className="text-xs font-semibold tracking-wider text-[#191817] uppercase">
                Patient Portal
              </h5>
              <ul className="text-xs sm:text-sm text-[#6E685F] space-y-2">
                <li><button onClick={onOpenLogin} className="hover:text-[#57477D] text-left cursor-pointer">Login with PID</button></li>
                <li><button onClick={onOpenLogin} className="hover:text-[#57477D] text-left cursor-pointer">New Patient Sign Up</button></li>
                <li><a href="#records-lookup" className="hover:text-[#57477D]">Lookup Records</a></li>
                <li><a href="#faq" className="hover:text-[#57477D]">Consent Privacy</a></li>
              </ul>
            </div>

            {/* Emergency & Support Column */}
            <div className="lg:col-span-3 space-y-3">
              <h5 className="text-xs font-semibold tracking-wider text-[#191817] uppercase">
                24/7 Helpline & Concierge
              </h5>
              <p className="text-xs text-[#6E685F]">
                Reach our emergency response coordination team or WhatsApp concierge:
              </p>
              <div className="pt-1">
                <a
                  href="tel:+918004567890"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#191817] hover:text-[#57477D]"
                >
                  <Phone className="w-4 h-4 text-[#57477D]" />
                  <span>+91 (800) 456-7890</span>
                </a>
              </div>
              <div className="pt-2">
                <button
                  onClick={onOpenLogin}
                  className="w-full py-3 px-4 rounded-none border border-[#1A1918] bg-[#1A1918] text-white text-xs font-medium hover:bg-[#2E2C2A] transition-colors cursor-pointer"
                >
                  Sign In / Register Portal
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A8479]">
            <div>
              © 2026 Kim's American Hospital & SwasthSaarthi. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <span>FHIR R4 Standardized</span>
              <span>•</span>
              <span>ABDM Ayushman Bharat Ready</span>
              <span>•</span>
              <span>ISO 27001 Certified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
