import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, Lock, AlertTriangle } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { signIn, user, userRole } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && userRole === "super_admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message || "Invalid credentials");
      } else {
        // Check if the logged-in user is actually a super admin
        // The redirect will happen via the useEffect above once userRole updates
        // But we add a small delay check
        setTimeout(() => {
          const token = localStorage.getItem("access_token");
          if (token) {
            // Parse JWT to check role without waiting for session API
            try {
              const payload = JSON.parse(atob(token.split(".")[1]));
              if (payload.role !== "super_admin") {
                setError("Access denied. This login is for Super Admins only.");
                localStorage.removeItem("access_token");
                window.location.reload();
              }
            } catch {
              // If JWT parse fails, let the normal flow handle it
            }
          }
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 p-12 flex-col justify-between">
        <div />
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-3xl font-bold text-white">DocqFlow</span>
              <span className="block text-red-400 text-sm font-medium -mt-1">Super Admin Console</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Platform
            <br />
            Administration
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Manage firms, users, billing, and platform settings from a single dashboard.
          </p>
          <div className="flex gap-6 pt-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-2">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-xs text-gray-400">Secure Access</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-xs text-gray-400">Authorized Only</p>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-sm">DocqFlow Administration Panel. Authorized personnel only.</p>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">DocqFlow</span>
              <span className="block text-red-400 text-xs -mt-0.5">Super Admin</span>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-red-600/20 mx-auto flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">Admin Login</h2>
              <p className="text-gray-400 mt-1 text-sm">
                Enter your super admin credentials
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-gray-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type="email"
                    placeholder="admin@docqflow.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold text-base"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Sign In to Admin Panel"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-center text-gray-500 text-xs">
                This is a restricted area. All login attempts are logged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
