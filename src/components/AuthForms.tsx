import * as React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface AuthFormsProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'signin' | 'signup';
  isModal?: boolean;
}

type UserType = "individual" | "company";

export function AuthForms({ isOpen, onClose, defaultView = 'signin', isModal = false }: AuthFormsProps) {
  const [view, setView] = useState<"signin" | "signup">(defaultView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<UserType>("individual");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (view === "signin") {
        await signIn(email, password);
        navigate("/dashboard");
      } else {
        await signUp(email, password, fullName, userType);
        navigate("/dashboard");
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{view === "signin" ? "Sign in" : "Create an account"}</DialogTitle>
          <DialogDescription>
            {view === "signin" 
              ? "Enter your email and password to sign in to your account."
              : "Enter your details to create a new account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 text-sm text-red-500 bg-red-50 rounded-md"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {view === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {view === "signup" && (
            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={userType === "individual" ? "default" : "outline"}
                  onClick={() => setUserType("individual")}
                >
                  Individual
                </Button>
                <Button
                  type="button"
                  variant={userType === "company" ? "default" : "outline"}
                  onClick={() => setUserType("company")}
                >
                  Company
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember">Remember me</Label>
            </div>
            {view === "signin" && (
              <Button type="button" variant="link" className="px-0">
                Forgot password?
              </Button>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : view === "signin" ? "Sign in" : "Create account"}
          </Button>

          <div className="text-center text-sm">
            {view === "signin" ? (
              <>
                Don't have an account?{" "}
                <Button type="button" variant="link" className="px-0" onClick={() => setView("signup")}>
                  Sign up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button type="button" variant="link" className="px-0" onClick={() => setView("signin")}>
                  Sign in
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}