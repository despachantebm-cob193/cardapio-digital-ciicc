import { useState, useEffect } from 'react';
import {
  subscribeProducts,
  subscribeStoreSettings,
  seedInitialDataIfNeeded,
  DEFAULT_SETTINGS,
  CustomerRegistration
} from './dbService';
import { auth } from './firebase';
import {
  getCurrentSession,
  onSupabaseAuthStateChange,
  type AuthSession,
} from './features/auth/supabaseAuthService';
import { Product, StoreSetting } from './types';
import CustomerView from './components/CustomerView';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import CustomerRegistrationGate from './components/CustomerRegistrationGate';
import QRScannerModal from './components/QRScannerModal';
import { LogIn, ShoppingBag, Landmark, Settings, Flame } from 'lucide-react';
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
  const [currentTable, setCurrentTable] = useState<string | null>(null);

  // Live QR Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Boot & URL Parser
  useEffect(() => {
    // 1. Detect Table Code inside URL query params (e.g. ?mesa=04 or ?table=04)
    const searchParams = new URL(window.location.href).searchParams;
    const tableParam = searchParams.get('mesa') || searchParams.get('table');
    if (tableParam) {
      setCurrentTable(tableParam);
    }

    // 2. Clear out seed and populate initial demo products if collection is empty
    // (Now handled securely when an administrator is authenticated below to prevent permissions errors)

    // 3. Connect real-time subscribe snapshots to cloud Firestore
    const unsubscribeSettings = subscribeStoreSettings(
      (newSettings) => {
        setSettings(newSettings);
        setLoading(false);
      },
      (err) => {
        console.error('Falha ao sincronizar dados de settings:', err);
        setLoading(false);
      }
    );

    const unsubscribeProducts = subscribeProducts(
      (newProducts) => {
        setProducts(newProducts);
      },
      (err) => {
        console.error('Falha ao sincronizar lista de produtos:', err);
      }
    );

    // 4. Trace if there is a persistent Firebase Google login credentials
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user && user.emailVerified) {
        setAdminAuthenticated(true);
        // Seed initial products/settings securely on verified administrative connection
        seedInitialDataIfNeeded().catch((e) => console.log('Erro ao semear dados iniciais:', e));
      }
    });

    // 5. Trace Supabase Auth session for the new controlled Google login flow
    const handleSupabaseSession = (session: AuthSession | null) => {
      if (session?.user) {
        setAdminAuthenticated(true);
      }
    };

    getCurrentSession()
      .then(handleSupabaseSession)
      .catch((err) => {
        console.error('Falha ao verificar sessão Supabase Auth:', err);
      });

    const unsubscribeSupabaseAuth = onSupabaseAuthStateChange(handleSupabaseSession);

    return () => {
      unsubscribeSettings();
      unsubscribeProducts();
      unsubscribeAuth();
      unsubscribeSupabaseAuth();
    };
  }, []);

  const handleQRScanSuccess = (decodedText: string) => {
    try {
      // Decode scanned contents. If it is a URL, parse its params
      if (decodedText.includes('?')) {
        const decodedUrl = new URL(decodedText, window.location.origin);
        const table = decodedUrl.searchParams.get('mesa') || decodedUrl.searchParams.get('table');
        if (table) {
          setCurrentTable(table);
          // Set new query parameter on history
          const newUrl = `${window.location.pathname}?mesa=${table}`;
          window.history.replaceState({}, '', newUrl);
          return;
        }
      }

      // If it's just a raw code or number, set it directly!
      if (decodedText.trim().length > 0) {
        setCurrentTable(decodedText.trim());
        const newUrl = `${window.location.pathname}?mesa=${decodedText.trim()}`;
        window.history.replaceState({}, '', newUrl);
      }
    } catch (e) {
      // Safe fallback if scanned standard item
      setCurrentTable(decodedText);
    }
  };

  const handleTableChange = (table: string | null) => {
    setCurrentTable(table);
    const newUrl = table ? `${window.location.pathname}?mesa=${table}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  };

  const handleCustomerLogout = async () => {
    try {
      await auth.signOut();
      setCustomerProfile(null);
    } catch (e) {
      console.error("Erro ao deslogar cliente:", e);
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
      {(!isAdminMode && !customerProfile) ? null : (
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
            </div>
          </div>
        </header>
      )}

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
                  currentTable={currentTable}
                  onTableChange={handleTableChange}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  customerProfile={customerProfile}
                  onLogout={handleCustomerLogout}
                />
              </motion.div>
            )
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
                onExitAdmin={() => setIsAdminMode(false)}
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
            Desenvolvido com tecnologia segura de persistência na nuvem Firebase Firestore.
          </p>
        </div>
      </footer>

      {/* Global Device QR Camera Scanner Modal popup */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
}
