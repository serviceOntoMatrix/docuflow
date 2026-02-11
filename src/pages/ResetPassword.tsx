import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid link",
        description: "Password reset link is missing or invalid.",
        variant: "destructive",
      });
      navigate("/forgot-password");
    }
  }, [token, navigate, toast]);

  const validate = () => {
    const newErrors: typeof errors = {};

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: "Error",
        description: "Reset token is missing.",
        variant: "destructive",
      });
      return;
    }

    if (!validate()) return;

    setLoading(true);

    try {
      const result = await authApi.resetPassword(token, password);
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: "Success",
          description: result.message || "Password has been reset successfully.",
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reset password";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary p-12 flex-col justify-between">
        <Link to="/auth" className="flex items-center gap-2 text-primary-foreground hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Sign In</span>
        </Link>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <FileUp className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold text-primary-foreground">DocqFlow</span>
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            Set New
            <br />
            Password
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Choose a strong password to secure your account.
          </p>
        </div>
        <p className="text-primary-foreground/60 text-sm">© 2024 DocqFlow. Secure document management.</p>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="lg:hidden mb-8">
            <Link to="/auth" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
            <p className="text-muted-foreground mt-2">
              Enter your new password below.
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="p-6 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Password Reset Successful!</p>
                    <p className="text-sm text-muted-foreground">
                      Your password has been reset successfully. Redirecting to sign in...
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="hero"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Go to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({ ...errors, password: undefined });
                    }}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          <p className="text-center text-muted-foreground">
            Remember your password?{" "}
            <Link to="/auth" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

