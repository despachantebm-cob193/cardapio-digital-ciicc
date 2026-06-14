import { useState, useMemo, type ChangeEvent, type FormEvent } from 'react';
import {
  Search,
  Copy,
  Check,
  Phone,
  QrCode,
  MapPin,
  Utensils,
  Plus,
  Minus,
  ShoppingCart,
  X,
  CreditCard,
  Clock,
  Sparkles,
  ShoppingBag,
  DollarSign,
  User,
  Briefcase,
  Upload,
  RefreshCw,
  Save,
  LogOut,
  History,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, StoreSetting, CustomerRegistration } from '../types';
import { createSupabaseSale, updateCurrentCustomerProfile, listSupabaseSalesByCustomerProfileId, type SupabaseCustomerProfile, type SupabaseSale } from '../features/supabase/supabaseCoreDataService';
import { ProductIcon, getProductIconText } from './ProductIcon';
import { supabase } from '../lib/supabaseClient';

interface CustomerViewProps {
  products: Product[];
  settings: StoreSetting;
  currentTable?: string | null;
  onTableChange?: (table: string | null) => void;
  onOpenScanner?: () => void;
  customerProfile?: CustomerRegistration | null;
  onLogout?: () => void;
  onCoreDataChanged?: () => Promise<void> | void;
  onProfileUpdated?: (profile: CustomerRegistration) => void;
}

