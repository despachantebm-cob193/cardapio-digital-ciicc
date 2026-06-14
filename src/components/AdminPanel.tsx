import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  Smartphone,
  Check,
  LogOut,
  Sliders,
  ToggleLeft,
  ToggleRight,
  PackageCheck,
  Coins,
  DollarSign,
  X,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, StoreSetting } from '../types';
import {
  addSupabaseProduct,
  deleteSupabaseProduct,
  deleteSupabaseSale,
  listSupabaseSales,
  saveSupabaseStoreSettings,
  updateSupabaseProduct,
  type SupabaseSale,
} from '../features/supabase/supabaseCoreDataService';

interface AdminPanelProps {
  products: Product[];
  settings: StoreSetting;
  onExitAdmin: () => void;
  onCoreDataChanged?: () => Promise<void> | void;
}

const CATEGORIES = [
  '🍔 Hambúrgueres',
  '🍕 Pizzas',
  '🍟 Acompanhamentos',
  '🥤 Bebidas',
  '🍰 Sobremesas',
  '🍽️ Outros'
];

const POPULAR_EMOJIS = ['🍔', '🍕', '🍟', '🥤', '🍰', '🧅', '🍨', '🍗', '🌭', '🥗', '☕', '🍺'];

export default function AdminPanel({ products, settings, onExitAdmin, onCoreDataChanged }: AdminPanelProps) {
  // Settings Form State
  const [storeName, setStoreName] = useState(settings.storeName);
  const [pixKey, setPixKey] = useState(settings.pixKey);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [whatsappMessage, setWhatsappMessage] = useState(settings.whatsappMessage);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Active Tab: 'products' | 'settings' | 'guidance' | 'sales' | 'batches'
  const [activeTab, setActiveTab] = useState<'products' | 'settings' | 'guidance' | 'sales' | 'batches'>('products');
  const [adminNotice, setAdminNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Sales list track state
  const [sales, setSales] = useState<SupabaseSale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [salesPaymentFilter, setSalesPaymentFilter] = useState<'all' | 'pix' | 'later'>('all');

  // Product Selection/Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formEmoji, setFormEmoji] = useState('🍔');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);
  const [productSubmitLoading, setProductSubmitLoading] = useState(false);

  // Physical store guidance state
  const [guidanceReference, setGuidanceReference] = useState('Loja CIICC');
  const [copiedLink, setCopiedLink] = useState(false);

  const currentAppUrl = window.location.origin + window.location.pathname;
  const customerLink = currentAppUrl;

  const showAdminNotice = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setAdminNotice({ type, message });
    window.setTimeout(() => setAdminNotice(null), 4500);
  }, []);

  // Sync settings state when prop resolves
  useEffect(() => {
    setStoreName(settings.storeName);
    setPixKey(settings.pixKey);
    setWhatsappNumber(settings.whatsappNumber);
    setWhatsappMessage(settings.whatsappMessage);
  }, [settings]);

  const notifyCoreDataChanged = useCallback(async () => {
    if (!onCoreDataChanged) return;

    try {
      await onCoreDataChanged();
    } catch (err) {
      console.error('Falha ao atualizar dados locais após gravação Supabase:', err);
    }
  }, [onCoreDataChanged]);

  const loadSales = useCallback(async () => {
    setSalesLoading(true);
    try {
      const data = await listSupabaseSales();
      setSales(data);
    } catch (err) {
      console.error('Erro ao carregar aquisições no Supabase:', err);
    } finally {
      setSalesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'sales') {
      void loadSales();
    }
  }, [activeTab, loadSales]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSaved(false);
    try {
      // Strip formatting from WhatsApp number (keep only digits)
      const cleanWA = whatsappNumber.replace(/\D/g, '');
      const cleanSettings: StoreSetting = {
        storeName,
        pixKey,
        whatsappNumber: cleanWA,
        whatsappMessage
      };
      await saveSupabaseStoreSettings(cleanSettings);
      await notifyCoreDataChanged();
      setSettingsSaved(true);
      showAdminNotice('success', 'Configurações salvas no Supabase com sucesso.');
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      console.error('Falha ao salvar configurações:', err);
      showAdminNotice('error', 'Falha ao gravar no Supabase. Verifique sua sessão e permissão administrativa.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleProductToggleAvailability = async (product: Product) => {
    try {
      await updateSupabaseProduct(product.id, { available: !product.available });
      await notifyCoreDataChanged();
      showAdminNotice('success', product.available ? 'Produto removido da oferta do cardápio.' : 'Produto marcado como disponível no cardápio.');
    } catch (err) {
      console.error('Falha ao alternar disponibilidade:', err);
      showAdminNotice('error', 'Sem permissão de gravação no Supabase. Verifique sua sessão administrativa.');
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory(CATEGORIES[0]);
    setFormEmoji('🍔');
    setFormImageUrl('');
    setFormAvailable(true);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description);
    setFormPrice(product.price.toString());
    setFormCategory(product.category);
    setFormEmoji(product.emoji || '🍔');
    setFormImageUrl(product.imageUrl || '');
    setFormAvailable(product.available);
    setIsProductModalOpen(true);
  };

  const handleProductDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto do cardápio?')) {
      try {
        await deleteSupabaseProduct(id);
        await notifyCoreDataChanged();
        showAdminNotice('success', 'Produto excluído do cardápio com sucesso.');
      } catch (err) {
        console.error('Falha ao deletar produto:', err);
        showAdminNotice('error', 'Erro ao excluir produto. Verifique sua permissão administrativa no Supabase.');
      }
    }
  };

  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice.trim()) {
      showAdminNotice('error', 'Nome e preço são obrigatórios para salvar o produto.');
      return;
    }

    const priceNum = parseFloat(formPrice.replace(',', '.'));
    if (isNaN(priceNum) || priceNum < 0) {
      showAdminNotice('error', 'Insira um preço válido maior ou igual a zero.');
      return;
    }

    setProductSubmitLoading(true);
    try {
      const productPayload = {
        name: formName,
        description: formDescription,
        price: priceNum,
        available: formAvailable,
        category: formCategory,
        emoji: formEmoji,
        imageUrl: formImageUrl || undefined
      };

      if (editingProduct) {
        await updateSupabaseProduct(editingProduct.id, productPayload);
      } else {
        await addSupabaseProduct(productPayload);
      }

      await notifyCoreDataChanged();
      setIsProductModalOpen(false);
      showAdminNotice('success', editingProduct ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.');
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      showAdminNotice('error', 'Falha ao salvar produto no Supabase. Verifique sua sessão e permissão administrativa.');
    } finally {
      setProductSubmitLoading(false);
    }
  };

  const handleGenerateSeed = () => {
    showAdminNotice('info', 'Seed manual removido na migração Supabase-only. Cadastre produtos manualmente no painel administrativo.');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(customerLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLogout = () => {
    onExitAdmin();
  };

  return (
    <div id="admin-panel-container" className="max-w-4xl mx-auto px-4 py-6">
      {/* Upper Title Bar Component */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 text-[11px] font-bold tracking-wider uppercase rounded-full border border-amber-500/15">
              Administrador
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Sessão Supabase ativa
            </span>
          </div>
          <h1 className="font-display font-bold text-3xl text-zinc-900 mt-1">
            Painel de Alimentação
          </h1>
          <p className="text-zinc-500 text-xs mt-0.5">
            Gerencie produtos, disponibilidade e dados de pagamento da loja física CIICC.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            id="exit-admin-btn"
            onClick={onExitAdmin}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium text-xs rounded-xl cursor-pointer transition-colors"
          >
            Ver Cardápio
          </button>
          <button
            id="admin-signout-btn"
            onClick={handleLogout}
            className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer transition-colors"
            title="Sair Administrativo"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {adminNotice && (
        <div className={`mb-5 rounded-2xl border px-4 py-3 text-xs font-semibold flex items-start gap-2 ${
          adminNotice.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : adminNotice.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}>
          {adminNotice.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
          ) : adminNotice.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{adminNotice.message}</span>
        </div>
      )}

      {/* Tabs list bar */}
      <div className="flex border-b border-zinc-150 mb-7">
        <button
          id="tab-products-btn"
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'border-amber-500 text-amber-600 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Meus Produtos ({products.length})
        </button>
        <button
          id="tab-settings-btn"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 text-center text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'border-amber-500 text-amber-600 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          PIX & WhatsApp Administrativo
        </button>
        <button
          id="tab-store-guidance-btn"
          onClick={() => setActiveTab('guidance')}
          className={`flex-1 py-3 text-center text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'guidance'
              ? 'border-amber-500 text-amber-600 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Orientações da Loja
        </button>
        <button
          id="tab-sales-btn"
          onClick={() => setActiveTab('sales')}
          className={`flex-1 py-3 text-center text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'sales'
              ? 'border-amber-500 text-amber-600 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Vendas e Acertos 📊
        </button>
        <button
          id="tab-batches-btn"
          onClick={() => setActiveTab('batches')}
          className={`flex-1 py-3 text-center text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'batches'
              ? 'border-amber-500 text-amber-600 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Controle de Lotes 📦
        </button>
      </div>

      {/* Active Content Components */}
      <div className="space-y-6">
        {/* TAB 1: Products Catalogs */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg text-zinc-900">
                Ofertas do Cardápio
              </h3>
              <div className="flex gap-2">
                {products.length === 0 && (
                  <button
                    id="seed-demo-data-btn"
                    onClick={handleGenerateSeed}
                    className="px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-650 border border-zinc-250 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                  >
                    Semear Produtos de Teste
                  </button>
                )}
                <button
                  id="add-product-btn"
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm shadow-amber-500/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Produto</span>
                </button>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-zinc-200 text-center rounded-3xl bg-zinc-50">
                <PackageCheck className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <h4 className="font-display font-medium text-zinc-850 text-base">Nenhum produto cadastrado</h4>
                <p className="text-zinc-500 text-xs px-8 mt-1.5 leading-relaxed max-w-sm mx-auto">
                  Alimente seu cardápio clicando em "Novo Produto" ou use o botão para carregar dados deliciosos demonstrativos!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    id={`product-row-${product.id}`}
                    className={`p-4 bg-white border rounded-2xl flex items-center justify-between gap-4 transition-all hover:shadow-sm ${
                      product.available ? 'border-zinc-150' : 'border-zinc-150 bg-zinc-50/60 opacity-75'
                    }`}
                  >
                    {/* Visual Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-2xl shrink-0">
                        {product.emoji || '🍽️'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-semibold text-zinc-900 text-sm truncate">
                            {product.name}
                          </h4>
                          <span className="px-1.5 py-0.5 bg-zinc-100 text-[10px] text-zinc-500 font-medium rounded">
                            {product.category}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-xs truncate max-w-md mt-0.5">
                          {product.description || 'Sem descrição.'}
                        </p>
                        <span className="font-mono text-xs font-semibold text-zinc-700 mt-1 block">
                          R$ {product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Actions and Switching */}
                    <div id={`product-actions-${product.id}`} className="flex items-center gap-4 shrink-0">
                      {/* Availability toggle */}
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          Ofertado
                        </span>
                        <button
                          id={`toggle-available-btn-${product.id}`}
                          onClick={() => handleProductToggleAvailability(product)}
                          className="text-zinc-700 hover:text-amber-600 transition-colors focus:outline-none"
                          title={product.available ? 'Remover oferta do cardápio' : 'Marcar para ofertar no cardápio'}
                        >
                          {product.available ? (
                            <ToggleRight className="w-8 h-8 text-amber-500 cursor-pointer" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-zinc-300 cursor-pointer" />
                          )}
                        </button>
                      </div>

                      {/* Line Controls Button */}
                      <div className="flex gap-1.5 border-l border-zinc-150 pl-3.5">
                        <button
                          id={`edit-product-btn-${product.id}`}
                          onClick={() => handleOpenEditModal(product)}
                          className="p-1.5 text-zinc-500 hover:text-amber-600 hover:bg-zinc-50 rounded-lg cursor-pointer transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-product-btn-${product.id}`}
                          onClick={() => handleProductDelete(product.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Settings Configuration Form */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-white border border-zinc-150 rounded-3xl p-6 space-y-5">
            <h3 className="font-display font-semibold text-lg text-zinc-900 pb-2 border-b border-zinc-100">
              Chave PIX e Contato Administrativo
            </h3>

            {settingsSaved && (
              <div className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs rounded-2xl text-center font-medium animate-pulse">
                Configurações gravadas com sucesso no Supabase!
              </div>
            )}

            {/* Store Name Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-650 mb-1.5 uppercase tracking-wider">
                Nome do Estabelecimento
              </label>
              <input
                id="setting-storename-input"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex Lamp: Pizzaria Veneza"
                required
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl text-zinc-800 outline-none transition-all"
              />
            </div>

            {/* PIX Key Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-650 mb-1.5 uppercase tracking-wider">
                Chave PIX da Loja CIICC
              </label>
              <input
                id="setting-pixkey-input"
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="E-mail, CNPJ, Celular, CPF ou Aleatória"
                required
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl text-zinc-800 outline-none transition-all font-mono"
              />
              <p className="text-zinc-500 text-[10px] mt-1 pr-4">
                Esta chave será exibida ao cliente para pagamento PIX da aquisição física.
              </p>
            </div>

            {/* WhatsApp Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-650 mb-1.5 uppercase tracking-wider">
                  Celular WhatsApp (com DDD)
                </label>
                <input
                  id="setting-phone-input"
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Ex: 11999999999"
                  required
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl text-zinc-800 outline-none transition-all font-mono"
                />
                <p className="text-zinc-500 text-[10px] mt-1 leading-relaxed">
                  Insira apenas números com código de país e DDD. Ex: 5511999999999.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-650 mb-1.5 uppercase tracking-wider">
                  Mensagem Inicial do WhatsApp
                </label>
                <input
                  id="setting-msg-input"
                  type="text"
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="Envie uma saudação para o cliente iniciar o chat..."
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl text-zinc-800 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              id="save-settings-btn"
              disabled={settingsLoading}
              className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-medium text-sm rounded-xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{settingsLoading ? 'Processando gravação...' : 'Gravar Configurações no Supabase'}</span>
            </button>
          </form>
        )}

        {/* TAB 3: Store guidance */}
        {activeTab === 'guidance' && (
          <div className="bg-white border border-zinc-150 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Controls */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-display font-semibold text-lg text-zinc-900">
                Orientações para Atendimento Físico
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Use este painel como referência administrativa da loja física CIICC. O fluxo validado do MVP é orientado à aquisição física: o cliente acessa o cardápio, seleciona produtos e informa a aquisição para conferência.
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-650 mb-1.5 uppercase tracking-wider">
                  Referência interna opcional
                </label>
                <input
                  id="guidance-reference-input"
                  type="text"
                  value={guidanceReference}
                  onChange={(e) => setGuidanceReference(e.target.value)}
                  placeholder="Ex: Loja CIICC, Cantina, Administrativo..."
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl text-zinc-800 outline-none transition-all font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  id="copy-customer-link-btn"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{copiedLink ? 'Link Copiado!' : 'Copiar URL do Cliente'}</span>
                </button>
              </div>
            </div>

            {/* Print Plaque Render */}
            <div className="md:col-span-3 flex flex-col items-center justify-center p-6 bg-amber-50/20 border border-amber-500/10 rounded-2xl">
              <div id="print-canvas-area" className="w-full max-w-[260px] bg-white border-2 border-amber-500/30 p-5 rounded-2xl shadow-md text-center flex flex-col items-center">
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest block mb-1">
                  {storeName || 'ESTABELECIMENTO'}
                </span>
                <span className="font-display font-bold text-2xl text-zinc-900 block mb-4">
                  REFERÊNCIA {guidanceReference || 'Loja CIICC'}
                </span>

                {/* Store guidance display */}
                <div className="w-44 h-44 bg-zinc-50 border border-zinc-100/50 rounded-xl flex items-center justify-center overflow-hidden mb-4 p-2 select-none">
                  <div className="text-center px-3">
                    <p className="text-[10px] uppercase tracking-wider font-black text-amber-600 mb-2">Link do cardápio</p>
                    <p className="text-[11px] font-mono text-zinc-700 break-all">{customerLink}</p>
                  </div>
                </div>

                <span className="text-[10px] text-zinc-500 font-mono leading-tight block">
                  Acesse o cardápio e confirme a aquisição pelo WhatsApp.
                </span>
              </div>

              <p className="text-zinc-500 text-[10px] mt-3 pr-2 text-center">
                Referência visual do link do cardápio para apoio administrativo da loja física CIICC.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: Sales Tracking & Accounting (Controle de Vendas e Contabilidade) */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* Accounting dashboard summary block (Contabilidade) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Revenue */}
              <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Faturamento Geral</span>
                  <h3 className="font-mono font-black text-2xl text-zinc-900 mt-1 leading-none">
                    R$ {sales.reduce((acc, s) => acc + s.totalAmount, 0).toFixed(2)}
                  </h3>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Coins className="w-5 h-5" />
                </div>
              </div>

              {/* PIX Revenue */}
              <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Recebido via PIX</span>
                  <h3 className="font-mono font-black text-2xl text-emerald-600 mt-1 leading-none">
                    R$ {sales.filter(s => s.paymentMethod === 'pix').reduce((acc, s) => acc + s.totalAmount, 0).toFixed(2)}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                  <DollarSign className="w-5 h-5 animate-pulse" />
                </div>
              </div>

              {/* Later / Pendia (Fiado) Revenue */}
              <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Pendente (Conta/Posterior)</span>
                  <h3 className="font-mono font-black text-2xl text-amber-700 mt-1 leading-none">
                    R$ {sales.filter(s => s.paymentMethod === 'later').reduce((acc, s) => acc + s.totalAmount, 0).toFixed(2)}
                  </h3>
                </div>
                <div className="p-3 bg-amber-500/5 text-amber-600 rounded-2xl">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {/* Quantidade de Transações */}
              <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Aquisições Realizadas</span>
                  <h3 className="font-mono font-black text-2xl text-zinc-800 mt-1 leading-none">
                    {sales.length} aquisições
                  </h3>
                </div>
                <div className="p-3 bg-zinc-100 text-zinc-500 rounded-2xl">
                  <PackageCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Main Sales Controller listing */}
            <div className="bg-white border border-zinc-150 rounded-3xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display font-semibold text-lg text-zinc-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-500" />
                    Controle de Aquisições da Loja
                  </h3>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    Painel centralizador para acompanhar aquisições físicas, formas de pagamento e conferência administrativa.
                  </p>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSalesPaymentFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                      salesPaymentFilter === 'all'
                        ? 'bg-amber-500 text-black border-amber-500'
                        : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesPaymentFilter('pix')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                      salesPaymentFilter === 'pix'
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50'
                    }`}
                  >
                    PIX informado
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesPaymentFilter('later')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                      salesPaymentFilter === 'later'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50'
                    }`}
                  >
                    Pagar Posterior
                  </button>
                </div>
              </div>

              {/* Search input bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Pesquisar por cliente, setor de trabalho ou produto adquirido..."
                  value={salesSearchQuery}
                  onChange={(e) => setSalesSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-hidden text-zinc-805"
                />
              </div>

              {/* Sales loading & zero states */}
              {salesLoading ? (
                <div className="py-12 text-center flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin animate-faster" />
                  <span className="text-xs text-zinc-500 font-medium animate-pulse">Sincronizando aquisições em tempo real...</span>
                </div>
              ) : sales.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-zinc-200 text-center rounded-3xl bg-zinc-50/50">
                  <PackageCheck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <h4 className="font-semibold text-zinc-800 text-sm">Nenhuma aquisição efetuada</h4>
                  <p className="text-zinc-500 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                    Quando os clientes registrarem aquisições no cardápio digital, o histórico administrativo aparecerá aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sales
                    .filter((sale) => {
                      const lowerQuery = salesSearchQuery.toLowerCase();
                      const matchSearch =
                        sale.customerName.toLowerCase().includes(lowerQuery) ||
                        sale.customerWorkplace.toLowerCase().includes(lowerQuery) ||
                        sale.items.some((it) => it.name.toLowerCase().includes(lowerQuery));

                      const matchFilter =
                        salesPaymentFilter === 'all' ||
                        sale.paymentMethod === salesPaymentFilter;

                      return matchSearch && matchFilter;
                    })
                    .map((sale) => {
                      return (
                        <div key={sale.id} className="p-5 border border-zinc-150 rounded-2xl hover:border-zinc-300 bg-zinc-50/30 transition-all space-y-4">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                            {/* Who Consumed layout */}
                            <div className="flex items-center gap-3">
                              {sale.customerPhotoUrl ? (
                                <img
                                  src={sale.customerPhotoUrl}
                                  alt={sale.customerName}
                                  className="w-12 h-12 rounded-full object-cover border border-zinc-200 shadow-3xs hover:scale-150 transition-transform cursor-pointer"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center">
                                  {sale.customerName.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-zinc-900 text-sm leading-tight">{sale.customerName}</h4>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-zinc-500">
                                  <span className="font-semibold bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-650">
                                    Setor: {sale.customerWorkplace || 'Sem Setor'}
                                  </span>
                                  <span className="bg-amber-100/50 text-amber-800 font-medium px-1.5 py-0.5 rounded border border-amber-500/10">
                                    Turno: {sale.customerShiftHours}
                                  </span>
                                  <span className="text-zinc-400 font-mono">
                                    {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit'
                                    }) : '-'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Method Badge & Action Header */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              {sale.paymentMethod === 'pix' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/15 rounded-full text-[10px] font-bold">
                                  <Check className="w-3 h-3" />
                                  {sale.paymentMethod === 'pix' ? 'PIX informado' : 'Acerto posterior'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-700 border border-amber-500/15 rounded-full text-[10px] font-bold">
                                  <Clock className="w-3 h-3" />
                                  {sale.paymentMethod === 'pix' ? 'PIX informado' : 'Acerto posterior'}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(`Deseja dar baixa ou excluir a aquisição de R$ ${sale.totalAmount.toFixed(2)} de ${sale.customerName}?`)) {
                                    try {
                                      await deleteSupabaseSale(sale.id);
                                      await loadSales();
                                      showAdminNotice('success', 'Aquisição baixada/removida da lista.');
                                    } catch (err) {
                                      console.error('Erro ao excluir aquisição no Supabase:', err);
                                      showAdminNotice('error', 'Houve um erro ao excluir o registro. Verifique sua sessão administrativa.');
                                    }
                                  }
                                }}
                                className="p-1 px-2 rounded-lg border border-red-100 hover:border-red-250 bg-white hover:bg-red-50 text-red-550 transition-colors text-[10px] font-semibold flex items-center gap-1"
                                title="Baixar aquisição da lista"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Dar Baixa</span>
                              </button>
                            </div>
                          </div>

                          {/* Items Consumed */}
                          <div className="p-3.5 bg-white border border-zinc-150 rounded-xl space-y-2">
                            <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Produtos Consumidos</span>
                            <div className="divide-y divide-zinc-100 text-xs">
                              {sale.items.map((item, index) => (
                                <div key={index} className="py-2 flex items-center justify-between text-zinc-750">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm select-none">{item.emoji || '🍽️'}</span>
                                    <span className="font-bold text-zinc-800">{item.quantity}x</span>
                                    <span>{item.name}</span>
                                  </div>
                                  <span className="font-mono text-zinc-500 text-[11px]">
                                    R$ {(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="pt-2 border-t border-zinc-150 flex items-center justify-between font-bold text-sm text-zinc-900">
                              <span>Total da aquisição</span>
                              <span className="font-mono text-amber-600">
                                R$ {sale.totalAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Product batch control is outside the current Supabase schema. */}
        {activeTab === 'batches' && (
          <div className="bg-white border border-zinc-150 rounded-3xl p-8 text-center">
            <PackageCheck className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-display font-semibold text-lg text-zinc-900">
              Controle de Lotes indisponível nesta etapa
            </h3>
            <p className="text-zinc-500 text-xs mt-2 max-w-md mx-auto leading-relaxed">
              Esta função ficou fora do escopo da migração Supabase atual porque ainda não há tabela Supabase correspondente para lotes. Nenhuma operação legada de lote permanece ativa.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: Add/Edit Product popup */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div id="product-form-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-zinc-100"
            >
              {/* Modal Head */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                <h3 className="font-display font-bold text-lg text-zinc-900">
                  {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
                <button
                  id="close-product-modal-btn"
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleProductFormSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1">
                      Nome do Produto *
                    </label>
                    <input
                      id="form-product-name"
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: X-Picanha Cheddar"
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl text-zinc-800 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1">
                      Categoria *
                    </label>
                    <select
                      id="form-product-category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl text-zinc-850 outline-none transition-all select-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">
                    Descrição do Produto
                  </label>
                  <textarea
                    id="form-product-description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descreva os ingredientes, tamanho ou detalhes do produto..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl text-zinc-805 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1">
                      Preço (R$) *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-medium text-xs">
                        R$
                      </div>
                      <input
                        id="form-product-price"
                        type="text"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="Ex: 29.90"
                        required
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl text-zinc-850 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1">
                      Ícone ou Emoji *
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="form-product-emoji"
                        type="text"
                        value={formEmoji}
                        onChange={(e) => setFormEmoji(e.target.value)}
                        placeholder="🍔"
                        maxLength={2}
                        className="w-14 text-center py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-lg outline-none"
                      />
                      {/* Fast Emojis picker bar */}
                      <div className="flex-1 flex gap-1 overflow-x-auto p-1.5 bg-zinc-50 border border-zinc-200 rounded-xl no-scrollbar self-center justify-around">
                        {POPULAR_EMOJIS.map((emj) => (
                          <button
                            key={emj}
                            type="button"
                            onClick={() => setFormEmoji(emj)}
                            className={`p-0.5 text-base hover:scale-125 transition-transform rounded cursor-pointer ${
                              formEmoji === emj ? 'bg-amber-100 scale-110' : ''
                            }`}
                          >
                            {emj}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">
                    URL da Imagem de Fundo (Opcional)
                  </label>
                  <input
                    id="form-product-imageurl"
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... (Deixe em branco para usar ícone)"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl text-zinc-800 outline-none transition-all font-mono"
                  />
                </div>

                {/* Available toggle inside form */}
                <div className="py-2.5 flex items-center justify-between bg-zinc-50 px-4 rounded-xl border border-zinc-150">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-800">
                      Disponibilizar Oferta para Clientes
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Se desmarcado, o produto ficará invisível no cardápio dos clientes.
                    </span>
                  </div>
                  <button
                    type="button"
                    id="form-available-toggle-btn"
                    onClick={() => setFormAvailable(!formAvailable)}
                    className="focus:outline-none"
                  >
                    {formAvailable ? (
                      <ToggleRight className="w-8 h-8 text-amber-500 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-300 cursor-pointer" />
                    )}
                  </button>
                </div>

                {/* Save controls */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="flex-1 py-3 border border-zinc-200 text-zinc-500 hover:text-zinc-800 font-medium text-xs rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    id="save-product-submit"
                    disabled={productSubmitLoading}
                    className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-xl cursor-pointer transition-all active:scale-95"
                  >
                    {productSubmitLoading ? 'Salvando...' : 'Salvar no Cardápio'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
