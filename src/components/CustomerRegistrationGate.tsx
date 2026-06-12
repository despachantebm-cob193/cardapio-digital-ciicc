import React, { useState, useEffect, useRef } from 'react';
import { auth, loginWithGoogle } from '../firebase';
import { getCustomerRegistration, saveCustomerRegistration, CustomerRegistration } from '../dbService';
import { Camera, User, Briefcase, Clock, Sparkles, LogIn, RefreshCw, Check, AlertCircle, HelpCircle, Upload, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerRegistrationGateProps {
  onAccessGranted: (info: CustomerRegistration) => void;
  onAdminAccess?: () => void;
}

export default function CustomerRegistrationGate({ onAccessGranted, onAdminAccess }: CustomerRegistrationGateProps) {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [checkingRegistration, setCheckingRegistration] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [shiftHours, setShiftHours] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Trace Authentication changes
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setCheckingRegistration(true);
        // Load default name if empty
        setName(currentUser.displayName || '');
        try {
          // See if registration already exists
          const existingProfile = await getCustomerRegistration(currentUser.uid);
          if (existingProfile) {
            onAccessGranted(existingProfile);
          }
        } catch (e) {
          console.error("Erro ao carregar registro de cliente:", e);
        } finally {
          setCheckingRegistration(false);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsub();
      stopCamera();
    };
  }, [onAccessGranted]);

  // Handle Google Sing-in
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  // Camera activation Web API
  const startCamera = async () => {
    setCameraError(null);
    setCameraLoading(true);
    setCameraActive(true);

    if (streamRef.current) {
      stopCamera();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front selfie capture preferred
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch(e => console.log("Video play error:", e));
      }
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);
      setCameraError(
        'Não foi possível acessar a câmera do dispositivo. Por favor, conceda permissão de câmera para continuar.'
      );
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Canvas Image screenshot capture
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // We set canvas dimension to ideal small photo format (e.g. 400x300) for fast saving
        canvas.width = 400;
        canvas.height = 300;

        // Draw image keeping original ratio or slightly scale to cover
        context.drawImage(video, 0, 0, 400, 300);

        // Convert context to compressed base64 JPEG format (0.75 quality is light and crisp)
        const base64Data = canvas.toDataURL('image/jpeg', 0.75);
        setPhotoBase64(base64Data);
        stopCamera();
      }
    }
  };

  // Clean / reset captured photo to snap again
  const retakePhoto = () => {
    setPhotoBase64(null);
    startCamera();
  };

  // Upload photo file as fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1000000) {
        setCameraError("A imagem selecionada é muito grande. Escolha uma foto com menos de 1MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoBase64(reader.result);
          setCameraError(null);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Form Submit Action
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim() || !workplace.trim() || !shiftHours.trim() || !photoBase64) {
      return;
    }

    try {
      setCheckingRegistration(true);
      const registrationData = {
        uid: user.uid,
        name: name.trim(),
        email: user.email || '',
        workplace: workplace.trim(),
        shiftHours: shiftHours.trim(),
        photoUrl: photoBase64
      };

      await saveCustomerRegistration(registrationData);
      
      const completeRegObj = {
        ...registrationData,
        createdAt: new Date().toISOString()
      };
      
      onAccessGranted(completeRegObj);
    } catch (err) {
      console.error("Erro ao salvar cadastro do cliente:", err);
      alert("Falha ao salvar dados de acesso no banco de dados. Tente novamente.");
    } finally {
      setCheckingRegistration(false);
    }
  };

  if (loading || checkingRegistration) {
    return (
      <div id="gate-loader" className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mb-4" />
        <h3 className="font-display font-medium text-white text-base">Verificando autorização...</h3>
        <p className="text-zinc-400 text-xs mt-1 max-w-xs leading-relaxed">
          Por favor, aguarde enquanto asseguramos sua conexão segura com o sistema de refeições.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Amber top line glow */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

        {/* Outer Background Glow Grid Detail */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 md:p-8 relative z-10">
          
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-3.5">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="font-display font-black text-xl text-white tracking-tight uppercase">
              Acesso ao Cardápio
            </h2>
            <p className="text-zinc-400 text-xs mt-1 sm:max-w-xs">
              Para visualizar os pratos e pedir, faça login e registre suas informações de turno.
            </p>
          </div>

          {!user ? (
            /* STEP 1: Google Identity required */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pt-2"
            >
              <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-850 text-left space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Políticas de Acesso</span>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  Este cardápio atende exclusivamente a colaboradores verificados. É obrigatório registrar seu <strong>Nome completo</strong>, seu <strong>Local de trabalho</strong> e <strong>foto de identificação do turno</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-4 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm tracking-wide rounded-2xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-2.5 active:scale-98"
              >
                <LogIn className="w-4 h-4 text-zinc-900" />
                <span>Entrar Obrigatoriamente com Google</span>
              </button>

              {onAdminAccess && (
                <div className="pt-2">
                  <div className="relative mb-5 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-800" />
                    </div>
                    <span className="relative px-3 bg-zinc-900 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Gestão do Sistema</span>
                  </div>

                  <button
                    type="button"
                    onClick={onAdminAccess}
                    className="w-full py-3.5 px-4 bg-zinc-850 hover:bg-zinc-800 text-amber-500 font-bold text-xs uppercase tracking-wider rounded-2xl cursor-pointer transition-all border border-zinc-800/60 flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Settings className="w-4 h-4 text-amber-500" />
                    <span>Entrar no Painel Admin (PIN)</span>
                  </button>
                </div>
              )}

              <p className="text-[10px] text-zinc-500 text-center">
                Processado por autenticação Google legada enquanto a migração para Supabase é validada.
              </p>
            </motion.div>
          ) : (
            /* STEP 2: Required registration fields & Selfie capture */
            <motion.form
              onSubmit={handleSubmitRegistration}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5 text-left"
            >
              {/* Logged in Email tag */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950/40 rounded-xl border border-zinc-850">
                <div className="flex items-center gap-1.5 truncate">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-mono text-zinc-400 truncate">
                    Conta: {user.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => auth.signOut()}
                  className="text-[10px] text-red-400 hover:text-red-300 underline font-medium cursor-pointer"
                >
                  Sair
                </button>
              </div>

              {/* Input: Nome */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Nome Completo <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={150}
                    placeholder="Seu nome e sobrenome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-3 pl-10 pr-4 bg-zinc-950 border border-zinc-800 focus:border-amber-500/50 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Input: Local de Trabalho */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Local de Trabalho / Filial <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={150}
                    placeholder="Ex: Refeitório Matriz, Loja 02, etc"
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                    className="w-full py-3 pl-10 pr-4 bg-zinc-950 border border-zinc-800 focus:border-amber-500/50 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Input: Horário do Turno */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Horário do seu Turno <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={150}
                    placeholder="Ex: 08:00 - 16:00 ou Turno A"
                    value={shiftHours}
                    onChange={(e) => setShiftHours(e.target.value)}
                    className="w-full py-3 pl-10 pr-4 bg-zinc-950 border border-zinc-800 focus:border-amber-500/50 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* COMPULSORY Photo camera section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Foto de Identificação (Obrigatória) <span className="text-amber-500">*</span>
                </label>

                <div className="relative w-full aspect-video rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center">
                  
                  {/* Real-time Video Stream view */}
                  {cameraActive && (
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" // mirror effect
                      muted
                      playsInline
                    />
                  )}

                  {/* Captured Static Photo View */}
                  {photoBase64 && (
                    <img
                      src={photoBase64}
                      alt="Selfie cadastrada"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {/* Placeholder when no camera active and no photo snapped */}
                  {!cameraActive && !photoBase64 && (
                    <div className="p-4 text-center flex flex-col items-center gap-2">
                      <Camera className="w-8 h-8 text-zinc-600" />
                      <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
                        Toque no botão abaixo para ativar a câmera frontal do aparelho e capturar seu rosto.
                      </p>
                    </div>
                  )}

                  {cameraLoading && (
                    <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-2 z-20">
                      <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                      <span className="text-[10px] text-zinc-400 font-medium">Acessando câmera...</span>
                    </div>
                  )}
                </div>

                {/* Camera error feedback */}
                {cameraError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-300 leading-relaxed font-light">{cameraError}</p>
                  </div>
                )}

                {/* Camera actions buttons */}
                <div className="flex gap-2.5">
                  {!cameraActive && !photoBase64 && (
                    <>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex-1 py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-750"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-500" />
                        <span>Ativar Câmera</span>
                      </button>

                      <label className="flex-1 py-2.5 px-3 bg-zinc-805 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-750 text-center relative">
                        <Upload className="w-3.5 h-3.5 text-amber-500" />
                        <span>Fazer Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </>
                  )}

                  {cameraActive && (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-amber-500/25 shadow-md"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Tirar Foto de Turno</span>
                    </button>
                  )}

                  {photoBase64 && (
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="w-full py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-750"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Capturar Outra Foto</span>
                    </button>
                  )}

                  {cameraActive && (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="py-2.5 px-4 bg-red-950/30 text-red-400 hover:bg-red-950/50 hover:text-red-300 rounded-xl text-xs font-semibold cursor-pointer border border-red-900/20"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {/* Invisible hidden canvas used to capture and crop images */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Submit Final Button */}
              <button
                type="submit"
                disabled={!name.trim() || !workplace.trim() || !shiftHours.trim() || !photoBase64}
                className={`w-full py-4 px-4 font-bold text-xs uppercase tracking-wider rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  name.trim() && workplace.trim() && shiftHours.trim() && photoBase64
                    ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-md active:scale-98'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-850'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Registrar Acesso e Abrir Cardápio</span>
              </button>

              <div className="flex justify-center items-center gap-1 text-[9px] text-zinc-500">
                <HelpCircle className="w-2.5 h-2.5 text-zinc-600" />
                <span>Todos os campos com (*) são estritamente obrigatórios.</span>
              </div>
            </motion.form>
          )}

        </div>
      </div>
    </div>
  );
}
