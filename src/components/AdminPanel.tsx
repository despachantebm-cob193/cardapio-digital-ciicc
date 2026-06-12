import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  QrCode,
  Smartphone,
  Check,
  LogOut,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  PackageCheck,
  Coins,
  DollarSign,
  BriefcaseMedical, // used for custom categories or tags
  X,
  FileText,
  Users,
  Clock,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, StoreSetting, ProductBatch } from '../types';
import {
  saveStoreSettings,
  addProduct,
  updateProduct,
  deleteProduct,
  seedInitialDataIfNeeded,
  subscribeSales,
  deleteSale,
  Sale,
  addProductBatch,
  updateProductBatch,
  deleteProductBatch,
  subscribeProductBatches
} from '../dbService';
import { logout, auth } from '../firebase';

interface AdminPanelProps {
  products: Product[];
  settings: StoreSetting;
  onExitAdmin: () => void;
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

export default function AdminPanel({ products, settings, onExitAdmin }: AdminPanelProps) {
  // Settings Form State
  const [storeName, setStoreName] = useState(settings.storeName);
  const [pixKey, setPixKey] = useState(settings.pixKey);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [whatsappMessage, setWhatsappMessage] = useState(settings.whatsappMessage);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Active Tab: 'products' | 'settings' | 'qrcode' | 'sales' | 'batches'
  const [activeTab, setActiveTab] = useState<'products' | 'settings' | 'qrcode' | 'sales' | 'batches'>('products');

  // Sales list track state
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [salesPaymentFilter, setSalesPaymentFilter] = useState<'all' | 'pix' | 'later'>('all');

  // Product Lot/Batch states
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null);
  const [formBatchProductId, setFormBatchProductId] = useState('');
  const [formBatchDate, setFormBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [formBatchInitialQuantity, setFormBatchInitialQuantity] = useState('');
  const [batchSubmitLoading, setBatchSubmitLoading] = useState(false);

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

  // QR Placard State
  const [qrTableNumber, setQrTableNumber] = useState('01');
  const [copiedLink, setCopiedLink] = useState(false);

  const currentAppUrl = window.location.origin + window.location.pathname;
  const qrBaseUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=d97706&data=`;
  const customerLink = `${currentAppUrl}?mesa=${qrTableNumber}`;
  const qrCodeUrl = `${qrBaseUrl}${encodeURIComponent(customerLink)}`;

  // Sync settings state when prop resolves
  useEffect(() => {
    setStoreName(settings.storeName);
    setPixKey(settings.pixKey);
    setWhatsappNumber(settings.whatsappNumber);
    setWhatsappMessage(settings.whatsappMessage);
  }, [settings]);

  // Real-time subscribe to register sales and orders
  useEffect(() => {
    if (activeTab === 'sales' || activeTab === 'batches') {
      setSalesLoading(true);
      const unsubscribe = subscribeSales(
        (data) => {
          setSales(data);
          setSalesLoading(false);
        },
        (err) => {
          console.error("Erro na escuta de vendas/comandas em tempo real:", err);
          setSalesLoading(false);
        }
      );
      return () => unsubscribe();
    }
  }, [activeTab]);

  // Real-time subscribe to lot/batch records
  useEffect(() => {
    if (activeTab === 'batches') {
      setBatchesLoading(true);
      const unsubscribe = subscribeProductBatches(
        (data) => {
          setBatches(data);
          setBatchesLoading(false);
        },
        (err) => {
          console.error("Erro na escuta de lotes de produtos:", err);
          setBatchesLoading(false);
        }
      );
      return () => unsubscribe();
    }
  }, [activeTab]);

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
      await saveStoreSettings(cleanSettings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      console.error('Falha ao salvar configurações:', err);
      alert('Sua sessão de escrita expirou ou você não está conectado com o Google. Use o botão no topo do painel!');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleProductToggleAvailability = async (product: Product) => {
    try {
      await updateProduct(product.id, { available: !product.available });
    } catch (err) {
      console.error('Falha ao alternar disponibilidade:', err);
      alert('Sem permissão de gravação. Por favor, conecte-se com o Google.');
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
        await deleteProduct(id);
      } catch (err) {
        console.error('Falha ao deletar produto:', err);
        alert('Erro ao excluir produto. Verifique suas credenciais.');
      }
    }
  };

  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice.trim()) {
      alert('Nome e Preço são obrigatórios!');
      return;
    }

    const priceNum = parseFloat(formPrice.replace(',', '.'));
    if (isNaN(priceNum) || priceNum < 0) {
      alert('Por favor, insira um preço válido maior ou igual a zero.');
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
        await updateProduct(editingProduct.id, productPayload);
      } else {
        await addProduct(productPayload);
      }

      setIsProductModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      alert('Sua sessão no Firebase expirou ou você não tem acesso de gravação. Faça login por Google se possível.');
    } finally {
      setProductSubmitLoading(false);
    }
  };

  // Handlers for Product Batches (Lotes de Produtos)
  const handleBatchFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBatchProductId || !formBatchDate || !formBatchInitialQuantity) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const selectedProd = products.find(p => p.id === formBatchProductId);
    if (!selectedProd) {
      alert('Produto selecionado não encontrado.');
      return;
    }

    setBatchSubmitLoading(true);
    try {
      const initQty = parseInt(formBatchInitialQuantity, 10);
      if (isNaN(initQty) || initQty < 0) {
        alert('A quantidade inicial deve ser zero ou maior.');
        setBatchSubmitLoading(false);
        return;
      }

      if (editingBatch) {
        await updateProductBatch(editingBatch.id, {
          productId: formBatchProductId,
          productName: selectedProd.name,
          batchDate: formBatchDate,
          initialQuantity: initQty
        });
      } else {
        await addProductBatch({
          productId: formBatchProductId,
          productName: selectedProd.name,
          batchDate: formBatchDate,
          initialQuantity: initQty
        });
      }
      setIsBatchModalOpen(false);
      setEditingBatch(null);
      setFormBatchProductId('');
      setFormBatchInitialQuantity('');
    } catch (err) {
      console.error('Erro ao salvar lote:', err);
      alert('Erro ao salvar o lote. Verifique seus privilégios de administrador.');
    } finally {
      setBatchSubmitLoading(false);
    }
  };

  const openAddBatchModal = () => {
    setEditingBatch(null);
    setFormBatchProductId(products[0]?.id || '');
    setFormBatchDate(new Date().toISOString().split('T')[0]);
    setFormBatchInitialQuantity('');
    setIsBatchModalOpen(true);
  };

  const openEditBatchModal = (batch: ProductBatch) => {
    setEditingBatch(batch);
    setFormBatchProductId(batch.productId);
    setFormBatchDate(batch.batchDate);
    setFormBatchInitialQuantity(batch.initialQuantity.toString());
    setIsBatchModalOpen(true);
  };

  const handleDeleteBatch = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o lote registrado para "${name}"?`)) {
      try {
        await deleteProductBatch(id);
      } catch (err) {
        console.error('Erro ao deletar lote:', err);
        alert('Erro ao excluir o lote.');
      }
    }
  };

  const getBatchSold = (batch: ProductBatch) => {
    let soldCount = 0;
    const batchStart = new Date(batch.batchDate + 'T00:00:00');
    sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt);
      if (saleDate >= batchStart) {
        sale.items.forEach(item => {
          if (item.productId === batch.productId || item.name.toLowerCase() === batch.productName.toLowerCase()) {
            soldCount += item.quantity;
          }
        });
      }
    });
    return soldCount;
  };

  const handleGenerateSeed = async () => {
    if (window.confirm('Deseja semear o cardápio com produtos de teste deliciosos?')) {
      try {
        await seedInitialDataIfNeeded();
        alert('Cardápio semeado com sucesso! Atualizando produtos...');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(customerLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      onExitAdmin();
    } catch (err) {
      console.error(err);
    }
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
            {auth.currentUser && (
              <span className="text-[11px] font-mono text-zinc-400">
                ({auth.currentUser.email})
              </span>
            )}
          </div>
          <h1 className="font-display font-bold text-3xl text-zinc-900 mt-1">
            Painel de Alimentação
          </h1>
          <p className="text-zinc-500 text-xs mt-0.5">
            Crie produtos, alterne a oferta e configure os dados de pagamento PIX.
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
            id="admin-logout-btn"
            onClick={handleLogout}
            className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer transition-colors"
            title="Sair Administrativo"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

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
          Configurações PIX & WhatsApp
        </button>
        <button
          id="tab-qrcode-btn"
          onClick={() => setActiveTab('qrcode')}
          className={`flex-1 py-3 text-center text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'qrcode'
              ? 'border-amber-500 text-amber-600 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Placard / QR Code
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

      {/* Test PIN indicator banner if not authenticated with Google */}
      {(!auth.currentUser || !auth.currentUser.emailVerified) && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/15 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-display font-medium text-xs text-amber-900 flex items-center gap-1.5 leading-none">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Acesso em Modo de Teste (PIN ou Não Verificado)
            </h4>
            <p className="text-amber-800 text-[11px] leading-relaxed font-light">
              Você acessou o painel administrativo utilizando credenciais locais de teste. Modificações ou novos produtos <strong>não serão gravados no banco de dados na nuvem</strong> até que você se autentique com uma Conta Google.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="self-start md:self-auto shrink-0 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
          >
            Entrar via Google
          </button>
        </div>
      )}

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
              Chave PIX e Contatos de Atendimento
            </h3>

            {settingsSaved && (
              <div className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs rounded-2xl text-center font-medium animate-pulse">
                Configurações gravadas com sucesso no Firebase Cloud!
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
                Chave PIX do Estabelecimento
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
                Esta chave será exibida para o cliente copiar na hora de fazer o acerto financeiro do pedido.
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
              <span>{settingsLoading ? 'Processando gravação...' : 'Gravar Configurações no Firebase'}</span>
            </button>
          </form>
        )}

        {/* TAB 3: QR Placard Generator */}
        {activeTab === 'qrcode' && (
          <div className="bg-white border border-zinc-150 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Controls */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-display font-semibold text-lg text-zinc-900">
                Criar Displays de Mesa
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Gere e imprima QR Codes exclusivos para colocar nas mesas do seu estabelecimento. Quando o cliente escaneia o código, o cardápio abre automaticamente identificado com o número correspondente da mesa!
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-650 mb-1.5 uppercase tracking-wider">
                  Número da Mesa
                </label>
                <input
                  id="qr-table-number-input"
                  type="text"
                  value={qrTableNumber}
                  onChange={(e) => setQrTableNumber(e.target.value)}
                  placeholder="Ex: 01, 02, Especial..."
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
                  MESA {qrTableNumber || '01'}
                </span>

                {/* QR Display */}
                <div className="w-44 h-44 bg-zinc-50 border border-zinc-100/50 rounded-xl flex items-center justify-center overflow-hidden mb-4 p-2 select-none">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <span className="text-[10px] text-zinc-500 font-mono leading-tight block">
                  Aponte seu celular e peça pelo WhatsApp!
                </span>
              </div>

              <p className="text-zinc-500 text-[10px] mt-3 pr-2 text-center">
                Visualização do display de mesa gerado. Exiba esta imagem no caixa ou imprima para colocar nos displays.
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
                    {sales.length} comandas
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
                    Controlador de Vendas & Comandas
                  </h3>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    Painel centralizador para controlar consumo de clientes, métodos de pagamento e realizar baixa de contas.
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
                    Pago via PIX
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
                  placeholder="Pesquisar por cliente, setor de trabalho ou prato consumido..."
                  value={salesSearchQuery}
                  onChange={(e) => setSalesSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-hidden text-zinc-805"
                />
              </div>

              {/* Sales loading & zero states */}
              {salesLoading ? (
                <div className="py-12 text-center flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin animate-faster" />
                  <span className="text-xs text-zinc-500 font-medium animate-pulse">Sincronizando comanda em tempo real...</span>
                </div>
              ) : sales.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-zinc-200 text-center rounded-3xl bg-zinc-50/50">
                  <PackageCheck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <h4 className="font-semibold text-zinc-800 text-sm">Nenhuma aquisição efetuada</h4>
                  <p className="text-zinc-500 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                    Quando os clientes realizarem seus pedidos no cardápio digital, os relatórios de consumo completo aparecerão instantaneamente aqui.
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
                                  PAGO PIX
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-700 border border-amber-500/15 rounded-full text-[10px] font-bold">
                                  <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                                  PAGAR POSTERIOR
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(`Deseja dar baixa ou excluir a comanda de R$ ${sale.totalAmount.toFixed(2)} de ${sale.customerName}?`)) {
                                    try {
                                      await deleteSale(sale.id);
                                    } catch (err) {
                                      alert('Houve um erro ao excluir o registro.');
                                    }
                                  }
                                }}
                                className="p-1 px-2 rounded-lg border border-red-100 hover:border-red-250 bg-white hover:bg-red-50 text-red-550 transition-colors text-[10px] font-semibold flex items-center gap-1"
                                title="Liquidar comanda da lista"
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
                              <span>Total da Comanda</span>
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

        {/* TAB 5: Live Batch Lot & Stock accounting list */}
        {activeTab === 'batches' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold text-lg text-zinc-900 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-amber-500" />
                  Controle de Lotes de Lançamento
                </h3>
                <p className="text-zinc-500 text-xs mt-0.5">
                  Acompanhe e controle lotes prontos de pratos ou produtos. Pratos vendidos em comandas abatem o lote a partir da data de disponibilização.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddBatchModal}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all outline-hidden cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Registrar Novo Lote
              </button>
            </div>

            {/* Dashboard summary block (Lotes / Contabilidade) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Quantidade de lotes */}
              <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Lotes Ativos</span>
                  <h3 className="font-mono font-black text-2xl text-zinc-900 mt-1 leading-none">
                    {batches.length} cadastrados
                  </h3>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Sliders className="w-5 h-5" />
                </div>
              </div>

              {/* Total Item Count */}
              <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Itens Disponibilizados</span>
                  <h3 className="font-mono font-black text-2xl text-zinc-850 mt-1 leading-none">
                    {batches.reduce((acc, b) => acc + b.initialQuantity, 0)} un.
                  </h3>
                </div>
                <div className="p-3 bg-zinc-100 text-zinc-500 rounded-2xl">
                  <PackageCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Total Items Sold */}
              <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Vendido em Comandas</span>
                  <h3 className="font-mono font-black text-2xl text-emerald-600 mt-1 leading-none">
                    {batches.reduce((acc, b) => acc + getBatchSold(b), 0)} un.
                  </h3>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              {/* Total Stock Remain */}
              <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Unidades Restantes / Sobra</span>
                  <h3 className="font-mono font-black text-2xl text-amber-700 mt-1 leading-none">
                    {batches.reduce((acc, b) => {
                      const sold = getBatchSold(b);
                      return acc + Math.max(0, b.initialQuantity - sold);
                    }, 0)} un.
                  </h3>
                </div>
                <div className="p-3 bg-amber-500/5 text-amber-600 rounded-2xl">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Main Batch List Container */}
            <div className="bg-white border border-zinc-150 rounded-3xl p-6">
              {batchesLoading ? (
                <div className="py-12 text-center flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin animate-faster" />
                  <span className="text-xs text-zinc-500 font-medium">Sincronizando lotes em tempo real...</span>
                </div>
              ) : batches.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-zinc-200 text-center rounded-3xl bg-zinc-50/50">
                  <PackageCheck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <h4 className="font-semibold text-zinc-800 text-sm">Nenhum lote de produto cadastrado</h4>
                  <p className="text-zinc-500 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                    Clique em "Registrar Novo Lote" para lançar um lote produzido com data de disponibilização, integrando o estoque com as comandas de vendas automaticamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch) => {
                    const sold = getBatchSold(batch);
                    const leftover = Math.max(0, batch.initialQuantity - sold);
                    const percentSold = batch.initialQuantity > 0 ? Math.min(100, (sold / batch.initialQuantity) * 100) : 0;
                    const prodMatch = products.find(p => p.id === batch.productId);

                    return (
                      <div key={batch.id} className="p-5 border border-zinc-150 rounded-2xl hover:border-zinc-300 bg-zinc-50/30 transition-all space-y-4">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl select-none shrink-0 p-2.5 bg-amber-500/10 rounded-xl leading-none">
                              {prodMatch?.emoji || '📦'}
                            </span>
                            <div>
                              <h4 className="font-bold text-zinc-900 text-sm leading-tight">
                                {batch.productName}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-zinc-500">
                                <span className="font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-500/10">
                                  Lançamento: {new Date(batch.batchDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </span>
                                <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-650">
                                  Categoria: {prodMatch?.category || 'Alimentação'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => openEditBatchModal(batch)}
                              className="p-1.5 px-2.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white text-zinc-650 hover:text-zinc-800 transition-colors text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBatch(batch.id, batch.productName)}
                              className="p-1.5 px-2.5 rounded-lg border border-red-100 hover:border-red-250 bg-white hover:bg-red-50 text-red-550 transition-colors text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Deletar</span>
                            </button>
                          </div>
                        </div>

                        {/* Batch metrics and progress bar slider */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-white border border-zinc-150/80 p-3 rounded-xl">
                            <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Total Disponibilizado</span>
                            <span className="font-mono font-bold text-zinc-800 text-sm block mt-0.5">
                              {batch.initialQuantity} unidades
                            </span>
                          </div>

                          <div className="bg-white border border-zinc-150/80 p-3 rounded-xl">
                            <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Total Vendido</span>
                            <span className="font-mono font-bold text-emerald-600 text-sm block mt-0.5">
                              {sold} unidades
                            </span>
                          </div>

                          <div className="bg-white border border-zinc-150/80 p-3 rounded-xl">
                            <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Sobra no Estoque</span>
                            <span className={`font-mono font-bold text-sm block mt-0.5 ${leftover > 0 ? 'text-amber-700' : 'text-zinc-500'}`}>
                              {leftover} unidades
                            </span>
                          </div>
                        </div>

                        {/* Inventory slider track progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-zinc-455 font-semibold">
                            <span>Vendido ({percentSold.toFixed(0)}%)</span>
                            <span>Restante ({leftover} pratos)</span>
                          </div>
                          <div className="w-full bg-zinc-150 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${percentSold >= 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                              style={{ width: `${percentSold}%` }}
                            />
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

      {/* MODAL: Add/Edit Product Batch */}
      <AnimatePresence>
        {isBatchModalOpen && (
          <div id="batch-form-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-zinc-100"
            >
              {/* Modal Head */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                <h3 className="font-display font-bold text-lg text-zinc-900">
                  {editingBatch ? 'Editar Lote de Lançamento' : 'Registrar Novo Lote'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleBatchFormSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">
                    Selecione o Produto *
                  </label>
                  <select
                    value={formBatchProductId}
                    onChange={(e) => setFormBatchProductId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl text-zinc-800 outline-hidden transition-all"
                  >
                    <option value="" disabled>Selecione um produto cadastrado...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.emoji} {p.name} (R$ {p.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">
                    Data que o Lote foi Disponibilizado *
                  </label>
                  <input
                    type="date"
                    value={formBatchDate}
                    onChange={(e) => setFormBatchDate(e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl text-zinc-800 outline-hidden transition-all"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Vendas deste produto registradas a partir desta data contarão automaticamente como baixas do lote.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">
                    Quantidade Total Disponibilizada *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 50"
                    value={formBatchInitialQuantity}
                    onChange={(e) => setFormBatchInitialQuantity(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl text-zinc-800 outline-hidden transition-all"
                  />
                </div>

                {/* Dynamic Leftover/Sold calculation preview */}
                {formBatchProductId && formBatchDate && (
                  <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl space-y-2">
                    <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider block">Estoque & Sobra do Lote (Simulação)</span>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Total Vendido</span>
                        <span className="font-mono font-bold text-sm text-emerald-600">
                          {(() => {
                            let soldCount = 0;
                            const batchStart = new Date(formBatchDate + 'T00:00:00');
                            const selectedProd = products.find(p => p.id === formBatchProductId);
                            sales.forEach(sale => {
                              const saleDate = new Date(sale.createdAt);
                              if (saleDate >= batchStart) {
                                sale.items.forEach(item => {
                                  if (
                                    item.productId === formBatchProductId || 
                                    (selectedProd && item.name.toLowerCase() === selectedProd.name.toLowerCase())
                                  ) {
                                    soldCount += item.quantity;
                                  }
                                });
                              }
                            });
                            return soldCount;
                          })()}{' '}
                          unidades
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block font-semibold text-amber-900">Não Vendido / Sobra</span>
                        <span className="font-mono font-black text-sm text-amber-700">
                          {(() => {
                            let soldCount = 0;
                            const batchStart = new Date(formBatchDate + 'T00:00:00');
                            const selectedProd = products.find(p => p.id === formBatchProductId);
                            sales.forEach(sale => {
                              const saleDate = new Date(sale.createdAt);
                              if (saleDate >= batchStart) {
                                sale.items.forEach(item => {
                                  if (
                                    item.productId === formBatchProductId || 
                                    (selectedProd && item.name.toLowerCase() === selectedProd.name.toLowerCase())
                                  ) {
                                    soldCount += item.quantity;
                                  }
                                });
                              }
                            });
                            const initial = parseInt(formBatchInitialQuantity, 10) || 0;
                            return Math.max(0, initial - soldCount);
                          })()}{' '}
                          unidades
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit button layout */}
                <div className="pt-4 flex gap-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(false)}
                    className="flex-1 py-3 text-xs font-bold text-zinc-500 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-150 rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={batchSubmitLoading}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {batchSubmitLoading ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{editingBatch ? 'Salvar Lote' : 'Adicionar Lote'}</span>
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
