import { Home, Calendar, PlusCircle, MessageSquare, BarChart, LogOut } from "lucide-react";
import { motion } from "motion/react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail: string;
  onLogout: () => void;
}

export default function Navbar({ activeTab, setActiveTab, userEmail, onLogout }: NavbarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "create", label: "New Task", icon: PlusCircle },
    { id: "copilot", label: "AI Assistant", icon: MessageSquare },
    { id: "analytics", label: "Analytics", icon: BarChart },
  ];

  return (
    <nav className="border-b border-zinc-800 bg-[#09090b] py-3.5 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        {/* Sleek Bento brand icon with emerald and solid rounded shape */}
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-md shadow-emerald-500/15">
          <svg className="w-5 h-5 text-zinc-950" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white font-sans uppercase">
            Preempt<span className="text-emerald-500 font-extrabold">AI</span>
          </span>
          <span className="text-[9px] block text-emerald-500/80 font-mono font-bold tracking-widest -mt-1">
            ARCHITECT ROADMAP
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center space-x-1 bg-[#0c0c0e] p-1 rounded-xl border border-zinc-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                isActive ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-zinc-800/50 border border-emerald-500/20 rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden lg:block text-right">
          <span className="text-[9px] text-zinc-500 block font-mono font-bold uppercase">System Operator</span>
          <span className="text-xs text-zinc-300 font-medium font-mono">{userEmail}</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition-colors text-xs text-red-400 hover:text-red-305 font-bold font-mono uppercase"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    </nav>
  );
}