export default function CustomerView({
  products,
  settings,
  currentTable,
  onTableChange,
  onOpenScanner,
  customerProfile,
  onLogout,
  onCoreDataChanged,
  onProfileUpdated
}: CustomerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [menuViewMode, setMenuViewMode] = useState<'minimal' | 'list' | 'grid' | 'cards'>('list');
  const [copiedPix, setCopiedPix] = useState(false);
  const [cartNotice, setCartNotice] = useState<string | null>(null);

  // Editable customer profile state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileWorkplace, setProfileWorkplace] = useState('');
  const [profileShiftHours, setProfileShiftHours] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  // Customer purchase history state
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<SupabaseSale[]>([]);
  const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false);
  const [purchaseHistoryError, setPurchaseHistoryError] = useState<string | null>(null);

  // Simple shopping cart state
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout and payment method selection states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'later' | 'pix' | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [isUploadingPaymentProof, setIsUploadingPaymentProof] = useState(false);
  const [checkedOutSaleId, setCheckedOutSaleId] = useState<string | null>(null);


  // Only show products being offered (available)
  const offeredProducts = useMemo(() => {
    return products.filter((p) => p.available === true && (p.stockAvailable ?? 0) > 0);
  }, [products]);

  // Extract categories dynamically from offered products
  const categories = useMemo(() => {
    const list = new Set<string>();
    offeredProducts.forEach((p) => {
      if (p.category) list.add(p.category);
    });
    return ['all', ...Array.from(list)];
  }, [offeredProducts]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return offeredProducts.filter((product) => {
      const matchSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [offeredProducts, searchQuery, selectedCategory]);

  // Cart operations
  const handleAddToCart = (id: string) => {
    const product = products.find((p) => p.id === id);
    const stockAvailable = product?.stockAvailable ?? 0;
    const currentQuantity = cart[id] || 0;

    setCartNotice(null);

    if (!product || product.available !== true || stockAvailable <= 0) {
      setCartNotice('Este item não possui estoque disponível no momento.');
      return;
    }

    if (currentQuantity >= stockAvailable) {
      setCartNotice(`Estoque máximo atingido para ${product.name}: ${stockAvailable} unidade(s).`);
      return;
    }

    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[id] <= 1) {
        delete next[id];
      } else {
        next[id] -= 1;
      }
      return next;
    });
  };

  const cartTotal = useMemo(() => {
    let sum = 0;
    Object.entries(cart).forEach(([id, qtyVal]) => {
      const qty = qtyVal as number;
      const prod = products.find((p) => p.id === id);
      if (prod) sum += prod.price * qty;
    });
    return sum;
  }, [cart, products]);

  const cartItemsCount = useMemo(() => {
    return Object.values(cart).reduce((sum: number, qty: number) => sum + qty, 0);
  }, [cart]);

  const handleOpenProfileModal = () => {
    if (!customerProfile) return;

    setProfileName(customerProfile.name || '');
    setProfileWorkplace(customerProfile.workplace || '');
    setProfileShiftHours(customerProfile.shiftHours || '');
    setProfilePhotoUrl(customerProfile.photoUrl || '');
    setProfileError(null);
    setProfileSaved(false);
    setIsProfileModalOpen(true);
  };

  const handleProfilePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 1000000) {
      setProfileError('A imagem selecionada é muito grande. Escolha uma foto com menos de 1MB.');
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setProfilePhotoUrl(reader.result);
        setProfileError(null);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSaveCustomerProfile = async (e: FormEvent) => {
    e.preventDefault();

    if (!customerProfile) return;

    const authUserId = customerProfile.uid || customerProfile.id;

    if (!authUserId) {
      setProfileError('Não foi possível identificar sua sessão de usuário.');
      return;
    }

    if (!profileName.trim() || !profileWorkplace.trim() || !profileShiftHours.trim() || !profilePhotoUrl) {
      setProfileError('Preencha nome, local de trabalho, turno e foto de perfil.');
      return;
    }

    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);

    try {
      const savedProfile = await updateCurrentCustomerProfile({
        authUserId,
        displayName: profileName.trim(),
        workplace: profileWorkplace.trim(),
        shiftHours: profileShiftHours.trim(),
        photoUrl: profilePhotoUrl,
      });

      const updatedCustomerProfile: CustomerRegistration = {
        id: savedProfile.id,
        uid: savedProfile.authUserId,
        name: savedProfile.displayName,
        email: savedProfile.email,
        workplace: savedProfile.workplace,
        shiftHours: savedProfile.shiftHours,
        photoUrl: savedProfile.photoUrl,
        createdAt: savedProfile.createdAt || customerProfile.createdAt || new Date().toISOString(),
      };

      onProfileUpdated?.(updatedCustomerProfile);
      setProfileSaved(true);

      window.setTimeout(() => {
        setIsProfileModalOpen(false);
        setProfileSaved(false);
      }, 700);
    } catch (err) {
      console.error('Erro ao atualizar perfil do cliente:', err);
      setProfileError('Não foi possível salvar seu perfil. Verifique sua conexão e tente novamente.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Copy PIX Predefined Key Action
  const handleCopyPix = () => {
    if (!settings.pixKey) return;
    navigator.clipboard.writeText(settings.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  // WhatsApp click generator

  const resolveSupabaseErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;

    if (error && typeof error === 'object') {
      const record = error as { code?: string; message?: string; details?: string; hint?: string };
      const parts = [record.code, record.message, record.details, record.hint].filter(Boolean);

      if (parts.length > 0) {
        return parts.join(' | ');
      }

      try {
        return JSON.stringify(error);
      } catch {
        return 'Erro desconhecido.';
      }
    }

    return String(error || 'Erro desconhecido.');
  };

  const uploadPaymentProofFile = async (file: File): Promise<string> => {
    if (!supabase) {
      throw new Error('Supabase indisponível para enviar o comprovante. Verifique a configuração do ambiente.');
    }

    const rawExtension = file.name.split('.').pop() || 'jpg';
    const extension = rawExtension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
    const customerKey = String(
      (customerProfile as { id?: string; uid?: string; authUserId?: string })?.id ||
      (customerProfile as { id?: string; uid?: string; authUserId?: string })?.uid ||
      (customerProfile as { id?: string; uid?: string; authUserId?: string })?.authUserId ||
      'cliente'
    ).replace(/[^a-zA-Z0-9_-]/g, '-');

    const proofPath = `${customerKey}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(proofPath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(proofPath);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Upload concluído, mas o link público do comprovante não foi gerado.');
    }

    return publicUrlData.publicUrl;
  };

  const handleUploadPaymentProof = async () => {
    if (!paymentProofFile) {
      setOrderError('Selecione o comprovante antes de confirmar o anexo.');
      return;
    }

    setIsUploadingPaymentProof(true);
    setOrderError(null);

    try {
      const publicUrl = await uploadPaymentProofFile(paymentProofFile);
      setPaymentProofUrl(publicUrl);
      setOrderError(null);
    } catch (e) {
      const message = resolveSupabaseErrorMessage(e);
      console.error('Erro ao enviar comprovante:', e);
      setPaymentProofUrl(null);
      setOrderError(`Não foi possível enviar o comprovante. Detalhe técnico: ${message}`);
    } finally {
      setIsUploadingPaymentProof(false);
    }
  };

  const handleWhatsAppOrderRedirect = () => {
    const number = settings.whatsappNumber || '55Unknown';
    let baseMsg = settings.whatsappMessage || 'Olá! Gostaria de fazer um pedido.';

    // If customer has selected items, build a gorgeous receipt summary!
    if (cartItemsCount > 0) {
      let itemsList = '';
      Object.entries(cart).forEach(([id, qtyVal]) => {
        const qty = qtyVal as number;
        const prod = products.find((p) => p.id === id);
        if (prod) {
          itemsList += `\n• *${qty}x* ${getProductIconText(prod.emoji)} ${prod.name} (R$ ${(prod.price * qty).toFixed(2)})`;
        }
      });

      const tableSection = '';
      baseMsg = `Olá! Estou notificando uma aquisição realizada na loja física do CIICC.\n\n${itemsList}\n\n*Total:* R$ ${cartTotal.toFixed(2)}\n*Forma de pagamento sugerida:* PIX 💵\n\n_Chave PIX para pagamento: ${settings.pixKey}_`;
    } else if (currentTable) {
      baseMsg = `Olá! Gostaria de falar com o atendimento sobre uma aquisição na loja física do CIICC.`;
    }

    const encodedText = encodeURIComponent(baseMsg);
    const waUrl = `https://wa.me/${number}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  const handleOpenPurchaseHistory = async () => {
    setIsPurchaseHistoryOpen(true);
    setPurchaseHistoryError(null);

    if (!customerProfile?.id) {
      setPurchaseHistory([]);
      setPurchaseHistoryError('Não foi possível identificar seu perfil para carregar o histórico.');
      return;
    }

    setPurchaseHistoryLoading(true);

    try {
      const sales = await listSupabaseSalesByCustomerProfileId(customerProfile.id);
      setPurchaseHistory(sales);
    } catch (err) {
      console.error('Erro ao carregar histórico de aquisições:', err);
      setPurchaseHistoryError('Não foi possível carregar seu histórico de aquisições agora.');
    } finally {
      setPurchaseHistoryLoading(false);
    }
  };

  const handleOpenAdminWhatsapp = () => {
    const cleanNumber = (settings.whatsappNumber || '').replace(/\D/g, '');

    if (!cleanNumber) {
      window.alert('WhatsApp administrativo ainda não configurado. Solicite ao administrador cadastrar o número no painel.');
      return;
    }

    const customerName = customerProfile?.name || 'Cliente';
    const customerWorkplace = customerProfile?.workplace || 'Não informado';
    const customerShift = customerProfile?.shiftHours || 'Não informado';

    const message = [
      'Olá! Quero falar com o admin do Cardápio Digital CIICC.',
      '',
      'Assunto: pedido, crítica, sugestão ou dúvida.',
      '',
      'Meus dados:',
      `Nome: ${customerName}`,
      `Local de trabalho: ${customerWorkplace}`,
      `Turno: ${customerShift}`,
    ].join('\n');

    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Secure checkout & acquisition confirmation
  const handleConfirmPurchase = async () => {
    if (!selectedPaymentMethod) return;

    if (selectedPaymentMethod === 'pix' && !paymentProofFile) {
      setOrderError('Anexe o comprovante do pagamento PIX antes de confirmar a aquisição.');
      return;
    }

    let confirmedPaymentProofUrl = paymentProofUrl;

    if (selectedPaymentMethod === 'pix' && !confirmedPaymentProofUrl) {
      setIsUploadingPaymentProof(true);
      setOrderError(null);

      try {
        confirmedPaymentProofUrl = await uploadPaymentProofFile(paymentProofFile);
        setPaymentProofUrl(confirmedPaymentProofUrl);
      } catch (e) {
        const message = resolveSupabaseErrorMessage(e);
        console.error('Erro ao enviar comprovante antes de registrar aquisição:', e);
        setOrderError(`Não foi possível enviar o comprovante PIX. Detalhe técnico: ${message}`);
        setIsUploadingPaymentProof(false);
        return;
      }

      setIsUploadingPaymentProof(false);
    }

    setIsSubmittingOrder(true);
    setOrderError(null);

    try {
      const saleItems = Object.entries(cart).map(([id, qty]) => {
        const prod = products.find((p) => p.id === id);
        return {
          productId: id,
          name: prod ? prod.name : 'Produto',
          quantity: qty as number,
          price: prod ? prod.price : 0,
          emoji: prod ? prod.emoji : '🍽️'
        };
      });

      const customerProfileId =
        (customerProfile as { id?: string; uid?: string; authUserId?: string })?.id ||
        (customerProfile as { id?: string; uid?: string; authUserId?: string })?.uid ||
        (customerProfile as { id?: string; uid?: string; authUserId?: string })?.authUserId;

      if (!customerProfileId) {
        throw new Error('Cliente Supabase sem identificador válido para registrar a aquisição.');
      }

      const supabaseCustomerProfile: SupabaseCustomerProfile = {
        id: customerProfileId,
        authUserId:
          (customerProfile as { authUserId?: string; uid?: string })?.authUserId ||
          (customerProfile as { authUserId?: string; uid?: string })?.uid ||
          customerProfileId,
        email: customerProfile.email || '',
        displayName: customerProfile.name || 'Cliente',
        workplace: customerProfile.workplace || '',
        shiftHours: customerProfile.shiftHours || '',
        photoUrl: customerProfile.photoUrl || '',
        role: 'customer',
        status: 'active',
      };

      const saleId = await createSupabaseSale({
        customerProfile: supabaseCustomerProfile,
        items: saleItems.map((item) => ({
          productId: item.productId || null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          emoji: item.emoji,
        })),
        totalAmount: cartTotal,
        paymentMethod: selectedPaymentMethod,
        paymentProofUrl: selectedPaymentMethod === 'pix' ? confirmedPaymentProofUrl : null,
      });

      setCheckedOutSaleId(saleId);
      await onCoreDataChanged?.();
      setIsCheckoutModalOpen(false);
      setIsCartOpen(false);

      // Reset cart only after successful Supabase persistence
      setCart({});

      // Open WhatsApp to notify store owner
      const number = settings.whatsappNumber || '55Unknown';
      let itemsList = '';
      saleItems.forEach((item) => {
        itemsList += `\n• *${item.quantity}x* ${item.emoji} ${item.name} (R$ ${(item.price * item.quantity).toFixed(2)})`;
      });

      const tableSection = '';
      const methodLabel = selectedPaymentMethod === 'later'
        ? 'PAGAMENTO POSTERIOR (ACERTO COM A ADMINISTRAÇÃO)'
        : 'PAGAMENTO À VISTA VIA PIX ✅';

      const proofSection = selectedPaymentMethod === 'pix'
        ? `\n*Comprovante:* clique no link para ver o comprovante:\n${confirmedPaymentProofUrl || 'Link do comprovante não gerado'}`
        : '';

      const baseMsg = `Olá! Sou *${customerProfile?.name || 'Cliente'}* (${customerProfile?.workplace || 'Sem Setor'}). Estou notificando uma aquisição realizada na loja física do CIICC.\n\n${itemsList}\n\n*Total:* R$ ${cartTotal.toFixed(2)}\n*Forma de pagamento:* ${methodLabel}${proofSection}`;

      const encodedText = encodeURIComponent(baseMsg);

      const cleanWhatsappNumber = String(number).replace(/\D/g, '');
      const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      const whatsappUrl = isMobileDevice
        ? `https://wa.me/${cleanWhatsappNumber}?text=${encodedText}`
        : `https://web.whatsapp.com/send?phone=${cleanWhatsappNumber}&text=${encodedText}`;

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');


    } catch (e) {
      const message = resolveSupabaseErrorMessage(e);
      console.error('Erro ao processar aquisição:', e);
      setOrderError(`Não foi possível registrar sua aquisição no banco de dados. Sua aquisição ainda não apareceu no painel administrativo. Detalhe técnico: ${message}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div id="customer-view-container" className="min-h-screen bg-gradient-to-b from-orange-50 via-zinc-50 to-white pb-32">
      {/* Visual Header */}
      <div className="sticky top-0 z-40 overflow-hidden bg-orange-50/95 backdrop-blur-md border-b border-orange-100/80 pt-4 pb-2 shadow-sm shadow-orange-100/60">
        <div className="px-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-lg text-black font-bold">
                🍳
              </div>
              <div className="min-w-0">
                <h1 className="font-display font-black text-2xl text-zinc-950 leading-tight truncate tracking-tight">
                  {settings.storeName || 'Cardápio Digital'}
                </h1>
                <p className="text-orange-700/75 text-[10px] uppercase font-black tracking-wider">
                  Menu Digital Interativo
                </p>
              </div>
            </div>

            {customerProfile && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="ml-3 shrink-0 max-w-[54%] sm:max-w-none rounded-2xl bg-white/90 backdrop-blur-md border border-orange-100 px-2.5 py-2 shadow-md shadow-orange-100/60 flex items-center gap-2"
              >
                {customerProfile.photoUrl ? (
                  <img
                    src={customerProfile.photoUrl}
                    alt={customerProfile.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-2xl object-cover border border-orange-200 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center text-xs font-black text-orange-700 shrink-0">
                    {customerProfile.name.charAt(0)}
                  </div>
                )}

                <div className="min-w-0 flex flex-col items-start leading-tight">
                  <span className="max-w-[112px] sm:max-w-[190px] truncate text-xs font-black text-zinc-950">
                    {customerProfile.name}
                  </span>

                  <div className="mt-1 flex items-center gap-2">
                    <button
                      id="customer-profile-open-btn"
                      type="button"
                      onClick={handleOpenProfileModal}
                      className="w-6 h-6 rounded-lg bg-zinc-100 hover:bg-amber-100 text-zinc-600 hover:text-amber-700 flex items-center justify-center transition-colors cursor-pointer"
                      title="Editar perfil"
                      aria-label="Editar perfil"
                    >
                      <User className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id="customer-purchase-history-btn"
                      type="button"
                      onClick={handleOpenPurchaseHistory}
                      className="w-6 h-6 rounded-lg bg-zinc-100 hover:bg-emerald-100 text-zinc-600 hover:text-emerald-700 flex items-center justify-center transition-colors cursor-pointer"
                      title="Histórico de compras notificadas"
                      aria-label="Histórico de compras notificadas"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>

                    {onLogout && (
                      <button
                        id="customer-profile-signout-btn"
                        type="button"
                        onClick={onLogout}
                        className="w-6 h-6 rounded-lg bg-zinc-100 hover:bg-red-50 text-red-500 hover:text-red-650 flex items-center justify-center transition-colors cursor-pointer"
                        title="Sair"
                        aria-label="Sair"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Table Indicator Badge */}
          {currentTable && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/15 rounded-full text-xs text-amber-700 font-semibold"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Cliente na Mesa: {currentTable}</span>
              <button
                id="clear-table-btn"
                onClick={() => onTableChange?.(null)}
                className="ml-1.5 p-0.5 hover:bg-amber-500/20 rounded-full transition-colors font-bold text-[9px] cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}

          {/* Search bar input placeholder */}
          <div className="relative mb-5 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70 w-5 h-5" />
            <input
              id="product-search-bar"
              type="text"
              placeholder="Pesquisar por produto, ingrediente ou bebida..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-sm bg-white border border-white rounded-[24px] text-zinc-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/15 transition-all shadow-lg shadow-orange-100/60 placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button
                id="clear-search-btn"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer text-xs"
              >
                Limpar
              </button>
            )}
          </div>

        </div>
      </div>


      {/* Product Filter and Menu View Mode Selector */}
      <div id="menu-view-mode-selector" className="px-4 -mt-1 pb-4">
        <div className="max-w-2xl mx-auto rounded-[24px] bg-white border border-white p-1.5 shadow-lg shadow-orange-100/60 flex items-center gap-1.5">
          <label className="sr-only" htmlFor="product-category-menu">
            Filtrar produtos por categoria
          </label>

          <select
            id="product-category-menu"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="min-w-0 flex-1 h-12 px-3.5 rounded-[18px] bg-orange-50/70 border border-orange-100 text-[11px] font-black text-zinc-900 outline-none focus:border-orange-300 focus:bg-white cursor-pointer"
            title="Filtrar produtos por categoria"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? '🍱 Todos os Produtos' : cat}
              </option>
            ))}
          </select>

          <div className="h-8 w-px bg-zinc-200 mx-0.5 shrink-0" />

          <div className="grid grid-cols-4 gap-1 shrink-0">
            {[
              { id: 'minimal', label: 'Minimalista', icon: '☰' },
              { id: 'list', label: 'Lista', icon: '☷' },
              { id: 'grid', label: 'Grade', icon: '▦' },
              { id: 'cards', label: 'Atual', icon: '▣' },
            ].map((view) => (
              <button
                key={view.id}
                type="button"
                id={'menu-view-' + view.id + '-btn'}
                onClick={() => setMenuViewMode(view.id as 'minimal' | 'list' | 'grid' | 'cards')}
                title={view.label}
                aria-label={'Visualização ' + view.label}
                className={
                  menuViewMode === view.id
                    ? 'w-12 h-12 rounded-[18px] text-[10px] font-black bg-zinc-950 text-white shadow-md shadow-zinc-300/70 flex items-center justify-center'
                    : 'w-12 h-12 rounded-[18px] text-[10px] font-black text-zinc-500 hover:text-zinc-950 hover:bg-orange-50 flex items-center justify-center'
                }
              >
                <span className="text-base leading-none" aria-hidden="true">{view.icon}</span>
                <span className="sr-only">{view.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main product card listing */}
      <div className="px-4 pt-4 pb-44 max-w-2xl mx-auto">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Utensils className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-display font-medium text-zinc-800 text-base">Nenhum produto disponível</h3>
            <p className="text-zinc-500 text-xs mt-1 px-8 leading-relaxed">
              Não encontramos ofertas correspondentes nesta categoria ou busca.
            </p>
          </div>
        ) : menuViewMode === 'minimal' ? (
          <div className="bg-white border border-orange-200 rounded-[30px] overflow-hidden divide-y divide-orange-100 shadow-[0_20px_55px_rgba(251,146,60,0.25)] ring-1 ring-orange-100">
            {filteredProducts.map((product) => {
              const insideCartCount = cart[product.id] || 0;

              return (
                <div
                  key={product.id}
                  id={'product-minimal-row-' + product.id}
                  className={insideCartCount > 0 ? 'relative overflow-hidden px-4 py-4 flex items-center gap-3 bg-gradient-to-r from-red-500 via-orange-400 to-yellow-200 border-l-[7px] border-red-700 shadow-[0_18px_45px_rgba(234,88,12,0.55)] ring-4 ring-orange-300/80 scale-[1.015] transition-all active:scale-[0.99]' : 'relative px-4 py-4 flex items-center gap-3 bg-white hover:bg-orange-50/90 hover:shadow-[0_12px_30px_rgba(251,146,60,0.28)] transition-all active:scale-[0.99]'}
                >
                  <ProductIcon icon={product.emoji} className="w-7 h-7 text-xl shrink-0" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-black text-zinc-900 text-sm truncate">{product.name}</h4>
                      <span className="font-mono font-black text-zinc-900 text-xs shrink-0">
                        R$ {product.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-0.5">
                      <span className="text-[10px] font-bold text-amber-600 uppercase truncate">
                        {product.category}
                      </span>
                      <span className="text-[10px] font-black text-emerald-700 shrink-0">
                        {product.stockAvailable ?? 0} disp.
                      </span>
                    </div>
                  </div>

                  {insideCartCount > 0 ? (
                    <div
                      id={'cart-minimal-controls-' + product.id}
                      className="flex items-center gap-1 bg-white border-2 border-orange-400 rounded-full px-2 py-1 shrink-0 shadow-[0_14px_32px_rgba(234,88,12,0.35)] ring-4 ring-white scale-105"
                    >
                      <button
                        type="button"
                        id={'decrease-minimal-btn-' + product.id}
                        onClick={() => handleRemoveFromCart(product.id)}
                        className="w-8 h-8 rounded-full text-zinc-700 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all"
                        title="Diminuir quantidade"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-zinc-900">
                        {insideCartCount}
                      </span>
                      <button
                        type="button"
                        id={'increase-minimal-btn-' + product.id}
                        onClick={() => handleAddToCart(product.id)}
                        disabled={insideCartCount >= (product.stockAvailable ?? 0)}
                        className="w-8 h-8 rounded-full bg-zinc-950 text-white disabled:bg-zinc-200 disabled:text-zinc-400 flex items-center justify-center cursor-pointer shadow-md shadow-zinc-900/20 hover:scale-110 active:scale-95 transition-all"
                        title="Aumentar quantidade"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      id={'add-minimal-btn-' + product.id}
                      onClick={() => handleAddToCart(product.id)}
                      disabled={insideCartCount >= (product.stockAvailable ?? 0)}
                      className="w-11 h-11 rounded-full bg-gradient-to-br from-zinc-950 via-black to-zinc-800 hover:from-orange-700 hover:via-orange-600 hover:to-amber-500 text-white text-xl font-black flex items-center justify-center disabled:bg-zinc-200 disabled:text-zinc-400 cursor-pointer shadow-[0_14px_32px_rgba(0,0,0,0.38)] ring-4 ring-white hover:scale-110 active:scale-95 transition-all"
                      title="Adicionar"
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : menuViewMode === 'list' ? (
          <div className="space-y-3">
            {filteredProducts.map((product) => {
              const insideCartCount = cart[product.id] || 0;

              return (
                <div
                  key={product.id}
                  id={'product-list-row-' + product.id}
                  className={
                    insideCartCount > 0
                      ? 'relative overflow-hidden rounded-[30px] border-2 p-4 flex items-center gap-4 bg-gradient-to-r from-red-500 via-orange-400 to-yellow-200 border-red-600 ring-4 ring-orange-300/80 shadow-[0_22px_55px_rgba(234,88,12,0.58)] scale-[1.015] active:scale-[0.99] transition-all'
                      : 'rounded-[30px] border p-4 flex items-center gap-4 bg-white border-orange-100 shadow-[0_14px_35px_rgba(251,146,60,0.18)] hover:border-orange-300 hover:shadow-[0_18px_45px_rgba(251,146,60,0.32)] active:scale-[0.99] transition-all'
                  }
                >
                  <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-yellow-100 via-orange-50 to-white border border-orange-300 flex items-center justify-center shrink-0 overflow-hidden shadow-inner ring-1 ring-orange-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <ProductIcon icon={product.emoji} className="w-12 h-12 text-4xl" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-black text-orange-600 tracking-wider truncate block mb-1">
                      {product.category}
                    </span>
                    <h4 className="font-display font-black text-zinc-950 text-base leading-tight line-clamp-2">{product.name}</h4>
                    <p className="text-zinc-500 text-xs line-clamp-2 mt-1">{product.description || 'Produto disponível.'}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="font-mono font-black text-zinc-950 text-base">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase">
                        {product.stockAvailable ?? 0} disp.
                      </span>
                    </div>
                  </div>

                  {insideCartCount > 0 ? (
                    <div className="flex items-center gap-1 bg-white border-2 border-orange-400 rounded-full px-2 py-1 shrink-0 shadow-[0_14px_32px_rgba(234,88,12,0.35)] ring-4 ring-white scale-105">
                      <button
                        onClick={() => handleRemoveFromCart(product.id)}
                        className="w-7 h-7 rounded-full text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-xs font-black">{insideCartCount}</span>
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={insideCartCount >= (product.stockAvailable ?? 0)}
                        className="w-7 h-7 rounded-full text-amber-700 hover:bg-amber-50 disabled:text-zinc-300 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      id={'add-list-btn-' + product.id}
                      onClick={() => handleAddToCart(product.id)}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-950 via-black to-zinc-800 hover:from-orange-700 hover:via-orange-600 hover:to-amber-500 text-white text-lg font-black cursor-pointer shadow-[0_14px_32px_rgba(0,0,0,0.38)] ring-4 ring-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shrink-0"
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : menuViewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const insideCartCount = cart[product.id] || 0;

              return (
                <div
                  key={product.id}
                  id={'product-grid-card-' + product.id}
                  className={
                    insideCartCount > 0
                      ? 'rounded-[30px] border-2 p-3.5 flex flex-col min-h-[218px] bg-gradient-to-br from-red-500 via-orange-400 to-yellow-200 border-red-600 ring-4 ring-orange-300/80 shadow-[0_22px_55px_rgba(234,88,12,0.58)] scale-[1.015] active:scale-[0.99] transition-all'
                      : 'rounded-[30px] border p-3.5 flex flex-col min-h-[218px] bg-white border-orange-100 shadow-[0_14px_35px_rgba(251,146,60,0.18)] hover:border-orange-300 hover:shadow-[0_18px_45px_rgba(251,146,60,0.32)] active:scale-[0.99] transition-all'
                  }
                >
                  <div className="w-full aspect-square max-h-28 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden mb-2.5">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <ProductIcon icon={product.emoji} className="w-12 h-12 text-4xl" />
                    )}
                  </div>

                  <span className="text-[8px] uppercase font-black text-amber-600 tracking-wider truncate">
                    {product.category}
                  </span>
                  <h4 className="font-display font-black text-zinc-900 text-xs leading-tight line-clamp-2 min-h-[32px]">
                    {product.name}
                  </h4>

                  <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-zinc-950 text-base">
                      R$ {product.price.toFixed(2)}
                    </span>
                    {insideCartCount > 0 ? (
                      <div
                        id={'cart-grid-controls-' + product.id}
                        className="flex items-center gap-1 bg-white border-2 border-orange-400 rounded-full px-2 py-1 shrink-0 shadow-[0_14px_32px_rgba(234,88,12,0.35)] ring-4 ring-white scale-105"
                      >
                        <button
                          type="button"
                          id={'decrease-grid-btn-' + product.id}
                          onClick={() => handleRemoveFromCart(product.id)}
                          className="w-7 h-7 rounded-full text-zinc-650 hover:text-rose-600 hover:bg-zinc-50 flex items-center justify-center cursor-pointer"
                          title="Diminuir quantidade"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-black text-zinc-900">
                          {insideCartCount}
                        </span>
                        <button
                          type="button"
                          id={'increase-grid-btn-' + product.id}
                          onClick={() => handleAddToCart(product.id)}
                          disabled={insideCartCount >= (product.stockAvailable ?? 0)}
                          className="w-7 h-7 rounded-full bg-zinc-900 text-white disabled:bg-zinc-200 disabled:text-zinc-400 flex items-center justify-center cursor-pointer"
                          title="Aumentar quantidade"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        id={'add-grid-btn-' + product.id}
                        onClick={() => handleAddToCart(product.id)}
                        disabled={insideCartCount >= (product.stockAvailable ?? 0)}
                        className="w-8 h-8 rounded-full bg-zinc-900 text-white text-base font-black flex items-center justify-center disabled:bg-zinc-200 disabled:text-zinc-400 cursor-pointer"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map((product) => {
              const insideCartCount = cart[product.id] || 0;

              return (
                <div
                  key={product.id}
                  id={'product-card-' + product.id}
                  className={
                    insideCartCount > 0
                      ? 'relative rounded-[30px] overflow-hidden flex flex-col justify-between transition-all duration-200 bg-gradient-to-br from-red-500 via-orange-400 to-yellow-200 border-2 border-red-600 shadow-[0_22px_55px_rgba(234,88,12,0.58)] ring-4 ring-orange-300/80 scale-[1.015] active:scale-[0.99]'
                      : 'relative rounded-[30px] overflow-hidden flex flex-col justify-between transition-all duration-200 bg-white border border-orange-100 shadow-[0_14px_35px_rgba(251,146,60,0.18)] hover:shadow-[0_18px_45px_rgba(251,146,60,0.32)] hover:border-orange-300 active:scale-[0.99]'
                  }
                >
                  {insideCartCount > 0 && (
                    <div
                      id={'product-selected-badge-' + product.id}
                      className="absolute top-3 right-3 z-10 rounded-full bg-sky-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-md"
                    >
                      Selecionado
                    </div>
                  )}

                  <div className="p-4 flex gap-4">
                    <div className={
                      insideCartCount > 0
                        ? 'relative w-24 h-24 rounded-3xl shrink-0 overflow-hidden flex items-center justify-center text-3xl select-none transition-colors bg-sky-100 border border-sky-300'
                        : 'relative w-24 h-24 rounded-3xl shrink-0 overflow-hidden flex items-center justify-center text-3xl select-none transition-colors bg-zinc-50 border border-zinc-100'
                    }>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <span className={product.imageUrl ? 'hidden' : 'block'}>
                        <ProductIcon icon={product.emoji} className="w-11 h-11 text-3xl" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                        {product.category}
                      </span>
                      <h4 className="font-display font-bold text-zinc-900 text-sm mt-0.5">
                        {product.name}
                      </h4>
                      <p className="text-zinc-500 text-xs leading-relaxed mt-1 line-clamp-2">
                        {product.description || 'Produto disponível na loja física do CIICC.'}
                      </p>
                      <span className="inline-flex mt-2 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-wide">
                        Disponível: {product.stockAvailable ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className={
                    insideCartCount > 0
                      ? 'px-4 py-3 border-t flex items-center justify-between transition-colors bg-sky-100/80 border-sky-200'
                      : 'px-4 py-3 border-t flex items-center justify-between transition-colors bg-zinc-50 border-zinc-100'
                  }>
                    <span className="font-mono font-bold text-zinc-800 text-sm">
                      R$ {product.price.toFixed(2)}
                    </span>

                    {insideCartCount > 0 ? (
                      <div id={'cart-controls-' + product.id} className="flex items-center gap-2 bg-white border border-zinc-200 rounded-full py-1 px-2">
                        <button
                          id={'decrease-qty-btn-' + product.id}
                          onClick={() => handleRemoveFromCart(product.id)}
                          className="p-1 text-zinc-650 hover:text-rose-600 hover:bg-zinc-50 rounded-full transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-mono font-bold text-zinc-800 px-1">
                          {insideCartCount}
                        </span>
                        <button
                          id={'increase-qty-btn-' + product.id}
                          onClick={() => handleAddToCart(product.id)}
                          disabled={insideCartCount >= (product.stockAvailable ?? 0)}
                          className="p-1 text-zinc-650 hover:text-amber-600 hover:bg-zinc-50 disabled:text-zinc-300 disabled:cursor-not-allowed rounded-full transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        id={'add-to-cart-btn-' + product.id}
                        onClick={() => handleAddToCart(product.id)}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 hover:scale-105 active:scale-95 text-white font-black text-xs rounded-full cursor-pointer transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-zinc-300/60"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isProfileModalOpen && customerProfile && (
          <div id="customer-profile-modal" className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              className="w-full sm:max-w-md max-h-[92dvh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-black text-base text-zinc-900">
                    Meu Perfil
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Atualize seus dados de identificação.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="w-9 h-9 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 flex items-center justify-center"
                  title="Fechar perfil"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomerProfile} className="p-5 space-y-4 overflow-y-auto">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 overflow-hidden flex items-center justify-center shrink-0">
                    {profilePhotoUrl ? (
                      <img
                        src={profilePhotoUrl}
                        alt="Foto do perfil"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-8 h-8 text-amber-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <label className="w-full px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      Trocar foto
                      <input type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" />
                    </label>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                      Use uma imagem com até 1MB.
                    </p>
                  </div>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Nome
                  </span>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-zinc-900 text-sm outline-none focus:border-amber-500 transition-colors"
                    placeholder="Seu nome completo"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    Local de trabalho
                  </span>
                  <input
                    value={profileWorkplace}
                    onChange={(e) => setProfileWorkplace(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-zinc-900 text-sm outline-none focus:border-amber-500 transition-colors"
                    placeholder="Ex: Recepção, Administrativo, Galpão..."
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Turno / horário
                  </span>
                  <input
                    value={profileShiftHours}
                    onChange={(e) => setProfileShiftHours(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-zinc-900 text-sm outline-none focus:border-amber-500 transition-colors"
                    placeholder="Ex: 08:00 às 17:00"
                  />
                </label>

                {profileError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                    {profileError}
                  </div>
                )}

                {profileSaved && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Perfil atualizado com sucesso.
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl border border-zinc-200 text-zinc-600 font-bold text-xs bg-white hover:bg-zinc-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="flex-1 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-black text-xs flex items-center justify-center gap-2"
                  >
                    {profileSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar perfil
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Purchase History Modal */}
      <AnimatePresence>
        {isPurchaseHistoryOpen && (
          <div id="purchase-history-modal" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-sm px-0 sm:px-4">
            <motion.div
              initial={{ y: 36, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 36, opacity: 0, scale: 0.98 }}
              className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-zinc-100 max-h-[88vh] flex flex-col"
            >
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-black text-zinc-950 text-base truncate">
                      Histórico de aquisições
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-bold">
                      Compras notificadas pelo cardápio
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPurchaseHistoryOpen(false)}
                  className="w-9 h-9 rounded-full bg-white border border-zinc-100 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 flex items-center justify-center"
                  aria-label="Fechar histórico"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-zinc-50/70">
                {purchaseHistoryLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mb-3" />
                    <p className="text-xs font-bold">Carregando histórico...</p>
                  </div>
                ) : purchaseHistoryError ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                    {purchaseHistoryError}
                  </div>
                ) : purchaseHistory.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingCart className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                    <p className="text-sm font-black text-zinc-800">Nenhuma aquisição notificada ainda.</p>
                    <p className="text-xs text-zinc-500 mt-1">Quando você notificar uma compra, ela aparecerá aqui.</p>
                  </div>
                ) : (
                  purchaseHistory.map((sale) => (
                    <div
                      key={sale.id}
                      className="rounded-3xl bg-white border border-zinc-100 p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-black text-zinc-400">
                            {new Date(sale.createdAt).toLocaleDateString('pt-BR')} às {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-lg font-mono font-black text-zinc-950">
                            R$ {sale.totalAmount.toFixed(2)}
                          </p>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                          sale.paymentMethod === 'pix'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {sale.paymentMethod === 'pix' ? 'PIX informado' : 'Pagar depois'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {sale.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <ProductIcon icon={item.emoji} className="w-5 h-5 text-base shrink-0" />
                              <span className="font-bold text-zinc-700 truncate">
                                {item.quantity}x {item.name}
                              </span>
                            </div>
                            <span className="font-mono font-black text-zinc-900 shrink-0">
                              R$ {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {sale.paymentMethod === 'pix' && (
                        <div className="pt-3 border-t border-zinc-100">
                          {sale.paymentProofUrl ? (
                            <a
                              href={sale.paymentProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-black shadow-md shadow-emerald-700/20"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Ver comprovante PIX
                            </a>
                          ) : (
                            <span className="inline-flex rounded-2xl bg-zinc-100 text-zinc-500 px-3 py-2 text-xs font-bold">
                              PIX informado sem comprovante anexado
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Admin Contact */}
      <button
        id="floating-admin-whatsapp-btn"
        type="button"
        onClick={handleOpenAdminWhatsapp}
        className="fixed right-5 bottom-36 z-50 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-700/25 border border-emerald-300 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title="Chamar admin no WhatsApp"
        aria-label="Chamar admin no WhatsApp para pedidos, críticas ou sugestões"
      >
        <Phone className="w-6 h-6" />
      </button>

      {/* Floating Bottom Adhesive Bar (PIX copy and WhatsApp help options) */}
      <div
        id="sticky-checkout-deck"
        className={`fixed bottom-0 inset-x-0 z-40 px-4 py-3 backdrop-blur-md transition-all duration-300 border-t shadow-2xl ${
          cartItemsCount > 0
            ? 'bg-gradient-to-r from-orange-700 via-amber-500 to-yellow-300 border-orange-600 shadow-[0_-18px_50px_rgba(234,88,12,0.45)]'
            : 'bg-amber-100/95 border-amber-300 shadow-zinc-300/30'
        }`}
      >
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Quick PIX Copy Box */}
          {settings.pixKey ? (
            <div className={`w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 p-2.5 rounded-2xl flex-1 max-w-sm transition-all duration-300 ${cartItemsCount > 0 ? 'bg-white/95 border border-white/80 shadow-lg shadow-orange-700/20' : 'bg-white/85 border border-amber-300 shadow-sm'}`}>
              <div className="min-w-0 px-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                  Pagamento PIX
                </span>
                <span className="text-xs font-mono font-medium text-zinc-700 truncate block">
                  {settings.pixKey}
                </span>
              </div>
              <button
                id="copy-pix-sticky-btn"
                onClick={handleCopyPix}
                className={`py-2 px-3 border rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-1.5 ${
                  copiedPix
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-zinc-200 hover:border-zinc-350 text-zinc-700'
                }`}
              >
                {copiedPix ? <Check className="w-3.5 h-3.5 animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPix ? 'Copiada!' : 'Copiar Chave'}</span>
              </button>
            </div>
          ) : (
            <div className="text-zinc-400 text-xs font-light py-2">
              Pagamento via WhatsApp ou Balcão.
            </div>
          )}

          {/* Checkout WhatsApp Action Trigger */}
          <div className="w-full sm:w-auto flex gap-2 shrink-0">
            {cartItemsCount > 0 && (
              <button
                id="view-cart-btn"
                onClick={() => setIsCartOpen(true)}
                className="px-3 py-3 bg-zinc-950 hover:bg-zinc-900 border border-white/30 text-white font-black rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all min-w-[116px] shadow-xl shadow-zinc-900/30 active:scale-95"
                title="Visualizar Comanda"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span className="font-mono text-sm">{cartItemsCount}</span>
                <span className="h-4 w-px bg-white/35" />
                <span id="cart-footer-total-value" className="font-mono text-sm whitespace-nowrap">
                  R$ {cartTotal.toFixed(2)}
                </span>
              </button>
            )}

            <button
              id="whatsapp-integration-shortcut-btn"
              onClick={() => {
                if (cartItemsCount <= 0) {
                  setCartNotice('Adicione pelo menos 1 item do cardápio para continuar.');
                  return;
                }

                setCartNotice(null);
                setSelectedPaymentMethod(null);
                setPaymentProofFile(null);
                setPaymentProofUrl(null);
                setOrderError(null);
                setIsCheckoutModalOpen(true);
              }}
              className={`flex-1 sm:flex-none px-6 py-3.5 font-bold text-sm rounded-2xl cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all ${
                cartItemsCount > 0
                  ? 'bg-gradient-to-r from-emerald-700 via-green-600 to-lime-500 hover:from-emerald-800 hover:via-green-700 hover:to-lime-600 text-white hover:scale-[1.03] active:scale-[0.97] shadow-[0_16px_38px_rgba(4,120,87,0.48)] ring-4 ring-white/50 border border-white/40'
                  : 'bg-zinc-200 text-zinc-500 shadow-zinc-200/30 border border-zinc-300'
              }`}
              aria-disabled={cartItemsCount <= 0}
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>
                {cartItemsCount > 0 ? 'Notificar aquisição' : 'Adicionar item para continuar'}
              </span>
            </button>
          </div>
        </div>
      </div>


      {cartNotice && (
        <div id="cart-empty-notice" className="fixed bottom-24 left-4 right-4 z-50 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 shadow-lg">
          {cartNotice}
        </div>
      )}

      {/* Cart Summary Modal Slideover */}
      <AnimatePresence>
        {isCartOpen && (
          <div id="cart-summary-modal" className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-lg bg-white rounded-t-3xl overflow-hidden shadow-2xl border-t border-zinc-100 flex flex-col max-h-[85vh]"
            >
              {/* Cart Modal Head */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-500" />
                  <h3 className="font-display font-bold text-lg text-zinc-900">
                    Itens selecionados
                  </h3>
                </div>
                <button
                  id="close-cart-modal-btn"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items feed list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">

                {Object.entries(cart).map(([id, qty]) => {
                  const prod = products.find((p) => p.id === id);
                  if (!prod) return null;
                  return (
                    <div key={id} className="flex gap-4 pb-4 border-b border-zinc-100 items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl">{prod.emoji || '🍽️'}</span>
                          <h4 className="font-display font-bold text-zinc-900 text-sm truncate">
                            {prod.name}
                          </h4>
                        </div>
                        <span className="font-mono text-zinc-500 text-xs block mt-0.5">
                          R$ {prod.price.toFixed(2)} x {qty}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          id={`modal-cart-dec-${id}`}
                          onClick={() => handleRemoveFromCart(id)}
                          className="p-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-full cursor-pointer text-zinc-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs font-semibold px-1">{qty}</span>
                        <button
                          id={`modal-cart-inc-${id}`}
                          onClick={() => handleAddToCart(id)}
                          className="p-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-full cursor-pointer text-zinc-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {cartItemsCount === 0 && (
                  <div className="text-center py-10 text-zinc-400 font-light text-sm">
                    Nenhum item selecionado. Volte e adicione produtos.
                  </div>
                )}
              </div>

              {/* Bottom total controls */}
              <div className="p-6 bg-zinc-50 border-t border-zinc-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500 font-medium">Subtotal Geral</span>
                  <span className="font-mono font-bold text-zinc-900 text-lg">
                    R$ {cartTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="flex-1 py-3 border border-zinc-200 text-zinc-500 hover:text-zinc-800 font-medium text-xs rounded-xl cursor-pointer hover:bg-white transition-colors"
                  >
                    Adicionar mais produtos
                  </button>
                  <button
                    id="submit-cart-to-wa"
                    onClick={() => {
                      setSelectedPaymentMethod(null);
                      setIsCheckoutModalOpen(true);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 fill-white" />
                    <span>Confirmar aquisição</span>
                  </button>
                </div>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

      {/* Checkout Payment Selection Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div id="payment-selection-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-zinc-100 flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100">
                <h3 className="font-display font-bold text-base text-zinc-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>Opções de Aquisição</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setOrderError(null);
                    setIsCheckoutModalOpen(false);
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-650"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-zinc-500 text-xs mb-4">
                Olá, <span className="font-bold text-zinc-700">{customerProfile?.name}</span>! Informe se prefere fazer o pagamento em PIX agora ou marcar para acertar posteriormente:
              </p>


              <div id="purchase-confirmation-summary" className="mb-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block">
                      Aquisição CIICC
                    </span>
                    <h4 className="text-sm font-black text-zinc-900">
                      Confirme os dados antes de notificar
                    </h4>
                  </div>
                  <span className="font-mono text-sm font-black text-zinc-900 whitespace-nowrap">
                    R$ {cartTotal.toFixed(2)}
                  </span>
                </div>

                <div className="rounded-xl bg-white border border-zinc-200 p-3 text-xs text-zinc-600 space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold text-zinc-500">Usuário</span>
                    <span className="font-bold text-zinc-900 text-right">{customerProfile?.name || 'Cliente'}</span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="font-semibold text-zinc-500">Quantidade</span>
                    <span className="font-mono font-bold text-zinc-900">{cartItemsCount} item(ns)</span>
                  </div>

                  <div className="h-px bg-zinc-100" />

                  <div className="space-y-1.5">
                    {Object.entries(cart).map(([id, qtyVal]) => {
                      const qty = qtyVal as number;
                      const prod = products.find((p) => p.id === id);

                      if (!prod) return null;

                      return (
                        <div key={id} className="flex justify-between gap-3">
                          <span className="text-zinc-700">
                            {qty}x {prod.emoji || '🍽️'} {prod.name}
                          </span>
                          <span className="font-mono font-bold text-zinc-900 whitespace-nowrap">
                            R$ {(prod.price * qty).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Selection cards */}
              <div className="space-y-3 mb-6">
                {/* Method 1: Pagar Posteriormente */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('later')}
                  className={`w-full p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    selectedPaymentMethod === 'later'
                      ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                      : 'border-zinc-200 hover:border-zinc-350 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100/50 text-amber-600 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 text-sm">Retirar agora e pagar posteriormente</h4>
                      <p className="text-zinc-500 text-[11px] leading-relaxed mt-1">
                        A aquisição de R$ {cartTotal.toFixed(2)} será registrada para acerto posterior direto com a administração.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Method 2: Pagar no PIX */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('pix')}
                  className={`w-full p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    selectedPaymentMethod === 'pix'
                      ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                      : 'border-zinc-200 hover:border-zinc-350 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-100/50 text-emerald-600 mt-0.5">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-zinc-900 text-sm">Fazer o Pagamento via PIX agora</h4>
                      <p className="text-zinc-500 text-[11px] leading-relaxed mt-1">
                        Desejo efetuar a transferência do valor de R$ {cartTotal.toFixed(2)} agora via celular antes de consumir.
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {selectedPaymentMethod === 'pix' && (
                <div className="p-3 bg-zinc-50 rounded-xl mb-5 border border-zinc-100 text-[11px] text-zinc-500 flex flex-col gap-1.5">
                  <div className="font-bold text-zinc-700">Chave PIX do Estabelecimento:</div>
                  <div className="flex items-center justify-between bg-white border border-zinc-200 p-2 rounded-lg">
                    <span className="font-mono text-zinc-850 text-[10px] break-all select-all pr-2">{settings.pixKey}</span>
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="text-amber-600 hover:text-amber-700 font-bold text-[10px] whitespace-nowrap px-1.5 py-0.5 hover:bg-zinc-50 rounded flex items-center gap-0.5 shrink-0"
                    >
                      {copiedPix ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPix ? 'Copiada' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              )}


              {selectedPaymentMethod === 'pix' && (
                <div id="payment-proof-upload-panel" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <label htmlFor="payment-proof-file-input" className="block text-xs font-black text-emerald-900 mb-1">
                    Anexar comprovante do pagamento
                  </label>
                  <p className="text-[11px] text-emerald-700 mb-3 leading-relaxed">
                    Selecione a imagem ou PDF do comprovante PIX. Confirme o anexo para enviar o comprovante ao sistema. O link será incluído na notificação do WhatsApp Web.
                  </p>

                  <input
                    id="payment-proof-file-input"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setPaymentProofFile(file);
                      setPaymentProofUrl(null);
                      setOrderError(null);
                    }}
                    className="w-full text-xs text-emerald-900 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                  />


                  {paymentProofFile && !paymentProofUrl && (
                    <button
                      type="button"
                      onClick={handleUploadPaymentProof}
                      disabled={isUploadingPaymentProof}
                      className="mt-3 w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:bg-zinc-300 disabled:text-zinc-500"
                    >
                      {isUploadingPaymentProof ? 'Enviando comprovante...' : 'Confirmar anexo e gerar link'}
                    </button>
                  )}

                  {paymentProofUrl && (
                    <a
                      href={paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block rounded-xl bg-white border border-emerald-300 px-3 py-2 text-[11px] font-bold text-emerald-800 underline break-all"
                    >
                      Link do comprovante gerado. Clique para conferir antes de notificar.
                    </a>
                  )}

                  {paymentProofFile && (
                    <div className="mt-3 rounded-xl bg-white border border-emerald-200 px-3 py-2 text-[11px] font-semibold text-emerald-800">
                      Comprovante selecionado: {paymentProofFile.name}
                    </div>
                  )}
                </div>
              )}

              {orderError && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                  {orderError}
                </div>
              )}

              {/* Submit panel */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="flex-1 py-3 border border-zinc-200 text-zinc-500 hover:text-zinc-800 font-medium text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!selectedPaymentMethod || isSubmittingOrder || isUploadingPaymentProof}
                  onClick={handleConfirmPurchase}
                  className={`flex-1 py-3 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
                    !selectedPaymentMethod || isSubmittingOrder || isUploadingPaymentProof
                      ? 'bg-zinc-300 cursor-not-allowed text-zinc-500 animate-pulse'
                      : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {isSubmittingOrder ? 'Processando...' : isUploadingPaymentProof ? 'Enviando comprovante...' : 'Confirmar e notificar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Success Confirmation Modal */}
      <AnimatePresence>
        {checkedOutSaleId && (
          <div id="checkout-success-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800 shadow-2xl rounded-3xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-4 border border-amber-500/20">
                <Sparkles className="w-8 h-8 text-amber-500" />
              </div>

              <span className="text-[10px] text-amber-500 tracking-widest uppercase font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block mb-3">
                Notificação preparada
              </span>

              <h3 className="font-display font-bold text-xl text-white mb-2 leading-snug">
                Aquisição confirmada!
              </h3>

              <p className="text-zinc-400 text-xs px-2 mb-5 leading-relaxed">
                Parabéns <span className="text-white font-semibold">{customerProfile?.name}</span>, sua notificação de aquisição foi preparada. Confira o WhatsApp e valide o comprovante quando necessário.
              </p>

              <div className="p-4 bg-zinc-850 rounded-2xl border border-zinc-800 text-left mb-6 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
                  <span>Opção de Pagamento</span>
                  <span className="font-semibold text-amber-400 italic">
                    {selectedPaymentMethod === 'later' ? 'PAGAR POSTERIORMENTE' : 'PIX'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCheckedOutSaleId(null)}
                className="w-full py-4 px-4 bg-amber-500 text-black hover:bg-amber-400 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Entendido, Fechar Janela
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
