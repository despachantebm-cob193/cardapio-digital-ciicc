import { useState, useMemo } from 'react';
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
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, StoreSetting } from '../types';
import { createSale } from '../dbService';

interface CustomerViewProps {
  products: Product[];
  settings: StoreSetting;
  currentTable: string | null;
  onTableChange: (table: string | null) => void;
  onOpenScanner: () => void;
  customerProfile?: any;
  onLogout?: () => void;
}

export default function CustomerView({
  products,
  settings,
  currentTable,
  onTableChange,
  onOpenScanner,
  customerProfile,
  onLogout
}: CustomerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedPix, setCopiedPix] = useState(false);

  // Simple shopping cart state
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout and payment method selection states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'later' | 'pix' | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [checkedOutSaleId, setCheckedOutSaleId] = useState<string | null>(null);


  // Only show products being offered (available)
  const offeredProducts = useMemo(() => {
    return products.filter((p) => p.available === true);
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

  // Copy PIX Predefined Key Action
  const handleCopyPix = () => {
    if (!settings.pixKey) return;
    navigator.clipboard.writeText(settings.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  // WhatsApp click generator
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
          itemsList += `\n• *${qty}x* ${prod.emoji || '🍽️'} ${prod.name} (R$ ${(prod.price * qty).toFixed(2)})`;
        }
      });

      const tableSection = currentTable ? `📍 *Mesa:* ${currentTable}\n` : '';
      baseMsg = `Olá! Gostaria de efetuar o seguinte pedido:\n\n${tableSection}${itemsList}\n\n*Total:* R$ ${cartTotal.toFixed(2)}\n*Forma de pagamento sugerida:* PIX 💵\n\n_Chave PIX para pagamento: ${settings.pixKey}_`;
    } else if (currentTable) {
      baseMsg = `Olá! Estou na *Mesa ${currentTable}* e gostaria de realizar um pedido do cardápio digital.`;
    }

    const encodedText = encodeURIComponent(baseMsg);
    const waUrl = `https://wa.me/${number}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  // Secure checkout & acquisition confirmation
  const handleConfirmPurchase = async () => {
    if (!selectedPaymentMethod) return;
    setIsSubmittingOrder(true);

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

      const saleId = await createSale({
        customerId: customerProfile?.uid || 'anonymous',
        customerName: customerProfile?.name || 'Cliente',
        customerEmail: customerProfile?.email || '',
        customerWorkplace: customerProfile?.workplace || '',
        customerShiftHours: customerProfile?.shiftHours || '',
        customerPhotoUrl: customerProfile?.photoUrl || '',
        items: saleItems,
        totalAmount: cartTotal,
        paymentMethod: selectedPaymentMethod
      });

      setCheckedOutSaleId(saleId);
      setIsCheckoutModalOpen(false);
      setIsCartOpen(false);

      // Reset cart immediately on successful DB save
      setCart({});

      // Open WhatsApp to notify store owner
      const number = settings.whatsappNumber || '55Unknown';
      let itemsList = '';
      saleItems.forEach((item) => {
        itemsList += `\n• *${item.quantity}x* ${item.emoji} ${item.name} (R$ ${(item.price * item.quantity).toFixed(2)})`;
      });

      const tableSection = currentTable ? `📍 *Mesa:* ${currentTable}\n` : '';
      const methodLabel = selectedPaymentMethod === 'later'
        ? 'PAGAR POSTERIORMENTE (MARCADO NA CONTA)'
        : 'PAGO RECENTEMENTE VIA PIX ✅';

      const baseMsg = `Olá! Sou *${customerProfile?.name || 'Cliente'}* (${customerProfile?.workplace || 'Sem Setor'}). Nova comanda cadastrada com sucesso!\n\n${tableSection}${itemsList}\n\n*Total:* R$ ${cartTotal.toFixed(2)}\n*Forma de pagamento escolhida:* ${methodLabel}\n*Código do Pedido:* ${saleId}`;

      const encodedText = encodeURIComponent(baseMsg);
      const waUrl = `https://wa.me/${number}?text=${encodedText}`;
      
      // Delay slightly for visual effect then open WhatsApp
      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 700);

    } catch (e) {
      console.error('Erro ao processar comanda:', e);
      alert('Erro de conexão ou privilégio insuficiente ao registrar a aquisição em nossa nuvem.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div id="customer-view-container" className="min-h-screen bg-zinc-50/50 pb-28">
      {/* Visual Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-amber-500/20 to-transparent pt-6 pb-2">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-lg text-black font-bold">
                🍳
              </div>
              <div className="min-w-0">
                <h1 className="font-display font-extrabold text-xl text-zinc-900 leading-tight truncate">
                  {settings.storeName || 'Cardápio Digital'}
                </h1>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                  Menu Digital Interativo
                </p>
              </div>
            </div>

            {/* Scanning button for Table QR */}
            <button
              id="customer-scanner-trigger-btn"
              onClick={onOpenScanner}
              className="px-3 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer flex items-center gap-1 text-xs text-zinc-700 font-semibold shadow-xs"
              title="Escanear Mesa QR"
            >
              <QrCode className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Escanear Mesa</span>
            </button>
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
                onClick={() => onTableChange(null)}
                className="ml-1.5 p-0.5 hover:bg-amber-500/20 rounded-full transition-colors font-bold text-[9px] cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}

          {/* Customer Login Identity Badge */}
          {customerProfile && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-white/70 backdrop-blur-xs border border-zinc-200/60 rounded-2xl p-3 flex items-center justify-between gap-3 text-left transition-all shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                {customerProfile.photoUrl ? (
                  <img
                    src={customerProfile.photoUrl}
                    alt={customerProfile.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover border border-amber-500/15 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 shrink-0">
                    {customerProfile.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-zinc-900 font-bold text-[12px] leading-snug truncate">
                    Olá, {customerProfile.name}
                  </h4>
                  <div className="text-zinc-500 text-[10px] leading-tight flex flex-wrap gap-x-2.5 gap-y-0.5 mt-0.5 font-medium">
                    <span className="flex items-center gap-1">💼 {customerProfile.workplace}</span>
                    <span className="flex items-center gap-1">⏰ {customerProfile.shiftHours}</span>
                  </div>
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="shrink-0 px-2.5 py-1.5 text-[10px] font-bold text-red-500 hover:text-red-650 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  Sair
                </button>
              )}
            </motion.div>
          )}

          {/* Search bar input placeholder */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4.5 h-4.5" />
            <input
              id="product-search-bar"
              type="text"
              placeholder="Pesquisar por prato, ingrediente ou bebida..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-zinc-200/80 rounded-2xl text-zinc-800 outline-none focus:border-amber-500 transition-all shadow-xs"
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

          {/* Categories Sliding Container */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                id={`cat-filter-btn-${cat}`}
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 py-2 mr-0.5 text-xs font-semibold rounded-full select-none shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white border border-zinc-200 text-zinc-650 hover:bg-zinc-100 hover:border-zinc-300'
                }`}
              >
                {cat === 'all' ? '🍔 Todos os Pratos' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main product card listing */}
      <div className="px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Utensils className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-display font-medium text-zinc-800 text-base">Nenhum prato disponível</h3>
            <p className="text-zinc-500 text-xs mt-1 px-8 leading-relaxed">
              Não encontramos ofertas correspondentes nesta categoria ou busca.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map((product) => {
              const insideCartCount = cart[product.id] || 0;
              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  className="bg-white border border-zinc-150 rounded-2xl overflow-hidden shadow-xs hover:shadow-xs flex flex-col justify-between"
                >
                  {/* Card upper visual & text */}
                  <div className="p-4 flex gap-4">
                    {/* Image or Emoji Slot */}
                    <div className="relative w-20 h-20 rounded-xl bg-zinc-50 border border-zinc-100 shrink-0 overflow-hidden flex items-center justify-center text-3xl select-none">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      {/* Emoji layer always serves as fallback or primary symbol */}
                      <span className={product.imageUrl ? 'hidden' : 'block'}>
                        {product.emoji || '🍽️'}
                      </span>
                    </div>

                    {/* Metadata detail block */}
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                        {product.category}
                      </span>
                      <h4 className="font-display font-bold text-zinc-900 text-sm mt-0.5">
                        {product.name}
                      </h4>
                      <p className="text-zinc-500 text-xs leading-relaxed mt-1 line-clamp-2">
                        {product.description || 'Delicioso prato preparado com todo carinho da nossa cozinha.'}
                      </p>
                    </div>
                  </div>

                  {/* Card Actions Bottom bar */}
                  <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                    <span className="font-mono font-bold text-zinc-800 text-sm">
                      R$ {product.price.toFixed(2)}
                    </span>

                    {/* Cart Addition Controls */}
                    {insideCartCount > 0 ? (
                      <div id={`cart-controls-${product.id}`} className="flex items-center gap-2 bg-white border border-zinc-200 rounded-full py-1 px-2">
                        <button
                          id={`decrease-qty-btn-${product.id}`}
                          onClick={() => handleRemoveFromCart(product.id)}
                          className="p-1 text-zinc-650 hover:text-rose-600 hover:bg-zinc-50 rounded-full transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-mono font-bold text-zinc-800 px-1">
                          {insideCartCount}
                        </span>
                        <button
                          id={`increase-qty-btn-${product.id}`}
                          onClick={() => handleAddToCart(product.id)}
                          className="p-1 text-zinc-650 hover:text-amber-600 hover:bg-zinc-50 rounded-full transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`add-to-cart-btn-${product.id}`}
                        onClick={() => handleAddToCart(product.id)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 hover:scale-105 active:scale-95 text-white font-semibold text-xs rounded-full cursor-pointer transition-all flex items-center gap-1 shrink-0"
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

      {/* Floating Bottom Adhesive Bar (PIX copy and WhatsApp help options) */}
      <div id="sticky-checkout-deck" className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-zinc-200 shadow-xl px-4 py-4 backdrop-blur-md bg-white/95">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Quick PIX Copy Box */}
          {settings.pixKey ? (
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 p-2 bg-zinc-50 border border-zinc-150 rounded-2xl flex-1 max-w-sm">
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
                className="px-3 py-3 bg-amber-500/10 border border-amber-500/15 hover:bg-amber-500/20 text-amber-700 font-bold rounded-2xl cursor-pointer flex items-center gap-1.5 transition-colors"
                title="Visualizar Comanda"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="font-mono text-sm">{cartItemsCount}</span>
              </button>
            )}

            <button
              id="whatsapp-integration-shortcut-btn"
              onClick={handleWhatsAppOrderRedirect}
              className="flex-1 sm:flex-none px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm rounded-2xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-md shadow-emerald-500/15"
            >
              <Phone className="w-4 h-4 fill-white" />
              <span>
                {cartItemsCount > 0 ? 'Fazer Pedido por WhatsApp' : 'Falar com Atendimento'}
              </span>
            </button>
          </div>
        </div>
      </div>

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
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-150">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-500" />
                  <h3 className="font-display font-bold text-lg text-zinc-900">
                    Sua Comanda Digital
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
                {currentTable && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-700 font-semibold mb-2">
                    📍 Pedido identificado na Mesa {currentTable}
                  </div>
                )}

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
                    Sua comanda está vazia. Volte e adicione pratos!
                  </div>
                )}
              </div>

              {/* Bottom total controls */}
              <div className="p-6 bg-zinc-50 border-t border-zinc-150 space-y-4">
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
                    Adicionar mais pratos
                  </button>
                  <button
                    id="submit-cart-to-wa"
                    onClick={() => {
                      setSelectedPaymentMethod(null);
                      setIsCheckoutModalOpen(true);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 fill-white" />
                    <span>Escolher Forma de Pagamento</span>
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
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-650"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-zinc-500 text-xs mb-4">
                Olá, <span className="font-bold text-zinc-700">{customerProfile?.name}</span>! Informe se prefere fazer o pagamento em PIX agora ou marcar para acertar posteriormente:
              </p>

              {/* Selection cards */}
              <div className="space-y-3 mb-6">
                {/* Method 1: Pagar Posteriormente */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('later')}
                  className={`w-full p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    selectedPaymentMethod === 'later'
                      ? 'border-amber-500 bg-amber-500/5 shadow-xs'
                      : 'border-zinc-200 hover:border-zinc-350 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100/50 text-amber-600 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 text-sm">Consumir e Pagar Posteriormente</h4>
                      <p className="text-zinc-500 text-[11px] leading-relaxed mt-1">
                        O pedido de R$ {cartTotal.toFixed(2)} será registrado para acerto posterior direto com a administração.
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
                      ? 'border-emerald-500 bg-emerald-500/5 shadow-xs'
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
                <div className="p-3 bg-zinc-50 rounded-xl mb-5 border border-zinc-150 text-[11px] text-zinc-500 flex flex-col gap-1.5">
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
                  disabled={!selectedPaymentMethod || isSubmittingOrder}
                  onClick={handleConfirmPurchase}
                  className={`flex-1 py-3 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
                    !selectedPaymentMethod || isSubmittingOrder
                      ? 'bg-zinc-300 cursor-not-allowed text-zinc-500 animate-pulse'
                      : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {isSubmittingOrder ? 'Processando...' : 'Confirmar e Enviar'}
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
                Pedido Gravado na Nuvem
              </span>

              <h3 className="font-display font-bold text-xl text-white mb-2 leading-snug">
                Pedido Registrado!
              </h3>

              <p className="text-zinc-400 text-xs px-2 mb-5 leading-relaxed">
                Parabéns <span className="text-white font-semibold">{customerProfile?.name}</span>, sua comanda foi salva no banco de dados e enviada ao atendente via WhatsApp.
              </p>

              <div className="p-4 bg-zinc-850 rounded-2xl border border-zinc-800 text-left mb-6 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
                  <span>Código do Registro</span>
                  <span className="font-mono text-white font-black">{checkedOutSaleId}</span>
                </div>
                <div className="h-px bg-zinc-800" />
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
