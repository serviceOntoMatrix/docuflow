import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Mail, ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await authApi.forgotPassword(email);
      
      if (result.error) {
        setError(result.error);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: "Email sent",
          description: result.message || "If an account with that email exists, a password reset link has been sent.",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send reset email";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            Reset Your
            <br />
            Password
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Enter your email address and we'll send you a link to reset your password.
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
            <h2 className="text-2xl font-bold text-foreground">Forgot Password?</h2>
            <p className="text-muted-foreground mt-2">
              No worries! Enter your email and we'll send you reset instructions.
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="p-6 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Check your email</p>
                    <p className="text-sm text-muted-foreground">
                      We've sent a password reset link to <strong>{email}</strong>. 
                      Please check your inbox and click the link to reset your password.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      The link will expire in 1 hour.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
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

