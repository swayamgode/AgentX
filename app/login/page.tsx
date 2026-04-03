"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { 
  Zap, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Activity,
  ShieldCheck,
  Smartphone,
  CheckCircle,
  Video,
  User
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signIn("password", { email, password, name, flow: "signUp" });
      } else {
        await signIn("password", { email, password, flow: "signIn" });
      }
      // Convex Auth will redirect automatically via the provider
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Auth error:", err);
      let errorMessage = "An error occurred during authentication.";
      if (err?.message && !err.message.includes("Server Error")) {
        errorMessage = err.message;
      } else if (isSignUp) {
        errorMessage = "An account with this email already exists! Please click 'Sign In' below.";
      } else {
        errorMessage = "Invalid email or password.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left Wall of Style */}
      <div className="hidden lg:flex flex-col justify-between p-20 bg-[#0D1117] relative overflow-hidden text-white">
         <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10 scale-150 animate-pulse"></div>
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
         
         <div className="relative z-10">
            <Link href="/" className="flex items-center gap-3 mb-20 group">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all duration-500">
                    <span className="text-black font-black text-2xl tracking-tighter">A.</span>
                </div>
                <span className="font-black text-2xl tracking-tight">AgentX</span>
            </Link>

            <div className="space-y-12">
                <h2 className="text-6xl font-black tracking-tighter leading-none italic max-w-md">
                    Automate <br/> your <br/> Growth.
                </h2>
                <div className="space-y-6">
                    <FeatureItem icon={<Activity size={18} />} text="Unified Multiagent Dashboard" />
                    <FeatureItem icon={<Smartphone size={18} />} text="Works on Any Device" />
                    <FeatureItem icon={<ShieldCheck size={18} />} text="Secure Account Isolation" />
                    <FeatureItem icon={<Video size={18} />} text="AI Content Generation" />
                </div>
            </div>
         </div>

         <div className="relative z-10 flex items-center gap-4 p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                <Zap className="text-white fill-white" />
            </div>
            <div>
                <p className="font-black text-sm uppercase tracking-widest text-orange-500">Pro Feature</p>
                <p className="text-gray-400 text-sm">Agents work even while you sleep.</p>
            </div>
         </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 bg-[#F8F9FA]">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#1A1A1E] rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl">A.</span>
          </div>
          <span className="font-black text-xl tracking-tight">AgentX</span>
        </div>

        <div className="w-full max-w-md bg-white p-8 sm:p-12 rounded-[2.5rem] border border-[#E9ECEF] shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
          <div className="mb-10 text-center">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1A1A1E] mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h3>
            <p className="text-[#6C757D] font-medium text-sm">
              {isSignUp ? "Set up your agent swarm." : "Enter your credentials to continue."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-4">
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full pl-12 pr-4 py-4 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl text-sm font-bold focus:outline-none focus:border-black transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full pl-12 pr-4 py-4 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl text-sm font-bold focus:outline-none focus:border-black transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-4 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl text-sm font-bold focus:outline-none focus:border-black transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl text-xs font-bold flex items-center gap-3 bg-red-50 text-red-600 border border-red-200">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#1A1A1E] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-sm font-bold text-[#6D7280] hover:text-[#1A1A1E] transition-colors"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
        {icon}
      </div>
      <span className="font-bold text-lg text-gray-400 group-hover:text-white transition-colors">{text}</span>
    </div>
  );
}
