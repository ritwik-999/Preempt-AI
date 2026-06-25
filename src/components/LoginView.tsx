import React, { useState, FormEvent } from "react";
import { ListTodo, Sparkles, AlertOctagon, CheckCircle2, ArrowLeft, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginViewProps {
  onLoginSuccess: (email: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States specifically for Forgot / Reset Password flow
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const targetEmail = email.trim() || "abc@gmail.com";
    const targetPassword = password.trim() || "pass123";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }
      onLoginSuccess(data.email);
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!forgotEmail.trim()) {
      setError("Please provide your email address.");
      setIsLoading(false);
      return;
    }
    if (!newPassword.trim()) {
      setError("Please provide a new password.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: forgotEmail.trim(), 
          newPassword: newPassword.trim() 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Reset request failed.");
      }
      
      // Password was successfully updated in mock persistence DB!
      // To create an amazing UX:
      // 1. Copy the updated details into the login form inputs immediately
      setEmail(forgotEmail.trim());
      setPassword(newPassword.trim());
      // 2. Set success banner
      setSuccessMessage("Success! Your password was updated. We have pre-filled the credentials below so you can sign in instantly!");
      // 3. Switch back to login view smoothly
      setIsForgotMode(false);
      // Reset forgot fields
      setForgotEmail("");
      setNewPassword("");
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please make sure file/user database exists.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchDemoSession = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // Generate a unique client-side guest/demo identifier
      const randomId = Math.random().toString(36).substring(2, 10);
      const guestEmail = `guest_${randomId}@preempt.demo`;
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guestEmail, password: "demoPass123" })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Temporary session allocation failed");
      }
      onLoginSuccess(data.email);
    } catch (err: any) {
      setError(err?.message || "Could not instantiate an isolated sandbox session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center bg-[#07070a] px-4 py-12 relative overflow-hidden">
      {/* Decorative vector overlays */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-teal-500/5 rounded-full filter blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full"
      >
        {/* Brand visual stack */}
        <div className="text-center mb-9">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-[2px] mb-4 shadow-lg shadow-emerald-500/10">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0c0c10]">
              <ListTodo className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans sm:text-4xl">
            Preempt AI
          </h2>
          <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
            The proactive deadline companion. Detect bottlenecks, analyze risks, and schedule mitigation work automatically.
          </p>
        </div>

        {/* Auth container cards */}
        <div className="bg-[#0b0b0f] border border-gray-800 rounded-2xl p-8 relative shadow-2xl overflow-hidden min-h-[380px] flex flex-col justify-between">
          
          <AnimatePresence mode="wait">
            {!isForgotMode ? (
              <motion.div
                key="login-form-pane"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Access AI Console</h3>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-mono transition-colors font-medium cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {successMessage && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-3.5 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono flex items-start space-x-2.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}

                {error && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-3.5 mb-5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-mono flex items-start space-x-2.5"
                  >
                    <AlertOctagon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-medium text-gray-400 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#121218] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/45 focus:border-emerald-500 transition-all font-mono"
                      placeholder="abc@gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-medium text-gray-400 uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#121218] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/45 focus:border-[#22c55e] transition-all font-mono"
                      placeholder="pass123"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-6 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white rounded-xl py-3 px-4 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer font-sans shadow-lg shadow-emerald-600/10 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ListTodo className="h-4 w-4" />
                        <span>Verify and Access Console</span>
                      </>
                    )}
                  </button>
                </form>



                <div className="mt-4 flex flex-col space-y-2">
                  <div className="text-[10px] text-center text-zinc-500 font-sans leading-relaxed px-1">
                    Or use a zero-footprint sandbox. No signup required. Data is automatically destroyed upon logging out.
                  </div>
                  <button
                    onClick={handleLaunchDemoSession}
                    type="button"
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-900/40 to-emerald-950/40 hover:from-teal-900/60 hover:to-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-sm shadow-emerald-950/50"
                  >
                    <span>⚡ Launch Temporary Guest Session</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="forgot-form-pane"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center space-x-2 mb-6">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsForgotMode(false);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="p-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                    <Key className="h-4 w-4 text-emerald-400" />
                    <span>Reset Your Password</span>
                  </h3>
                </div>

                <p className="text-xs text-gray-400 mb-5 font-sans leading-relaxed">
                  Lost access to your Preempt workspace? Enter your registered email and specify a new secure password. Your account will be updated instantly on the secure node.
                </p>

                {error && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-3.5 mb-5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-mono flex items-start space-x-2.5"
                  >
                    <AlertOctagon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-medium text-gray-400 uppercase tracking-wider mb-2">
                      Registered Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-[#121218] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/45 focus:border-emerald-500 transition-all font-mono"
                      placeholder="abc@gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-medium text-gray-400 uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#121218] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/45 focus:border-[#22c55e] transition-all font-mono"
                      placeholder="Enter new password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-6 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white rounded-xl py-3 px-4 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer font-sans shadow-lg shadow-emerald-600/10 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        <span>Update Password & Return</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full py-2.5 text-center text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel and Return to Sign-In
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Safe platform features preview */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="bg-[#0a0a0e] rounded-xl border border-gray-900 p-3.5 flex items-start space-x-2.5">
            <AlertOctagon className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-gray-200">Mitigate Threats</h4>
              <p className="text-[10px] text-gray-500">Auto-prioritizes high-risk tasks on sight.</p>
            </div>
          </div>
          <div className="bg-[#0a0a0e] rounded-xl border border-gray-900 p-3.5 flex items-start space-x-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-gray-200">Secure Slots</h4>
              <p className="text-[10px] text-gray-500">Syncs tasks straight to persistent calendars.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
