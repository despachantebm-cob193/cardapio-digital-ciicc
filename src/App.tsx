import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_SETTINGS } from './constants/defaults';
import {
  getCurrentSession,
  onSupabaseAuthStateChange,
  signOutFromSupabase,
  type AuthSession,
} from './features/auth/supabaseAuthService';
import {
  getProfileByAuthUserId,
  isActiveAdminProfile,
} from './features/auth/supabaseProfileService';
import {
  getSupabaseStoreSettings,
  listSupabaseProducts,
} from './features/supabase/supabaseCoreDataService';
import type { CustomerRegistration, Product, StoreSetting } from './types';
import CustomerView from './components/CustomerView';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import CustomerRegistrationGate from './components/CustomerRegistrationGate';
import { LogIn, ShoppingBag, Landmark, Settings, Flame, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSetting>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Customer Profile Registration State
  const [customerProfile, setCustomerProfile] = useState<CustomerRegistration | null>(null);

  // Layout View State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminAuthChecking, setAdminAuthChecking] = useState(true);


  const refreshCoreData = useCallback(async () => {
    const [newSettings, newProducts] = await Promise.all([
      getSupabaseStoreSettings(),
      listSupabaseProducts(),
    ]);

    setSettings(newSettings);
    setProducts(newProducts);
  }, []);

  // Boot & URL Parser
  useEffect(() => {
    // Load products/settings from Supabase.
    refreshCoreData()
      .catch((err) => {
        console.error('Falha ao carregar dados do Supabase:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    // 3. Trace Supabase Auth session and authorize admin access by Supabase profile role

    const handleSupabaseSession = async (session: AuthSession | null) => {
      setAdminAuthChecking(true);

      if (!session?.user) {
        setAdminAuthenticated(false);
        setAdminAuthChecking(false);
        return;
      }

      try {
        const profile = await getProfileByAuthUserId(session.user.id);

        if (isActiveAdminProfile(profile)) {
          setAdminAuthenticated(true);
          setIsAdminMode(true);
        } else {
          setAdminAuthenticated(false);
          console.warn('Sessão Supabase Auth encontrada, mas sem profile admin ativo.');
        }
      } catch (err) {
        setAdminAuthenticated(false);
        console.error('Falha ao carregar profile Supabase Auth:', err);
      } finally {
        setAdminAuthChecking(false);
      }
    };

    getCurrentSession()
      .then(handleSupabaseSession)
      .catch((err) => {
        setAdminAuthChecking(false);
        console.error('Falha ao verificar sessão Supabase Auth:', err);
      });

    const unsubscribeSupabaseAuth = onSupabaseAuthStateChange((session) => {
      void handleSupabaseSession(session);
    });

    return () => {
      unsubscribeSupabaseAuth();
    };
  }, [refreshCoreData]);

  const handleCustomerLogout = async () => {
    try {
      await signOutFromSupabase();
      setCustomerProfile(null);
    } catch (e) {
      console.error("Erro ao deslogar cliente:", e);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await signOutFromSupabase();
    } catch (e) {
      console.error('Erro ao encerrar sessão Supabase admin:', e);
    } finally {
      setAdminAuthenticated(false);
      setAdminAuthChecking(false);
      setIsAdminMode(false);
    }
  };

  if (loading) {
    return (
      <div id="boot-loader" className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
        <h3 className="font-display font-medium text-white text-sm">Carregando cardápio digital...</h3>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-800 antialiased selection:bg-amber-100 selection:text-amber-900">
      
      {/* Absolute Header Ribbon Controller */}
      {adminAuthenticated ? (
        <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-zinc-150 py-3.5 px-4 shadow-2xs">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setIsAdminMode(false)}
              className="flex items-center gap-1.5 focus:outline-none text-left cursor-pointer group"
            >
              <Flame className="w-5 h-5 text-amber-500 group-hover:rotate-12 transition-transform" />
              <span className="font-display font-black text-sm uppercase tracking-wide bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">
                {settings.storeName || 'Cardápio Digital'}
              </span>
            </button>

            {/* Screen mode Toggle */}
            <div className="flex bg-zinc-100 p-1 rounded-xl">
              <button
                id="switch-client-mode-btn"
                onClick={() => {
                  setIsAdminMode(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  !isAdminMode
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Cardápio</span>
              </button>
              <button
                id="switch-admin-mode-btn"
                onClick={() => {
                  setIsAdminMode(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  isAdminMode
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Painel Geral</span>
              </button>
              <button
                id="admin-top-signout-btn"
                onClick={handleAdminLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 text-rose-600 hover:bg-rose-50"
                title="Sair do painel administrativo"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </header>
      ) : null}

      {/* Primary Display Layout with AnimatePresence */}
      <main className="min-h-[85vh]">
        <AnimatePresence mode="wait">
          {!isAdminMode ? (
            !customerProfile ? (
              // Compulsory Customer Onboarding registration gate
              <motion.div
                key="customer-gate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CustomerRegistrationGate
                  onAccessGranted={(profile) => setCustomerProfile(profile)}
                  onAdminAccess={() => setIsAdminMode(true)}
                />
              </motion.div>
            ) : (
              // Customer Digital Menu Screen
              <motion.div
                key="customer-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CustomerView
                  products={products}
                  settings={settings}
                  customerProfile={customerProfile}
                  onLogout={handleCustomerLogout}
                />
              </motion.div>
            )
          ) : adminAuthChecking ? (
            <motion.div
              key="admin-auth-checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[80vh] flex flex-col items-center justify-center gap-4"
            >
              <div className="w-10 h-10 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
              <p className="text-sm font-medium text-zinc-600">
                Verificando acesso administrativo...
              </p>
            </motion.div>
          ) : !adminAuthenticated ? (
            // Admin passcode / google auth gate
            <motion.div
              key="login-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <AdminLogin
                onLoginSuccess={() => setAdminAuthenticated(true)}
                onBack={() => setIsAdminMode(false)}
              />
            </motion.div>
          ) : (
            // Admin Panel Workspace
            <motion.div
              key="admin-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminPanel
                products={products}
                settings={settings}
                onCoreDataChanged={refreshCoreData}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Credentials */}
      <footer className="py-8 bg-zinc-900 text-zinc-500 text-xs border-t border-zinc-850 px-4 text-center pb-28 sm:pb-12">
        <div className="max-w-4xl mx-auto space-y-1">
          <p className="font-medium text-zinc-400">
            {settings.storeName || 'Cardápio Digital'} • Todos os direitos reservados.
          </p>
          <p className="text-[10px] font-light">
            Desenvolvido com tecnologia segura de persistência na nuvem Supabase.
          </p>
        </div>
      </footer>

    </div>
  );
}
