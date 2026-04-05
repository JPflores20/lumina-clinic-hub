import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Glasses, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/useLogin";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { authenticate, isLoading } = useLogin();
  const { user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect away
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await authenticate(email, password);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Decoration Panel */}
      <div className="hidden md:flex flex-col flex-1 bg-primary items-center justify-center text-primary-foreground p-12">
         <div className="max-w-md space-y-6 animate-fade-in">
            <Glasses className="w-20 h-20 opacity-90" />
            <h1 className="text-4xl font-bold">Lumina Clinic Hub</h1>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
               Sistema Maestro integral. Gestión clínica, inventario en tiempo real, laboratorio y finanzas. Todo en un solo lugar.
            </p>
         </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card align-middle min-h-screen md:min-h-0">
        <div className="w-full max-w-[400px] space-y-8 animate-slide-up">
           
           <div className="text-center md:text-left space-y-2">
             <div className="inline-flex items-center justify-center md:hidden w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                <Glasses className="w-8 h-8" />
             </div>
             <h2 className="text-3xl font-bold tracking-tight text-foreground">Iniciar Sesión</h2>
             <p className="text-muted-foreground text-sm">
                Ingresa tus credenciales corporativas para entrar.
             </p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Correo Electrónico</label>
                    <Input 
                      type="email" 
                      placeholder="nombre@luminaclinic.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Contraseña</label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                 </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-11 text-base font-semibold">
                {isLoading ? "Verificando Credenciales..." : "Entrar a Hub"}
              </Button>
           </form>

           <div className="flex items-center gap-2 mt-8 text-xs text-muted-foreground/50 justify-center">
              <ShieldAlert className="w-3 h-3" />
              <span>Acceso Restringido. Monitoreado por Admin.</span>
           </div>
        </div>
      </div>
    </div>
  );
}
