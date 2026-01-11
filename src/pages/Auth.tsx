import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MapPin, ArrowRight, Mail, Lock, User } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Érvényes email címet adj meg"),
  password: z.string().min(6, "A jelszónak legalább 6 karakternek kell lennie"),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "A név legalább 2 karakter legyen"),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, isAdmin, isSalesRep, loading } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate("/admin");
      } else if (isSalesRep) {
        navigate("/sales");
      } else {
        // User has no role yet, show pending message
        toast.info("Fiókod várakozik jóváhagyásra.");
      }
    }
  }, [user, isAdmin, isSalesRep, loading, navigate]);

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);
    
    if (error) {
      toast.error("Bejelentkezési hiba", {
        description: error.message.includes("Invalid login")
          ? "Hibás email vagy jelszó"
          : error.message,
      });
    }
  };

  const onSignup = async (data: SignupForm) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setIsLoading(false);
    
    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Ez az email cím már regisztrálva van");
      } else {
        toast.error("Regisztrációs hiba", { description: error.message });
      }
    } else {
      toast.success("Sikeres regisztráció!", {
        description: "Kérlek lépj be a fiókodba.",
      });
      setIsLogin(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12"
      >
        <div className="max-w-md text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-primary-foreground/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-8"
          >
            <MapPin className="h-10 w-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">
            CRM Pro
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Professzionális ügyfélkezelő rendszer szerződéskötők számára. 
            Kövesd nyomon a lead-eket térképen, kezeld az ügyfeleket hatékonyan.
          </p>
        </div>
      </motion.div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-elevated border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="lg:hidden mb-4">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto">
                  <MapPin className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">
                {isLogin ? "Bejelentkezés" : "Regisztráció"}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? "Lépj be a fiókodba a folytatáshoz" 
                  : "Hozz létre egy új fiókot"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={loginForm.handleSubmit(onLogin)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="pelda@email.com"
                          className="pl-10"
                          {...loginForm.register("email")}
                        />
                      </div>
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Jelszó</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          {...loginForm.register("password")}
                        />
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                      {isLoading ? "Bejelentkezés..." : "Bejelentkezés"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="signup"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={signupForm.handleSubmit(onSignup)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Teljes név</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Kovács János"
                          className="pl-10"
                          {...signupForm.register("fullName")}
                        />
                      </div>
                      {signupForm.formState.errors.fullName && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signupEmail"
                          type="email"
                          placeholder="pelda@email.com"
                          className="pl-10"
                          {...signupForm.register("email")}
                        />
                      </div>
                      {signupForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupPassword">Jelszó</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signupPassword"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          {...signupForm.register("password")}
                        />
                      </div>
                      {signupForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                      {isLoading ? "Regisztráció..." : "Regisztráció"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLogin 
                    ? "Nincs még fiókod? Regisztrálj!" 
                    : "Már van fiókod? Jelentkezz be!"}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
