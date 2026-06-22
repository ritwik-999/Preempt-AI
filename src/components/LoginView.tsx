import React, { useState, FormEvent } from "react";
import { Shield, Sparkles, AlertOctagon, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface LoginViewProps {
  onLoginSuccess: (email: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState("ritwikkapat@gmail.com");
  const [password, setPassword] = useState("********");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess(email);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center bg-[#07070a] px-4 py-12 relative overflow-hidden">
      {/* Decorative vector overlays */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-red-600/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-orange-500/5 rounded-full filter blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full"
      >
        {/* Brand visual stack */}
        <div className="text-center mb-9">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-yellow-500 p-[2px] mb-4 shadow-lg shadow-orange-500/10">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0c0c10]">
              <Shield className="h-6 w-6 text-red-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans sm:text-4xl">
            Preempt AI
          </h2>
          <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
            The proactive deadline companion. Detect bottlenecks, analyze risks, and schedule mitigation work automatically.
          </p>
        </div>

        {/* Auth card resembling professional Clerk integration */}
        <div className="bg-[#0b0b0f] border border-gray-800 rounded-2xl p-8 relative shadow-2xl">
          <div className="absolute top-0 right-0 p-3">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 font-mono border border-red-500/20">
              <Sparkles className="h-2.5 w-2.5 mr-1 animate-pulse" />
              CLERK SECURED
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mb-6">Access AI Console</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-gray-400 uppercase tracking-wider mb-2">
                Developer/Account Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#121218] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/45 focus:border-red-500 transition-all font-mono"
                placeholder="Enter email"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-mono font-medium text-gray-400 uppercase tracking-wider">
                  Clerk Passcode
                </label>
                <span className="text-xs text-red-400 hover:underline cursor-pointer font-mono">
                  Reset Link
                </span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#121218] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/45 focus:border-[#7a3b31] transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 text-white rounded-xl py-3 px-4 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer font-sans shadow-lg shadow-red-600/10 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Verify with Clerk Single Sign-On</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-900/80 flex flex-col space-y-3">
            <span className="text-xs text-gray-500 text-center block">
              Or proceed instantly with simulated enterprise identity
            </span>
            <button
              onClick={() => onLoginSuccess("ritwikkapat@gmail.com")}
              className="w-full py-2.5 px-4 bg-[#121218] hover:bg-[#16161f] border border-gray-800 rounded-xl text-xs font-semibold font-mono text-gray-300 transition-all"
            >
              🚀 Instant Enter as Lead Architect
            </button>
          </div>
        </div>

        {/* Safe platform features preview */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="bg-[#0a0a0e] rounded-xl border border-gray-900 p-3.5 flex items-start space-x-2.5">
            <AlertOctagon className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-gray-200">Mitigate Threats</h4>
              <p className="text-[10px] text-gray-500">Auto-prioritizes high-risk calendars on sight.</p>
            </div>
          </div>
          <div className="bg-[#0a0a0e] rounded-xl border border-gray-900 p-3.5 flex items-start space-x-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-gray-200">Secure Slots</h4>
              <p className="text-[10px] text-gray-500">Syncs tasks straight to Google Calendar feeds.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
