// src/auth/login.ts

import { signIn } from "./auth";

export function mountLogin(root: HTMLElement) {
  root.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="logo-section">
          <div class="logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#gradient)"/>
              <path d="M12 16h24v2H12v-2zm0 6h24v2H12v-2zm0 6h16v2H12v-2z" fill="white"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#667eea"/>
                  <stop offset="100%" style="stop-color:#764ba2"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 class="title">Typst Playground</h1>
        </div>

        <div class="form-section">
          <h2 class="form-title">Welcome, Infocusp Employee</h2>
          <p class="form-description">Enter your Infocusp email address to receive a secure login link</p>
          
          <form id="login-form" class="login-form">
            <div class="input-group">
              <div class="input-wrapper">
                <input 
                  type="email" 
                  id="email" 
                  class="email-input" 
                  placeholder=" " 
                  required 
                  autocomplete="email"
                />
                <label for="email" class="input-label">Infocusp email address</label>
                <div class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
              </div>
              <div class="input-help">
                <span class="help-text">Only @infocusp.com email addresses are allowed</span>
              </div>
            </div>

            <button type="submit" class="login-btn" id="login-btn">
              <span class="btn-text">Send Magic Link</span>
              <div class="btn-loader" style="display: none;">
                <div class="spinner"></div>
              </div>
            </button>
          </form>

          <div class="message-area">
            <p class="msg" id="msg"></p>
          </div>

          <div class="info-section">
            <div class="feature-list">
              <div class="feature-item">
                <span class="feature-icon">🏢</span>
                <span class="feature-text">Secure access for Infocusp employees only</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">⚡</span>
                <span class="feature-text">Real-time collaborative document editing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      /* Login-specific styles that integrate with existing design system */
      .login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg,rgb(196, 202, 207) 0%, #764ba2 100%);
        padding: 20px;
        font-family: system-ui;
        color: var(--fg);
      }

      .login-card {
        background: var(--bg);
        border: 1px solid var(--divider);
        border-radius: calc(var(--radius) * 2);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        width: 100%;
        max-width: 440px;
        animation: slideUp 0.6s ease-out;
      }

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

      .logo-section {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px 32px;
        text-align: center;
        color: white;
      }

      .logo {
        margin: 0 auto 20px;
        width: 48px;
        height: 48px;
        transition: transform 0.3s ease;
      }

      .logo:hover {
        transform: scale(1.1) rotate(5deg);
      }

      .title {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 8px 0;
        letter-spacing: -0.5px;
      }

      .subtitle {
        font-size: 16px;
        opacity: 0.9;
        margin: 0;
        font-weight: 400;
      }

      .form-section {
        padding: 40px 32px;
        background: var(--bg);
      }

      .form-title {
        font-size: 24px;
        font-weight: 600;
        color: var(--fg);
        margin: 0 0 8px 0;
        text-align: center;
      }

      .form-description {
        color: var(--placeholder);
        text-align: center;
        margin: 0 0 32px 0;
        font-size: 15px;
        line-height: 1.5;
      }

      .login-form {
        margin-bottom: 24px;
      }

      .input-group {
        margin-bottom: 24px;
      }

      .input-wrapper {
        position: relative;
      }

      .email-input {
        width: 100%;
        padding: 16px 20px 16px 52px;
        border: 1px solid var(--divider);
        border-radius: var(--radius);
        font-size: 16px;
        background: var(--pane-bg);
        color: var(--fg);
        transition: all 0.3s ease;
        outline: none;
        font-family: system-ui;
        box-sizing: border-box;
      }

      .email-input::placeholder {
        color: var(--placeholder);
      }

      .email-input:focus {
        border-color: #667eea;
        background: var(--bg);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .email-input:focus + .input-label,
      .email-input:not(:placeholder-shown) + .input-label {
        transform: translateY(-32px) scale(0.85);
        color: #667eea;
        font-weight: 500;
      }

      .input-label {
        position: absolute;
        left: 52px;
        top: 17px;
        color: var(--placeholder);
        pointer-events: none;
        transition: all 0.3s ease;
        font-size: 16px;
        transform-origin: left top;
        background: var(--bg);
        padding: 0 4px;
        margin-left: -4px;
      }

      .input-icon {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--placeholder);
        transition: color 0.3s ease;
      }

      .email-input:focus ~ .input-icon {
        color: #667eea;
      }

      .input-help {
        margin-top: 8px;
        text-align: center;
      }

      .help-text {
        font-size: 12px;
        color: var(--placeholder);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }

      .help-text::before {
        content: "🏢";
        font-size: 14px;
      }

      .login-btn {
        width: 100%;
        padding: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: var(--radius);
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 52px;
        font-family: system-ui;
      }

      .login-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px rgba(102, 126, 234, 0.4);
      }

      .login-btn:active:not(:disabled) {
        transform: translateY(0);
      }

      .login-btn:disabled {
        opacity: 0.8;
        cursor: not-allowed;
      }

      .btn-text {
        transition: opacity 0.3s ease;
      }

      .btn-loader {
        position: absolute;
      }

      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .message-area {
        min-height: 20px;
        margin-bottom: 24px;
      }

      .msg {
        text-align: center;
        margin: 0;
        font-size: 14px;
        line-height: 1.4;
        transition: all 0.3s ease;
        border-radius: calc(var(--radius) / 2);
      }

      .msg.success {
        color: #10b981;
        background: rgba(16, 185, 129, 0.1);
        padding: 12px 16px;
        border: 1px solid rgba(16, 185, 129, 0.2);
      }

      .msg.error {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
        padding: 12px 16px;
        border: 1px solid rgba(239, 68, 68, 0.2);
      }

      .msg.info {
        color: #667eea;
        background: rgba(102, 126, 234, 0.1);
        padding: 12px 16px;
        border: 1px solid rgba(102, 126, 234, 0.2);
      }

      .info-section {
        border-top: 1px solid var(--divider);
        padding-top: 24px;
      }

      .feature-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .feature-item {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        color: var(--placeholder);
      }

      .feature-icon {
        font-size: 16px;
        width: 24px;
        text-align: center;
      }

      .feature-text {
        line-height: 1.4;
      }

      /* Dark mode specific adjustments */
      :root[data-theme="dark"] .login-card {
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
      }

      :root[data-theme="dark"] .email-input:focus {
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
      }

      @media (prefers-color-scheme: dark) {
        .login-card {
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        }
        
        .email-input:focus {
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }
      }

      @media (max-width: 480px) {
        .login-container {
          padding: 12px;
        }
        
        .logo-section {
          padding: 32px 24px;
        }
        
        .form-section {
          padding: 32px 24px;
        }
        
        .title {
          font-size: 24px;
        }
      }
    </style>
  `;

  const form = root.querySelector("#login-form") as HTMLFormElement;
  const msg = root.querySelector("#msg") as HTMLParagraphElement;
  const loginBtn = root.querySelector("#login-btn") as HTMLButtonElement;
  const btnText = root.querySelector(".btn-text") as HTMLSpanElement;
  const btnLoader = root.querySelector(".btn-loader") as HTMLDivElement;

  // Add input validation and UX improvements
  const emailInput = root.querySelector("#email") as HTMLInputElement;
  
  emailInput.addEventListener("input", () => {
    // Clear any previous messages when user starts typing
    msg.textContent = "";
    msg.className = "msg";
    
    // Show helpful hint for non-infocusp emails
    const email = emailInput.value.trim().toLowerCase();
    if (email.length > 0 && email.includes("@") && !email.endsWith("@infocusp.com")) {
      showMessage("Please use your @infocusp.com email address", "error");
    }
  });

  emailInput.addEventListener("focus", () => {
    // Show hint when focused and empty
    if (!emailInput.value.trim()) {
      showMessage("Enter your @infocusp.com email address", "info");
    }
  });

  emailInput.addEventListener("blur", () => {
    // Clear hint when not focused and no error
    if (!emailInput.value.trim()) {
      msg.textContent = "";
      msg.className = "msg";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim().toLowerCase();
    
    // Basic email validation
    if (!email || !email.includes("@")) {
      showMessage("Please enter a valid email address", "error");
      return;
    }

    // infocusp domain validation
    if (!email.endsWith("@infocusp.com")) {
      showMessage("Access restricted to infocusp employees only. Please use your @infocusp.com email address.", "error");
      return;
    }

    // Show loading state
    setLoadingState(true);
    showMessage("Sending secure login link to your Infocusp email...", "info");
    
    try {
      await signIn(email);
      showMessage("Check your Infocusp inbox for a secure login link!", "success");
    } catch (err) {
      console.error(err);
      showMessage(`Error: ${(err as Error).message}`, "error");
    } finally {
      setLoadingState(false);
    }
  });

  function setLoadingState(loading: boolean) {
    loginBtn.disabled = loading;
    btnText.style.opacity = loading ? "0" : "1";
    btnLoader.style.display = loading ? "block" : "none";
  }

  function showMessage(text: string, type: "success" | "error" | "info" = "info") {
    msg.textContent = text;
    msg.className = `msg ${type}`;
    
    // Auto-clear error messages after 5 seconds
    if (type === "error") {
      setTimeout(() => {
        if (msg.textContent === text) {
          msg.textContent = "";
          msg.className = "msg";
        }
      }, 5000);
    }
  }

  // Focus email input for better UX
  setTimeout(() => {
    emailInput.focus();
  }, 300);
}