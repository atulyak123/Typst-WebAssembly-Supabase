"use client";
import { type FormEvent, useRef, useState, useEffect } from "react";
import { Input } from "./ui/input";
import { useAuth } from "@/context/auth-context";

type MessageType = "idle" | "success" | "error" | "info";
type LoadingState = "idle" | "busy" | "success" | "error";

export default function Login() {
  const { signInWithMagicLink } = useAuth();

  // State management
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<LoadingState>("idle");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper function to show messages
  const showMessage = (text: string, type: MessageType = "info") => {
    setMessage(text);
    setMessageType(type);

    // Auto-clear error messages after 8 seconds
    if (type === "error") {
      setTimeout(() => {
        setMessage("");
        setMessageType("idle");
      }, 8000);
    }
  };

  // Handle form submission
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "busy") return;

    const emailValue = email.trim().toLowerCase();

    // Basic email validation
    if (!emailValue || !emailValue.includes("@")) {
      showMessage("Please enter a valid email address", "error");
      return;
    }

    // Infocusp domain validation
    if (!emailValue.endsWith("@infocusp.com")) {
      showMessage(
        "Access restricted to Infocusp employees only. Please use your @infocusp.com email address.",
        "error",
      );
      return;
    }
    setStatus("busy");
    setMessage("");
    setMessageType("idle");

    try {
      const { error } = await signInWithMagicLink(emailValue);

      if (error) {
        setStatus("error");
        showMessage(
          error.message || "Failed to send magic link. Please try again.",
          "error",
        );
      } else {
        setStatus("success");
        showMessage(
          "Magic link sent! Check your email and click the link to sign in.",
          "success",
        );
        // Don't clear the success message automatically
      }
    } catch (error) {
      setStatus("error");
      showMessage("An unexpected error occurred. Please try again.", "error");
      console.error("Magic link error:", error);
    }
  }

  // Handle input changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    // Clear previous messages when user starts typing
    if (message && (messageType === "error" || messageType === "success")) {
      setMessage("");
      setMessageType("idle");
    }

    // Reset status when user starts typing
    if (status === "error" || status === "success") {
      setStatus("idle");
    }

    // Show helpful hint for non-infocusp emails
    const emailValue = value.trim().toLowerCase();
    if (
      emailValue.length > 0 &&
      emailValue.includes("@") &&
      !emailValue.endsWith("@infocusp.com")
    ) {
      showMessage("Please use your @infocusp.com email address", "error");
    }
  };

  const handleInputFocus = () => {
    // Show hint when focused and empty
    if (!email.trim() && !message) {
      showMessage("Enter your @infocusp.com email address", "info");
    }
  };

  const handleInputBlur = () => {
    // Clear hint when not focused and no error
    if (!email.trim() && messageType === "info") {
      setMessage("");
      setMessageType("idle");
    }
  };

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Enhanced message styling classes
  const getMessageClasses = () => {
    const baseClasses =
      "text-center text-sm rounded-xl px-4 py-3 border-2 transition-all duration-500 ease-out transform backdrop-blur-sm font-medium shadow-lg";

    switch (messageType) {
      case "success":
        return `${baseClasses} text-emerald-800 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 shadow-emerald-200/50 dark:text-emerald-300 dark:from-emerald-900/30 dark:to-green-900/30 dark:border-emerald-700/50 dark:shadow-emerald-900/30 scale-105`;
      case "error":
        return `${baseClasses} text-red-800 bg-gradient-to-r from-red-50 to-rose-50 border-red-300 shadow-red-200/50 dark:text-red-300 dark:from-red-900/30 dark:to-rose-900/30 dark:border-red-700/50 dark:shadow-red-900/30 scale-105`;
      case "info":
        return `${baseClasses} text-indigo-800 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-300 shadow-indigo-200/50 dark:text-indigo-300 dark:from-indigo-900/30 dark:to-blue-900/30 dark:border-indigo-700/50 dark:shadow-indigo-900/30`;
      default:
        return "hidden";
    }
  };

  // Get button text based on status
  const getButtonText = () => {
    switch (status) {
      case "busy":
        return "Sending Magic Link...";
      case "success":
        return "Magic Link Sent!";
      default:
        return "Send Magic Link";
    }
  };

  // Get input border classes for better visual feedback
  const getInputClasses = () => {
    const baseClasses =
      "w-full pl-14 pr-5 py-5 border-2 rounded-xl bg-gradient-to-r from-slate-50 to-white text-base font-medium transition-all duration-300 ease-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:from-slate-800 dark:to-slate-750 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500";

    if (messageType === "error") {
      return `${baseClasses} border-red-300 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100 dark:border-red-700/50 dark:focus:ring-red-900/20 shadow-red-100/50 dark:shadow-red-900/20`;
    } else if (messageType === "success") {
      return `${baseClasses} border-emerald-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-emerald-700/50 dark:focus:ring-emerald-900/20 shadow-emerald-100/50 dark:shadow-emerald-900/20`;
    } else {
      return `${baseClasses} border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 hover:border-slate-400 dark:border-slate-600 dark:focus:ring-indigo-900/20 shadow-slate-100/50 dark:shadow-slate-800/50`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-300 via-slate-200 to-violet-600 p-4 font-sans">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl border-2 border-white/20 shadow-2xl shadow-slate-900/20 animate-[slideUp_0.8s_ease-out] dark:bg-slate-900/95 dark:border-slate-700/30 dark:shadow-black/40">
        {/* Logo Section - Enhanced */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-700 p-12 text-center text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-transparent"></div>
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-700"></div>

          <div className="relative z-10">
            <div className="mx-auto mb-6 w-14 h-14 transition-all duration-500 hover:scale-125 hover:rotate-12 cursor-pointer">
              <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="14" fill="url(#gradient)" />
                <path
                  d="M12 16h24v2H12v-2zm0 6h24v2H12v-2zm0 6h16v2H12v-2z"
                  fill="white"
                />
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" style={{ stopColor: "#667eea" }} />
                    <stop offset="100%" style={{ stopColor: "#764ba2" }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 drop-shadow-sm">
              Typst Playground
            </h1>
          </div>
        </div>

        {/* Form Section - Enhanced */}
        <div className="p-10">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-3 tracking-tight dark:text-slate-100">
            Welcome, Infocusp Employee
          </h2>
          <p className="text-slate-600 text-center mb-10 text-base leading-relaxed font-medium dark:text-slate-400">
            Enter your Infocusp email address to receive a secure login link
          </p>

          <form onSubmit={handleSubmit} className="mb-8">
            {/* Input Group - Enhanced */}
            <div className="mb-8">
              <div className="relative group">
                <Input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="you@infocusp.com"
                  required
                  autoComplete="email"
                  disabled={status === "busy"}
                  className={getInputClasses()}
                />
                <div
                  className={`absolute left-5 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                    messageType === "error"
                      ? "text-red-500"
                      : messageType === "success"
                        ? "text-emerald-500"
                        : "text-slate-400 group-focus-within:text-indigo-500"
                  }`}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="transition-transform duration-300 group-focus-within:scale-110"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>

                {/* Enhanced validation indicator */}
                {email && email.includes("@") && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {email.endsWith("@infocusp.com") ? (
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-[scaleIn_0.3s_ease-out]">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                        >
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-[scaleIn_0.3s_ease-out]">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 text-center">
                <span className="text-sm text-slate-500 flex items-center justify-center gap-2 font-medium dark:text-slate-400">
                  <span className="text-base">🏢</span>
                  Only @infocusp.com email addresses are allowed
                </span>
              </div>
            </div>

            {/* Submit Button - Enhanced */}
            <button
              type="submit"
              disabled={status === "busy" || status === "success"}
              className={`w-full py-5 px-6 font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl active:scale-[0.99] active:translate-y-0 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center min-h-[60px] relative overflow-hidden group ${
                status === "success"
                  ? "bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-700 text-white shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-90"
                  : "bg-gradient-to-r from-indigo-500 via-purple-600 to-violet-700 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-80"
              }`}
            >
              {/* Button shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

              <span
                className={`transition-all duration-300 relative z-10 ${status === "busy" ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}
              >
                {getButtonText()}
              </span>
              {status === "busy" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          </form>

          {/* Message Area - Fixed height with enhanced styling */}
          <div className="mb-8 h-16 flex items-center justify-center">
            {message && (
              <div className="w-full animate-[fadeInUp_0.4s_ease-out]">
                <p className={getMessageClasses()}>{message}</p>
              </div>
            )}
          </div>

          {/* Info Section - Enhanced */}
          <div className="border-t-2 border-slate-200/60 pt-8 dark:border-slate-700/60">
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-base text-slate-600 dark:text-slate-400 group hover:text-slate-800 dark:hover:text-slate-300 transition-colors duration-300">
                <span className="text-xl w-8 text-center group-hover:scale-110 transition-transform duration-300">
                  🏢
                </span>
                <span className="leading-relaxed font-medium">
                  Secure access for Infocusp employees only
                </span>
              </div>
              <div className="flex items-center gap-4 text-base text-slate-600 dark:text-slate-400 group hover:text-slate-800 dark:hover:text-slate-300 transition-colors duration-300">
                <span className="text-xl w-8 text-center group-hover:scale-110 transition-transform duration-300">
                  ⚡
                </span>
                <span className="leading-relaxed font-medium">
                  Real-time collaborative document editing
                </span>
              </div>
              <div className="flex items-center gap-4 text-base text-slate-600 dark:text-slate-400 group hover:text-slate-800 dark:hover:text-slate-300 transition-colors duration-300">
                <span className="text-xl w-8 text-center group-hover:scale-110 transition-transform duration-300">
                  🔗
                </span>
                <span className="leading-relaxed font-medium">
                  Passwordless login with magic links
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
