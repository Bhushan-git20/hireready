import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast.error("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        if (!fullName) {
          toast.error("Please fill in your full name.");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;
        toast.success("Account created successfully! Check your email to confirm registration or sign in directly if autologin is active.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Logged in successfully!");
        navigate("/analyse");
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : "An authentication error occurred.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F] px-4">
      {/* Decorative Matrix/Circuit Glow in center background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.05)_0,transparent_50%)] pointer-events-none" />

      <Card className="w-full max-w-md border border-[#1F1F2E] bg-[#0E0E16] text-white shadow-[0_0_30px_rgba(0,255,136,0.05)] relative overflow-hidden">
        {/* Dynamic Glowing Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FF88] to-transparent" />

        <CardHeader className="space-y-3 text-center pt-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#00FF88] text-[#0A0A0F] shadow-[0_0_15px_rgba(0,255,136,0.3)]">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <CardTitle className="text-2xl tracking-wider text-white" style={{ fontFamily: 'Clash Display' }}>
            HIRE<span className="text-[#00FF88] glow-text-green">READY</span>
          </CardTitle>
          <CardDescription className="text-[#8E8E9E] font-medium tracking-wide">
            {isSignUp ? "Create your developer profile" : "Know before you apply."}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs text-[#8E8E9E] tracking-wider code-font">FULL NAME</Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-[#1F1F2E] bg-[#0A0A0F] focus:border-[#00FF88] focus:ring-[#00FF88] text-white placeholder-[#4E4E5E] pl-10"
                    required
                  />
                  <div className="absolute left-3 top-[10px] text-[#4E4E5E]"><Sparkles size={16} /></div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-[#8E8E9E] tracking-wider code-font">EMAIL ADDRESS</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#1F1F2E] bg-[#0A0A0F] focus:border-[#00FF88] focus:ring-[#00FF88] text-white placeholder-[#4E4E5E] pl-10"
                  required
                />
                <div className="absolute left-3 top-[10px] text-[#4E4E5E]"><Mail size={16} /></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-[#8E8E9E] tracking-wider code-font">PASSWORD</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-[#1F1F2E] bg-[#0A0A0F] focus:border-[#00FF88] focus:ring-[#00FF88] text-white placeholder-[#4E4E5E] pl-10"
                  required
                />
                <div className="absolute left-3 top-[10px] text-[#4E4E5E]"><Lock size={16} /></div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pb-8 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00FF88] text-[#0A0A0F] hover:bg-[#00D972] font-semibold tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,136,0.15)] terminal-glow-btn transition-all"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#0A0A0F]" />
              ) : (
                <>
                  <span>{isSignUp ? "INITIALIZE ACCOUNT" : "AUTHENTICATE SYSTEM"}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-[#8E8E9E] hover:text-[#00FF88] transition-colors code-font tracking-wide mt-2"
            >
              {isSignUp ? "ALREADY INSTALLED? LOG IN" : "NEW DEVELOPER? SIGN UP"}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
