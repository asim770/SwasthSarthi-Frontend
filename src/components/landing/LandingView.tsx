import React, { useState, useEffect } from "react";
import {
  LogIn,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  FileText,
  Stethoscope,
  Clock,
  Menu,
  X,
  FlaskConical,
  Pill,
  UserCheck,
  Lock,
  CheckCircle2,
  Layers,
  ArrowRight,
  HeartPulse,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface LandingViewProps {
  onOpenLogin: () => void;
  onNavigateToDashboard: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenLogin,
  onNavigateToDashboard,
}) => {
  const { isAuthenticated } = useAuth();

  // Mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Scroll detection to mix navbar with hero image initially and separate on scroll
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // 4 Core Roles in SwaasthSaarthi
  const platformRoles = [
    {
      id: "patient",
      title: "Patient & Citizen",
      badge: "LIFETIME HEALTH VAULT",
      badgeColor: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",
      icon: UserCheck,
      desc: "Every citizen receives a lifelong Patient ID (PID-XXXXXXXX). Store diagnostic reports, view prescription logs, and grant or revoke time-bound doctor access with 1 click.",
      highlights: [
        "Unique lifelong Patient ID (PID)",
        "Direct ABDM ABHA linking",
        "Zero-knowledge consent control",
      ],
      actionText: "Open Patient Portal",
    },
    {
      id: "doctor",
      title: "Doctor & Specialist",
      badge: "CLINICAL WORKSTATION",
      badgeColor: "text-[#0F766E] bg-[#F0F7F6] border-[#D0E5E1]",
      icon: Stethoscope,
      desc: "Review patient longitudinal medical history across all network facilities. Author FHIR-compliant encounter notes, write digital prescriptions, and order diagnostic labs.",
      highlights: [
        "Chronological clinical timeline",
        "Cross-facility historical review",
        "Instant digital e-prescriptions",
      ],
      actionText: "Doctor Workstation",
    },
    {
      id: "laboratory",
      title: "Diagnostic Laboratory",
      badge: "DIAGNOSTIC ENGINE",
      badgeColor: "text-amber-800 bg-amber-50 border-amber-200",
      icon: FlaskConical,
      desc: "Publish diagnostic findings, pathology observations, and radiology reports directly to the patient's record using their unique Patient ID.",
      highlights: [
        "PID-linked report dispatch",
        "HL7 FHIR R4 Observations",
        "Automated patient alert triggers",
      ],
      actionText: "Laboratory Access",
    },
    {
      id: "pharmacy",
      title: "Pharmacy & Dispensary",
      badge: "DISPENSATION SYSTEM",
      badgeColor: "text-emerald-800 bg-emerald-50 border-emerald-200",
      icon: Pill,
      desc: "Validate digital doctor prescriptions instantly. Record medication dispensation logs and prevent adverse drug interactions across ongoing care plans.",
      highlights: [
        "Tamper-proof prescription verification",
        "Fulfillment & dispensation logs",
        "Drug-to-drug interaction checks",
      ],
      actionText: "Pharmacy Portal",
    },
  ];

  // Clinical Specialties
  const specialties = [
    {
      id: "cardio",
      tag: "CENTRE OF EXCELLENCE",
      title: "Heart & Vascular Institute",
      desc: "Interventional cardiology, non-invasive cardiac imaging, electrophysiology, and 24/7 dedicated STEMI catheterization response.",
      icon: Activity,
      stat: "99.4% Survival Rate",
      doctors: "14 Senior Cardiologists",
    },
    {
      id: "oncology",
      tag: "PRECISION ONCOLOGY",
      title: "Comprehensive Cancer Centre",
      desc: "Multi-disciplinary tumor boards, image-guided linear accelerators, precision immunotherapy, and organ-preserving surgical oncology.",
      icon: HeartPulse,
      stat: "1,200+ Remissions",
      doctors: "9 Surgical Oncologists",
    },
    {
      id: "neuro",
      tag: "ADVANCED NEUROSCIENCES",
      title: "Brain & Spine Sciences",
      desc: "Minimally invasive neurosurgery, comprehensive stroke care unit, neuro-rehabilitation, and pediatric neurology.",
      icon: ShieldCheck,
      stat: "<30m Door-to-Needle",
      doctors: "11 Neurologists & Surgeons",
    },
    {
      id: "vault",
      tag: "DIGITAL HEALTH & ABDM",
      title: "Longitudinal Health Vault",
      desc: "FHIR R4 standardized diagnostic reports, prescriptions, and encrypted consent-driven data exchange with SwaasthSaarthi.",
      icon: FileText,
      stat: "Instant FHIR Sync",
      doctors: "Ayushman Bharat Certified",
    },
  ];

  const faqs = [
    {
      q: "How is my unique Patient ID (PID) assigned upon registration?",
      a: "When you sign up on SwaasthSaarthi with your email address or Google authentication, our system automatically generates a unique identifier (formatted as PID-XXXXXXXX). This ID serves as your permanent clinical key to link test results, prescriptions, inpatient encounters, and ABDM health records across all network facilities.",
    },
    {
      q: "Can I log in using either my Patient ID or my registered email?",
      a: "Yes! Our dual-credential authentication gateway allows you to log in securely with either your Patient ID or your registered email address along with your chosen password.",
    },
    {
      q: "How do doctors, laboratories, and pharmacies collaborate?",
      a: "Every care touchpoint uses the patient's unique Patient ID. When a doctor writes a prescription or orders a test, it is linked to the patient's PID. Diagnostic laboratories submit reports directly to that PID, and pharmacies verify and dispense medications against it—creating one unified, tamper-evident longitudinal health chart.",
    },
    {
      q: "How does SwaasthSaarthi safeguard my medical privacy?",
      a: "All diagnostic reports and encounter notes are stored conforming to HL7 FHIR R4 specifications. Practitioners or diagnostic labs cannot view your longitudinal history without your explicit, time-bounded, OTP-verified ABDM consent, which you can revoke at any time.",
    },
    {
      q: "What should I do in an emergency situation?",
      a: "Our Emergency & Trauma Centre coordination network is staffed 24/7 with emergency physicians and critical care specialists. You can reach our rapid hotline at +91 (800) 456-7890 or walk directly into any network hospital campus at any hour.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F0F7F6] text-[#1E1D1B] font-editorial-sans selection:bg-[#0F766E]/15 selection:text-[#0F766E]">
      {/* 1. TOP EDITORIAL NAVBAR */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          isScrolled
            ? "bg-[#F0F7F6]/92 backdrop-blur-md border-b border-[#D0E5E1] shadow-[0_8px_30px_rgba(15,118,110,0.08)] py-0"
            : "bg-transparent border-b border-transparent py-2 sm:py-3"
        }`}
      >
        <div
          className={`max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-4 transition-all duration-300 ease-in-out ${
            isScrolled ? "h-16 sm:h-18" : "h-20 sm:h-22"
          }`}
        >
          {/* Left: Brand Logo & Stylized Emblem */}
          <div className="flex items-center gap-3">
            <a
              href="#hero"
              className="group flex items-center gap-3 transition-transform duration-200 hover:scale-[1.01]"
              aria-label="SwaasthSaarthi Home"
            >
              {/* Stylized sharp emblem */}
              <div
                className={`relative w-10 h-10 rounded-none bg-gradient-to-tr from-[#0F766E] via-[#14B8A6] to-[#5EEAD4] p-0.5 flex items-center justify-center transition-all duration-300 ${
                  isScrolled ? "shadow-xs" : "shadow-md ring-1 ring-white/60"
                }`}
              >
                <div
                  className={`w-full h-full rounded-none flex items-center justify-center overflow-hidden transition-colors duration-300 ${
                    isScrolled ? "bg-[#F0F7F6]" : "bg-white/95 backdrop-blur-xs"
                  }`}
                >
                  <svg
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 transform group-hover:rotate-6 transition-transform duration-300"
                  >
                    <path
                      d="M6 18C6 11.3726 11.3726 6 18 6C18 12.6274 12.6274 18 6 18Z"
                      fill="#0F766E"
                    />
                    <path
                      d="M26 14C26 20.6274 20.6274 26 14 26C14 19.3726 19.3726 14 26 14Z"
                      fill="#4E8C78"
                      fillOpacity="0.85"
                    />
                    <circle cx="16" cy="16" r="3.5" fill="#F0F7F6" />
                    <circle cx="16" cy="2" fill="#0F766E" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="font-editorial-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1918] leading-none">
                  SwaasthSaarthi
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wider text-[#69655E] uppercase mt-0.5">
                  Unified Healthcare Network
                </span>
              </div>
            </a>
          </div>

          {/* Center: Editorial Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold transition-colors duration-200">
            <a
              href="#ecosystem"
              className="text-[#132E2B] hover:text-[#0F766E] transition-colors py-1 relative group"
            >
              Role Ecosystem
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F766E] transition-all duration-200 group-hover:w-full" />
            </a>
            <a
              href="#specialties"
              className="text-[#132E2B] hover:text-[#0F766E] transition-colors py-1 relative group"
            >
              Centres of Care
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F766E] transition-all duration-200 group-hover:w-full" />
            </a>
            <a
              href="#architecture"
              className="text-[#132E2B] hover:text-[#0F766E] transition-colors py-1 relative group"
            >
              Architecture
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F766E] transition-all duration-200 group-hover:w-full" />
            </a>
            <a
              href="#faq"
              className="text-[#132E2B] hover:text-[#0F766E] transition-colors py-1 relative group"
            >
              FAQ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F766E] transition-all duration-200 group-hover:w-full" />
            </a>
          </nav>

          {/* Right: Sharp Action Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isAuthenticated ? (
              <button
                onClick={onNavigateToDashboard}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-none border border-[#1A1918] bg-[#1A1918] text-white hover:bg-[#2E2C2A] text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer shadow-2xs flex items-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-none border border-[#1A1918] bg-[#1A1918] text-white hover:bg-[#2E2C2A] text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer shadow-2xs flex items-center gap-2"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Patient Portal</span>
              </button>
            )}

            {/* Mobile Navigation Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-none text-[#2E2C2A] hover:bg-[#D0E5E1]/40 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#D0E5E1] bg-[#F0F7F6]/98 backdrop-blur-md px-6 py-4 space-y-3">
            <a
              href="#ecosystem"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#2E2C2A] hover:text-[#0F766E] py-1.5"
            >
              Role Ecosystem
            </a>
            <a
              href="#specialties"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#2E2C2A] hover:text-[#0F766E] py-1.5"
            >
              Centres of Care
            </a>
            <a
              href="#architecture"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#2E2C2A] hover:text-[#0F766E] py-1.5"
            >
              Architecture
            </a>
            <a
              href="#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#2E2C2A] hover:text-[#0F766E] py-1.5"
            >
              FAQ
            </a>
          </div>
        )}
      </header>

      {/* 2. FULL-BLEED EDITORIAL HERO SECTION */}
      <section
        id="hero"
        className="relative w-full min-h-[640px] sm:min-h-[700px] lg:min-h-[780px] flex items-center bg-cover bg-no-repeat overflow-hidden border-b border-[#D0E5E1]/80 pt-20 sm:pt-24"
        style={{
          backgroundImage: `
            linear-gradient(
              90deg,
              rgba(240, 247, 246, 0.98) 0%,
              rgba(240, 247, 246, 0.94) 30%,
              rgba(240, 247, 246, 0.72) 44%,
              rgba(240, 247, 246, 0.22) 58%,
              rgba(240, 247, 246, 0.02) 75%
            ),
            url('/images/hospital-hero-wide.png')
          `,
          backgroundPosition: "right center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Soft responsive vertical gradient for mobile screens */}
        <div
          className="absolute inset-0 pointer-events-none lg:hidden bg-gradient-to-b from-[#F0F7F6]/98 via-[#F0F7F6]/92 to-[#F0F7F6]/45"
          aria-hidden="true"
        />

        {/* Content Container */}
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-8 lg:px-12 pt-8 pb-16 sm:pt-12 sm:pb-24 lg:pt-16 lg:pb-28 relative z-10">
          <div className="max-w-[520px] flex flex-col justify-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] text-[#0F766E] uppercase">
                SWAASTHSAARTHI HEALTHCARE NETWORK
              </span>
            </div>

            {/* Main Headline: Bold Modern Sans + Elegant Purple Italic Serif */}
            <h1 className="font-editorial-sans text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[#191817] leading-[1.08] tracking-tight">
              Small moments.
              <span className="block font-editorial-serif italic font-normal text-[#0F766E] mt-1 sm:mt-1.5 text-4xl sm:text-5xl lg:text-[60px]">
                A little more you.
              </span>
            </h1>

            {/* Subtitle Paragraph matching editorial tone & clinical purpose */}
            <p className="mt-5 sm:mt-7 text-sm sm:text-base lg:text-[17px] text-[#5C574F] leading-relaxed max-w-lg font-normal">
              A unified, connected healthcare network for routine checkups, diagnostic reports, and specialized clinical care. One lifelong Patient ID, zero-friction medical records across every care provider.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={isAuthenticated ? onNavigateToDashboard : onOpenLogin}
                className="px-7 sm:px-9 py-4 rounded-none bg-[#1A1918] text-white hover:bg-[#2E2C2A] transition-all duration-200 font-medium text-sm sm:text-base flex items-center gap-2.5 shadow-sm group cursor-pointer"
              >
                <span>{isAuthenticated ? "Enter Patient Portal" : "Explore our care"}</span>
                <ArrowUpRight className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <a
                href="#ecosystem"
                className="px-6 py-4 rounded-none border border-[#1A1918] text-[#1A1918] hover:bg-[#D0E5E1]/40 transition-colors font-medium text-sm sm:text-base cursor-pointer"
              >
                Explore Care Ecosystem
              </a>
            </div>

            {/* Genuine Healthcare Credibility Specs Row */}
            <div className="mt-10 sm:mt-14 pt-6 border-t border-[#D0E5E1]/80 flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-[#6B655B]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                Lifelong Patient ID (PID)
              </span>
              <span className="text-[#A5C7C0]">/</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4E8C78]" />
                ABDM M1-M3 Certified
              </span>
              <span className="text-[#A5C7C0]">/</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                HL7 FHIR R4 Standardized
              </span>
              <span className="text-[#A5C7C0]">/</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Zero-Knowledge Consent
              </span>
            </div>
          </div>
        </div>

        {/* Subtle Architectural Corner Badge over hospital building */}
        <div className="hidden xl:flex absolute bottom-8 right-12 z-10 bg-[#F0F7F6]/90 backdrop-blur-md px-4 py-2.5 rounded-none border border-[#1A1918]/15 shadow-xs items-center gap-2.5 text-xs text-[#1A1918]">
          <div className="w-2 h-2 rounded-none bg-emerald-500 animate-pulse" />
          <span className="font-semibold">SwaasthSaarthi</span>
          <span className="text-[#7A746B]">· Integrated Healthcare Network</span>
        </div>
      </section>

      {/* 3. ROLE-BASED HEALTHCARE ECOSYSTEM SECTION */}
      <section id="ecosystem" className="scroll-mt-20 sm:scroll-mt-24 py-16 sm:py-24 bg-white border-b border-[#D0E5E1]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14 pb-4 border-b border-[#D0E5E1]">
            <div>
              <span className="text-xs font-semibold tracking-[0.25em] text-[#0F766E] uppercase">
                ROLE-BASED HEALTHCARE ECOSYSTEM
              </span>
              <h2 className="font-editorial-serif text-3xl sm:text-4xl text-[#191817] font-normal mt-1.5">
                One universal patient record. Four synchronized roles.
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#7A746B] max-w-sm">
              SwaasthSaarthi connects patients, doctors, diagnostic labs, and pharmacies into one consent-driven network.
            </p>
          </div>

          {/* 4 Roles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformRoles.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.id}
                  className="group bg-[#F0F7F6] rounded-none p-6 sm:p-7 border border-[#D0E5E1] hover:border-[#1A1918] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(26,25,24,0.06)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-none border ${role.badgeColor}`}>
                        {role.badge}
                      </span>
                      <div className="w-10 h-10 rounded-none bg-white border border-[#D0E5E1] flex items-center justify-center text-[#1A1918] group-hover:bg-[#1A1918] group-hover:text-white group-hover:border-[#1A1918] transition-colors duration-200">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="font-editorial-serif text-xl sm:text-2xl font-normal text-[#191817] mb-2.5 group-hover:text-[#0F766E] transition-colors">
                      {role.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#615C54] leading-relaxed mb-5 font-normal">
                      {role.desc}
                    </p>

                    {/* Key feature highlights */}
                    <div className="space-y-2 mb-6">
                      {role.highlights.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-[#524E48]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4E8C78] shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#D0E5E1]/80">
                    <button
                      onClick={onOpenLogin}
                      className="w-full py-2.5 px-3 rounded-none bg-white border border-[#B6D6D0] text-xs font-medium text-[#1A1918] group-hover:bg-[#1A1918] group-hover:text-white group-hover:border-[#1A1918] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <span>{role.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. CENTRES OF CLINICAL EXCELLENCE */}
      <section id="specialties" className="scroll-mt-20 sm:scroll-mt-24 py-16 sm:py-24 border-b border-[#D0E5E1] bg-[#F0F7F6]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14 pb-4 border-b border-[#D0E5E1]">
            <div>
              <span className="text-xs font-semibold tracking-[0.25em] text-[#0F766E] uppercase">
                CENTRES OF CLINICAL EXCELLENCE
              </span>
              <h2 className="font-editorial-serif text-3xl sm:text-4xl text-[#191817] font-normal mt-1.5">
                Curated clinical excellence, connected to you.
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#7A746B] max-w-xs">
              Every clinical division connects seamlessly to your centralized longitudinal health record.
            </p>
          </div>

          {/* Sharp Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialties.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-none p-6 sm:p-7 border border-[#D0E5E1] hover:border-[#1A1918] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(26,25,24,0.06)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-semibold tracking-wider text-[#0F766E] bg-[#0F766E]/8 px-2.5 py-1 rounded-none border border-[#0F766E]/15">
                        {item.tag}
                      </span>
                      <div className="w-9 h-9 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] flex items-center justify-center text-[#0F766E] group-hover:bg-[#1A1918] group-hover:text-white group-hover:border-[#1A1918] transition-colors duration-200">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <h3 className="font-editorial-serif text-xl sm:text-2xl font-normal text-[#191817] mb-2.5 group-hover:text-[#0F766E] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#615C54] leading-relaxed mb-6 font-normal">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E1EFEA] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#191817]">{item.stat}</div>
                      <div className="text-[#8A8479]">{item.doctors}</div>
                    </div>
                    <button
                      onClick={onOpenLogin}
                      className="p-2 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] text-[#191817] group-hover:bg-[#191817] group-hover:text-white group-hover:border-[#1A1918] transition-all cursor-pointer"
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

      {/* 5. PLATFORM ARCHITECTURE & STANDARDS */}
      <section id="architecture" className="scroll-mt-20 sm:scroll-mt-24 py-20 sm:py-28 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <span className="text-xs font-semibold tracking-[0.22em] text-[#0F766E] uppercase">
              PLATFORM ARCHITECTURE & STANDARDS
            </span>
            <h2 className="font-editorial-serif text-3xl sm:text-5xl text-[#191817] font-normal mt-2 mb-6 leading-tight">
              Enterprise-grade digital health infrastructure.
            </h2>
            <p className="text-sm sm:text-base text-[#615C54] leading-relaxed mb-6 font-normal">
              SwaasthSaarthi integrates international clinical informatics with national digital health standards for safe, consent-driven care coordination across all healthcare providers.
            </p>
            <p className="text-sm sm:text-base text-[#615C54] leading-relaxed mb-8 font-normal">
              Whether you are an outpatient visiting a local clinic, undergoing specialized surgery, or receiving lab diagnostics, your longitudinal record remains continuous, encrypted, and completely under your control.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#D0E5E1]">
              <div>
                <div className="font-editorial-serif text-2xl sm:text-3xl text-[#0F766E]">50+</div>
                <div className="text-xs text-[#7A746B] mt-1">Network Care Facilities</div>
              </div>
              <div>
                <div className="font-editorial-serif text-2xl sm:text-3xl text-[#0F766E]">100%</div>
                <div className="text-xs text-[#7A746B] mt-1">FHIR R4 & ABDM Integrated</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
            <div className="bg-white p-7 rounded-none border border-[#D0E5E1] space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] flex items-center justify-center text-[#0F766E]">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-editorial-serif text-xl text-[#191817]">HL7 FHIR R4 Standards</h3>
              <p className="text-xs sm:text-sm text-[#69655E] leading-relaxed">
                Standardized diagnostic reports, encounter notes, and medication plans interoperable with modern electronic health record systems.
              </p>
            </div>

            <div className="bg-white p-7 rounded-none border border-[#D0E5E1] space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] flex items-center justify-center text-[#0F766E]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-editorial-serif text-xl text-[#191817]">ABDM Ayushman Bharat</h3>
              <p className="text-xs sm:text-sm text-[#69655E] leading-relaxed">
                Full compliance with National Digital Health Mission Milestone 1 (M1), M2, and M3 protocols for longitudinal data exchange.
              </p>
            </div>

            <div className="bg-white p-7 rounded-none border border-[#D0E5E1] space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] flex items-center justify-center text-[#0F766E]">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-editorial-serif text-xl text-[#191817]">Zero-Knowledge Consent</h3>
              <p className="text-xs sm:text-sm text-[#69655E] leading-relaxed">
                Granular, time-bound authorization. Patients choose exactly which doctor or laboratory can view specific care contexts.
              </p>
            </div>

            <div className="bg-white p-7 rounded-none border border-[#D0E5E1] space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] flex items-center justify-center text-[#0F766E]">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-editorial-serif text-xl text-[#191817]">24/7 Rapid Emergency</h3>
              <p className="text-xs sm:text-sm text-[#69655E] leading-relaxed">
                Emergency trauma coordination, rapid patient identification, and instant retrieval of critical allergies and blood group records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="scroll-mt-20 sm:scroll-mt-24 py-20 bg-[#E4F1EE] border-t border-[#D0E5E1]">
        <div className="max-w-[960px] mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-[0.25em] text-[#0F766E] uppercase">
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
                  className="bg-white rounded-none border border-[#D0E5E1] overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#F0F7F6]/50"
                  >
                    <span className="font-editorial-serif text-base sm:text-lg text-[#191817] font-medium">
                      {faq.q}
                    </span>
                    <span className={`text-xl font-light text-[#0F766E] transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}>
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-[#615C54] leading-relaxed border-t border-[#E1EFEA]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. CLEAN BLACK FOOTER */}
      <footer className="bg-[#0D0C0B] text-[#D4E7E3] border-t border-[#222120] pt-16 pb-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#222120]">
            {/* Brand column */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-none bg-gradient-to-tr from-[#0D9488] to-[#4E8C78] flex items-center justify-center p-0.5">
                  <div className="w-full h-full bg-[#0D0C0B] rounded-none flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-none bg-[#5EEAD4]" />
                  </div>
                </div>
                <span className="font-editorial-serif text-xl font-bold text-white tracking-tight">
                  SwaasthSaarthi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#9E988F] leading-relaxed max-w-md">
                India's next-generation unified healthcare network and longitudinal records platform. Empowering patients, physicians, laboratories, and pharmacies through open ABDM standards.
              </p>
            </div>

            {/* Links column: Role Portals */}
            <div className="lg:col-span-3 space-y-3">
              <h5 className="text-xs font-semibold tracking-wider text-white uppercase">
                Role Portals
              </h5>
              <ul className="text-xs sm:text-sm text-[#9E988F] space-y-2.5">
                <li>
                  <button onClick={onOpenLogin} className="hover:text-white transition-colors text-left cursor-pointer">
                    Patient Portal
                  </button>
                </li>
                <li>
                  <button onClick={onOpenLogin} className="hover:text-white transition-colors text-left cursor-pointer">
                    Doctor Workstation
                  </button>
                </li>
                <li>
                  <button onClick={onOpenLogin} className="hover:text-white transition-colors text-left cursor-pointer">
                    Diagnostic Laboratory
                  </button>
                </li>
                <li>
                  <button onClick={onOpenLogin} className="hover:text-white transition-colors text-left cursor-pointer">
                    Pharmacy Dispensation
                  </button>
                </li>
              </ul>
            </div>

            {/* Links column: Platform Navigation */}
            <div className="lg:col-span-3 space-y-3">
              <h5 className="text-xs font-semibold tracking-wider text-white uppercase">
                Platform
              </h5>
              <ul className="text-xs sm:text-sm text-[#9E988F] space-y-2.5">
                <li>
                  <a href="#ecosystem" className="hover:text-white transition-colors">
                    Role Ecosystem
                  </a>
                </li>
                <li>
                  <a href="#specialties" className="hover:text-white transition-colors">
                    Centres of Care
                  </a>
                </li>
                <li>
                  <a href="#architecture" className="hover:text-white transition-colors">
                    System Architecture
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Frequently Asked Questions
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A746B]">
            <div>
              © 2026 SwaasthSaarthi. All rights reserved.
            </div>
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <span>FHIR R4 Standardized</span>
              <span>•</span>
              <span>ABDM Ayushman Bharat Ready</span>
              <span>•</span>
              <span>ISO 27001 Certified</span>
              <span>•</span>
              <span>256-Bit TLS Vault</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
