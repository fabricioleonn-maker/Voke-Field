import React, { useState } from 'react';
import { Mail, Lock, Search, ChevronDown, Loader2, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { auth } from '../store/db';
import { useToast } from '../components/Toast';
import logoImg from '../assets/voke_field_login_screen-removebg-preview.png';

function VokeLogo({ className }) {
  return (
    <img src={logoImg} alt="Voke Field" className={`object-contain ${className}`} />
  );
}

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[500px] aspect-[4/3] mx-auto mt-12 perspective-1000 group">
      {/* Main Glass Panel */}
      <div 
        className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-4 flex flex-col gap-4 z-10 transition-transform duration-500 ease-out group-hover:rotate-y-0 group-hover:rotate-x-0 group-hover:rotate-z-0"
        style={{ transform: 'rotateY(-12deg) rotateX(8deg) rotateZ(-2deg)' }}
      >
        {/* Top bar mock */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2 text-white/80">
            <VokeLogo className="h-[60px] w-auto" />
          </div>
          <div className="flex gap-2">
            <div className="bg-white/20 rounded px-3 py-1 text-[10px] text-white flex items-center gap-1">
              Gestão Operações <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Top row */}
        <div className="flex gap-4 h-1/2">
          {/* SLA Indicators */}
          <div className="bg-white rounded-xl p-4 flex-1 shadow-sm flex flex-col transition-transform duration-300 hover:scale-105">
            <h3 className="text-xs font-bold text-voke-dark mb-1">Indicadores SLA</h3>
            <div className="text-[10px] text-gray-500 mb-2 font-medium">Conformidade SLA</div>
            <div className="flex-1 flex items-center justify-center relative">
              <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f3f4f6" strokeWidth="12" strokeLinecap="round" />
                <path d="M 10 50 A 40 40 0 0 1 70 15" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" className="transition-all duration-1000 ease-out stroke-dasharray-[100] stroke-dashoffset-[0] group-hover:stroke-dashoffset-[20]" />
              </svg>
              <div className="absolute bottom-0 text-2xl font-bold text-voke-dark">98%</div>
            </div>
          </div>
          {/* Bar Chart */}
          <div className="bg-white rounded-xl p-4 flex-1 shadow-sm flex flex-col transition-transform duration-300 hover:scale-105">
             <div className="flex items-end justify-between h-full gap-2 pt-4">
              <div className="w-full bg-voke-blue/30 rounded-t-sm h-[40%] relative transition-all duration-500 group-hover:h-[50%]"><span className="absolute -top-4 text-[8px] text-gray-400 left-1/2 -translate-x-1/2">75k</span></div>
              <div className="w-full bg-voke-blue rounded-t-sm h-[70%] relative transition-all duration-500 group-hover:h-[80%]"><span className="absolute -top-4 text-[8px] text-gray-400 left-1/2 -translate-x-1/2">100k</span></div>
              <div className="w-full bg-voke-blue/50 rounded-t-sm h-[50%] relative transition-all duration-500 group-hover:h-[60%]"><span className="absolute -top-4 text-[8px] text-gray-400 left-1/2 -translate-x-1/2">50k</span></div>
              <div className="w-full bg-voke-blue rounded-t-sm h-[90%] relative transition-all duration-500 group-hover:h-[100%]"><span className="absolute -top-4 text-[8px] text-gray-400 left-1/2 -translate-x-1/2">120k</span></div>
              <div className="w-full bg-voke-blue/40 rounded-t-sm h-[60%] relative transition-all duration-500 group-hover:h-[70%]"><span className="absolute -top-4 text-[8px] text-gray-400 left-1/2 -translate-x-1/2">80k</span></div>
            </div>
            <div className="flex justify-between mt-2 text-[7px] text-gray-400 font-medium">
              <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span>
            </div>
          </div>
        </div>
        {/* Bottom row */}
        <div className="flex gap-4 h-1/2">
          {/* Line Chart */}
          <div className="bg-white rounded-xl p-4 flex-1 shadow-sm flex flex-col relative overflow-hidden transition-transform duration-300 hover:scale-105">
            <h3 className="text-xs font-bold text-voke-dark mb-1">Resultados</h3>
            <div className="text-[10px] text-gray-500 mb-2 font-medium">Eficiência Operacional</div>
            <div className="flex-1 w-full relative mt-2">
              <svg viewBox="0 0 100 40" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <path d="M 0 30 Q 15 10, 30 25 T 60 15 T 80 20 T 100 5" fill="none" stroke="#4A6FA5" strokeWidth="3" />
                <path d="M 0 30 Q 15 10, 30 25 T 60 15 T 80 20 T 100 5 L 100 40 L 0 40 Z" fill="url(#blue-grad)" opacity="0.2" />
                <defs>
                  <linearGradient id="blue-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4A6FA5" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          {/* Another Line Chart */}
          <div className="bg-white rounded-xl p-4 flex-1 shadow-sm flex flex-col relative overflow-hidden transition-transform duration-300 hover:scale-105">
            <div className="text-[10px] text-gray-500 mb-2 mt-5 font-medium">Utilização de Recursos</div>
            <div className="flex-1 w-full relative mt-2">
              <svg viewBox="0 0 100 40" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <path d="M 0 20 Q 20 30, 40 15 T 70 25 T 100 10" fill="none" stroke="#10b981" strokeWidth="3" />
                <path d="M 0 20 Q 20 30, 40 15 T 70 25 T 100 10 L 100 40 L 0 40 Z" fill="url(#green-grad)" opacity="0.2" />
                <defs>
                  <linearGradient id="green-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating element 2 - Directories (Right) */}
      <div 
        className="absolute -right-8 top-1/4 bg-white rounded-xl shadow-2xl p-4 w-56 border border-gray-100 hidden md:block z-20 transition-all duration-500 ease-out group-hover:translate-x-4 group-hover:-translate-y-2 group-hover:rotate-y-0 group-hover:rotate-z-0"
        style={{ transform: 'rotateY(-15deg) rotateZ(4deg) translateZ(40px)' }}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[11px] font-bold text-voke-dark">Colaboradores</h3>
          <div className="bg-gray-100 rounded-full px-2 py-1 flex items-center gap-1">
            <Search className="w-3 h-3 text-gray-400" />
            <span className="text-[8px] text-gray-400">Buscar...</span>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { name: "Ana Santos", role: "Gerente de RH", img: "1" },
            { name: "Carlos Silva", role: "Diretor Financeiro", img: "3" },
            { name: "Marina Costa", role: "Operações", img: "5" },
            { name: "Roberto Lima", role: "Logística", img: "8" }
          ].map((user, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                <img src={`https://i.pravatar.cc/100?img=${user.img}`} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-voke-dark">{user.name}</div>
                <div className="text-[9px] text-gray-500">{user.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating element 3 - Left chart */}
      <div 
        className="absolute -left-12 top-1/3 bg-white rounded-xl shadow-2xl p-4 w-48 border border-gray-100 hidden md:block z-0 transition-all duration-500 ease-out group-hover:-translate-x-4 group-hover:translate-y-2 group-hover:rotate-y-0 group-hover:rotate-z-0"
        style={{ transform: 'rotateY(10deg) rotateZ(-6deg) translateZ(-20px)' }}
      >
        <h3 className="text-[10px] font-bold text-voke-dark mb-1">Despesas vs Receitas</h3>
        <div className="text-lg font-bold text-voke-blue mb-2">R$ 2.5M</div>
        <div className="w-full h-24 relative mt-2">
          <svg viewBox="0 0 100 40" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <path d="M 0 35 L 20 25 L 40 30 L 60 15 L 80 20 L 100 5" fill="none" stroke="#4A6FA5" strokeWidth="2" />
            <circle cx="100" cy="5" r="2" fill="#4A6FA5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Login, 2: Código
  const [code, setCode] = useState('');
  const [receivedCode, setReceivedCode] = useState('');
  const [loginEmail, setLoginEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await auth.login(email, password);
      // Simula a verificação em duas etapas se for requerido
      if (res.status === 'verification_required') {
        setReceivedCode(res.code);
        setLoginEmail(res.email);
        setStep(2);
        setLoading(false);
        toast.confirm(`[SIMULAÇÃO] Seu código de verificação é: ${res.code}. Copie e cole no campo a seguir.`, 'Verificação em Duas Etapas', 'alert');
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setError('E-mail ou senha incorretos. Tente novamente.');
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await auth.verifyAccount(loginEmail, code, receivedCode);
      window.location.href = '/';
    } catch (err) {
      setError('Código de verificação incorreto.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans text-voke-dark bg-white">
      {/* Left/Top Section (Dark Background) */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-[#323c4a] to-[#1a202c] relative overflow-hidden flex-col items-center justify-center p-6 lg:p-12 min-h-[60vh] lg:min-h-screen">
        
        {/* Abstract background lines simulating the tech circuit in the image */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <path d="M -100 200 Q 300 400 800 100 T 1500 300" fill="none" stroke="white" strokeWidth="1" />
            <path d="M -100 600 Q 400 300 900 500 T 1500 700" fill="none" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        <div className="z-20 text-center max-w-3xl w-full mt-8 lg:-mt-16">
          <div className="flex items-center justify-center mb-10 text-white">
            <VokeLogo className="h-40 lg:h-56 w-auto drop-shadow-lg" />
          </div>
          <h1 className="text-3xl lg:text-[2.5rem] font-bold text-white mb-4 leading-tight whitespace-nowrap">
            Gestão 360º da sua operação
          </h1>
          <p className="text-lg text-gray-300 font-light px-4">
            RH, Financeiro, Frota e Operacional em um único ecossistema inteligente
          </p>
        </div>

        <div className="w-full z-10 mt-4 mb-12 lg:mb-24">
          <DashboardMockup />
        </div>
      </div>

      {/* Right/Bottom Section (Login Form) */}
      <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center p-8 lg:p-16 min-h-screen lg:min-h-0 relative z-30">
        <div className="max-w-[400px] w-full mx-auto">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center mb-12 lg:hidden text-voke-dark">
            <VokeLogo className="h-32 w-auto drop-shadow-md" />
          </div>

          <h2 className="text-3xl font-bold mb-8 text-voke-dark text-center lg:text-left">Acessar Voke Field</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-voke-dark placeholder-gray-500 focus:ring-2 focus:ring-voke-blue focus:border-transparent transition-all font-medium"
                    placeholder="E-mail"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-voke-dark placeholder-gray-500 focus:ring-2 focus:ring-voke-blue focus:border-transparent transition-all font-medium"
                    placeholder="Senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded bg-white group-hover:border-voke-blue transition-colors">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="absolute inset-0 bg-voke-blue rounded opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Lembrar acesso</span>
                </label>
                <a href="#" className="text-sm font-medium text-[#1e3a5f] hover:text-voke-blue transition-colors underline underline-offset-4">
                  Esqueci minha senha
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 bg-[#1e3a5f] hover:bg-[#152a45] text-white rounded-xl font-semibold text-lg transition-all mt-6 shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'}`}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-voke-dark mb-2">Verifique seu E-mail</h3>
                <p className="text-sm text-gray-600">
                  Para sua segurança, enviamos um código de ativação para <strong className="text-voke-blue">{loginEmail}</strong>.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 text-center mb-2">Código de Verificação</label>
                <input 
                  type="text" 
                  maxLength="6"
                  required 
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="block w-full py-4 bg-gray-50 border-2 border-[#1e3a5f] rounded-xl text-voke-dark placeholder-gray-300 focus:ring-0 focus:border-voke-blue transition-all font-bold text-3xl tracking-[0.5em] text-center"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl font-semibold text-lg transition-all mt-6 shadow-lg shadow-green-900/20 flex justify-center items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'}`}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verificar e Entrar'}
              </button>
              <div className="text-center mt-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-medium text-gray-500 hover:text-voke-dark transition-colors"
                >
                  Voltar para E-mail
                </button>
              </div>
            </form>
          )}

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-600">
              Ainda não é cliente? <a href="#" className="font-semibold text-voke-dark hover:text-voke-blue transition-colors underline underline-offset-4">Fale com um consultor</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
