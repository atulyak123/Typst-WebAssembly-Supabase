"use client"
import { type FormEvent, useRef, useState, useEffect } from 'react';
import { Input } from './ui/input';
import { useAuth } from '@/context/auth-context';

type MessageType = 'idle' | 'success' | 'error' | 'info';
type LoadingState = 'idle' | 'busy' | 'success' | 'error';

export default function Login() {
  const { signInWithMagicLink } = useAuth();

  // State management
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper function to show messages
  const showMessage = (text: string, type: MessageType = 'info') => {
    setMessage(text);
    setMessageType(type);
    
    // Auto-clear error messages after 8 seconds
    if (type === 'error') {
      setTimeout(() => {
        setMessage('');
        setMessageType('idle');
      }, 8000);
    }
  };

  // Handle form submission
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'busy') return;

    const emailValue = email.trim().toLowerCase();
    
    // Basic email validation
    if (!emailValue || !emailValue.includes('@')) {
      showMessage('Please enter a valid email address', 'error');
      return;
    }

    // Infocusp domain validation
    if (!emailValue.endsWith('@infocusp.com')) {
      showMessage('Access restricted to Infocusp employees only. Please use your @infocusp.com email address.', 'error');
      return;
    }

    // Start loading
    setStatus('busy');
    setMessage('');
    setMessageType('idle');

    try {
      const { error } = await signInWithMagicLink(emailValue);
      
      if (error) {
        setStatus('error');
        showMessage(error.message || 'Failed to send magic link. Please try again.', 'error');
      } else {
        setStatus('success');
        showMessage('Magic link sent! Check your email and click the link to sign in.', 'success');
        // Don't clear the success message automatically
      }
    } catch (error) {
      setStatus('error');
      showMessage('An unexpected error occurred. Please try again.', 'error');
      console.error('Magic link error:', error);
    }
  }

  // Handle input changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear previous messages when user starts typing
    if (message && (messageType === 'error' || messageType === 'success')) {
      setMessage('');
      setMessageType('idle');
    }
    
    // Reset status when user starts typing
    if (status === 'error' || status === 'success') {
      setStatus('idle');
    }
    
    // Show helpful hint for non-infocusp emails
    const emailValue = value.trim().toLowerCase();
    if (emailValue.length > 0 && emailValue.includes('@') && !emailValue.endsWith('@infocusp.com')) {
      showMessage('Please use your @infocusp.com email address', 'error');
    }
  };

  const handleInputFocus = () => {
    // Show hint when focused and empty
    if (!email.trim() && !message) {
      showMessage('Enter your @infocusp.com email address', 'info');
    }
  };

  const handleInputBlur = () => {
    // Clear hint when not focused and no error
    if (!email.trim() && messageType === 'info') {
      setMessage('');
      setMessageType('idle');
    }
  };

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Message styling classes
  const getMessageClasses = () => {
    const baseClasses = 'text-center text-sm rounded-lg p-3 border transition-all duration-300 ease-in-out';
    
    switch (messageType) {
      case 'success':
        return `${baseClasses} text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800`;
      case 'error':
        return `${baseClasses} text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800`;
      case 'info':
        return `${baseClasses} text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/20 dark:border-indigo-800`;
      default:
        return 'hidden';
    }
  };

  // Get button text based on status
  const getButtonText = () => {
    switch (status) {
      case 'busy':
        return 'Sending Magic Link...';
      case 'success':
        return 'Magic Link Sent!';
      default:
        return 'Send Magic Link';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-300 via-slate-200 to-violet-600 p-5 font-sans">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl animate-[slideUp_0.6s_ease-out] dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/40">
        
        {/* Logo Section */}
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-10 text-center text-white">
          <div className="mx-auto mb-5 w-12 h-12 transition-transform duration-300 hover:scale-110 hover:rotate-6">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#gradient)"/>
              <path d="M12 16h24v2H12v-2zm0 6h24v2H12v-2zm0 6h16v2H12v-2z" fill="white"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#667eea'}}/>
                  <stop offset="100%" style={{stopColor:'#764ba2'}}/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Typst Playground</h1>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <h2 className="text-2xl font-semibold text-slate-800 text-center mb-2 dark:text-slate-100">
            Welcome, Infocusp Employee
          </h2>
          <p className="text-slate-500 text-center mb-8 text-sm leading-relaxed dark:text-slate-400">
            Enter your Infocusp email address to receive a secure login link
          </p>

          <form onSubmit={handleSubmit} className="mb-6">
            {/* Input Group */}
            <div className="mb-6">
              <div className="relative">
                <Input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder=" "
                  required
                  autoComplete="email"
                  disabled={status === 'busy'}
                  className="peer w-full pl-12 pr-5 py-4 border border-slate-300 rounded-lg bg-slate-50 text-base transition-all duration-300 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-100 placeholder-transparent disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-900/20"
                />
                <label
                  htmlFor="email"
                  className="absolute left-12 top-4 text-slate-500 pointer-events-none transition-all duration-300 transform origin-left peer-focus:-translate-y-8 peer-focus:scale-90 peer-focus:text-indigo-500 peer-focus:font-medium peer-focus:bg-white peer-focus:px-1 peer-focus:-ml-1 peer-not-placeholder-shown:-translate-y-8 peer-not-placeholder-shown:scale-90 peer-not-placeholder-shown:text-indigo-500 peer-not-placeholder-shown:font-medium peer-not-placeholder-shown:bg-white peer-not-placeholder-shown:px-1 peer-not-placeholder-shown:-ml-1 dark:peer-focus:bg-slate-900 dark:peer-not-placeholder-shown:bg-slate-900 dark:text-slate-400"
                >
                  Infocusp email address
                </label>
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 transition-colors duration-300 peer-focus:text-indigo-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
              </div>
              
              <div className="mt-2 text-center">
                <span className="text-xs text-slate-500 flex items-center justify-center gap-1 dark:text-slate-400">
                  <span>🏢</span>
                  Only @infocusp.com email addresses are allowed
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'busy' || status === 'success'}
              className={`w-full py-4 px-6 font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl active:scale-100 active:translate-y-0 disabled:opacity-80 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center min-h-[52px] relative overflow-hidden ${
                status === 'success' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-emerald-500/40' 
                  : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:shadow-indigo-500/40'
              }`}
            >
              <span className={`transition-opacity duration-300 ${status === 'busy' ? 'opacity-0' : 'opacity-100'}`}>
                {getButtonText()}
              </span>
              {status === 'busy' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          </form>

          {/* Message Area */}
          <div className="mb-6 min-h-[20px]">
            {message && (
              <p className={getMessageClasses()}>
                {message}
              </p>
            )}
          </div>

          {/* Info Section */}
          <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="text-base w-6 text-center">🏢</span>
                <span className="leading-relaxed">Secure access for Infocusp employees only</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="text-base w-6 text-center">⚡</span>
                <span className="leading-relaxed">Real-time collaborative document editing</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="text-base w-6 text-center">🔗</span>
                <span className="leading-relaxed">Passwordless login with magic links</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}