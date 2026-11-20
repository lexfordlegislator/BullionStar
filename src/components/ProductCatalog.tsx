import React, { useState } from 'react';
import { Check, Eye, Plus, ShieldCheck, X } from 'lucide-react';
import { useBullion } from '../context/BullionContext';
import { MetalType, Product } from '../types/bullion';
import { ResilientImage } from './ResilientImage';

interface ProductCatalogProps {
  mode: 'homepage' | 'full';
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ mode }) => {
  const {
    products,
    catalogFilter,
    setCatalogFilter,
    stockLocation,
    searchQuery,
    setSearchQuery,
    formatMoney,
    getProductPriceUSD,
    addToCart,
    setView,
    t,
  } = useBullion();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [fulfillmentChoice, setFulfillmentChoice] = useState<
    'Vault Storage (Singapore)' | 'Showroom Pickup (45 New Bridge Rd)' | 'Insured Delivery'
  >('Vault Storage (Singapore)');

  const trendingMetals = products.filter((p) => p.category !== 'Diamond' && p.trending).slice(0, 4);
  const certifiedDiamonds = products.filter((p) => p.category === 'Diamond');

  const filteredProducts = products.filter((p) => {
    const matchesCategory = catalogFilter === 'All' || p.category === catalogFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mintOrLab.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.giaNumber && p.giaNumber.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const renderCard = (product: Product) => {
    const priceUSD = getProductPriceUSD(product);
    const availableAtSelectedLocation = product.locations.includes(stockLocation);

    return (
      <div
        key={product.id}
        className="bg-white border border-slate-200 rounded hover:border-[#C59B27]/70 hover:shadow-sm transition-all flex flex-col overflow-hidden"
      >
        <div
          onClick={() => setSelectedProduct(product)}
          className="aspect-[4/3] bg-[#F8FAFC] border-b border-slate-100 overflow-hidden cursor-pointer relative group"
        >
          <ResilientImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
          />
        </div>

        <div className="p-4 flex-1 flex flex-col">
          {/* Unboxed Metadata */}
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
            <span className="truncate">
              {product.mintOrLab} · {product.weightLabel}
            </span>
            {product.gstExempt && (
              <span className="text-emerald-700 font-medium shrink-0">{t('catalog.gstExempt')}</span>
            )}
          </div>

          <h3
            onClick={() => setSelectedProduct(product)}
            className="text-sm font-semibold text-[#0D1F3C] leading-snug mb-2 cursor-pointer hover:text-[#B38818] transition-colors line-clamp-2"
          >
            {product.name}
          </h3>

          <div className="text-xs text-slate-600 space-y-0.5 mb-3">
            <div>{product.purityOrGrade}</div>
            {product.giaNumber && (
              <div className="font-mono text-[11px] text-[#0D1F3C]">
                GIA Report #{product.giaNumber} · {product.cutGrade}
              </div>
            )}
            <div className="text-[11px] text-slate-500">
              {availableAtSelectedLocation
                ? t('catalog.inStock', { location: stockLocation })
                : t('catalog.availableIn', { location: product.locations[0] })}
            </div>
          </div>

          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] text-slate-500">
                {product.category === 'Diamond'
                  ? t('catalog.fixedPrice')
                  : t('catalog.spotPlus', { pct: product.premiumPct.toFixed(2) })}
              </div>
              <div className="text-base font-mono font-bold text-[#0D1F3C] tabular-nums">
                {formatMoney(priceUSD)}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedProduct(product)}
                aria-label={`Inspect ${product.name}`}
                className="p-2 border border-slate-200 rounded text-slate-600 hover:text-[#0D1F3C] hover:bg-slate-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => addToCart(product, 1, 'Vault Storage (Singapore)')}
                className="inline-flex items-center gap-1 px-3 py-2 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] font-semibold text-xs rounded transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('catalog.add')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {mode === 'homepage' ? (
        <div className="space-y-10">
          {/* Trending Bullion Products */}
          <section className="max-w-[1360px] mx-auto px-4 lg:px-6 pt-8">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0D1F3C]">
                  {t('catalog.trendingTitle')}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  {t('catalog.trendingSub', { location: stockLocation })}
                </p>
              </div>
              <button
                onClick={() => {
                  setCatalogFilter('All');
                  setView('catalog');
                }}
                className="text-sm font-semibold text-[#0D1F3C] hover:text-[#B38818] underline underline-offset-4 whitespace-nowrap shrink-0"
              >
                {t('catalog.viewFull')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {trendingMetals.map(renderCard)}
            </div>
          </section>

          {/* Certified GIA Diamonds Showcase */}
          <section className="max-w-[1360px] mx-auto px-4 lg:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0D1F3C]">
                  {t('catalog.diamondsTitle')}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">{t('catalog.diamondsSub')}</p>
              </div>
              <button
                onClick={() => {
                  setCatalogFilter('Diamond');
                  setView('catalog');
                }}
                className="text-sm font-semibold text-[#0D1F3C] hover:text-[#B38818] underline underline-offset-4 whitespace-nowrap shrink-0"
              >
                {t('catalog.viewDiamonds')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {certifiedDiamonds.map(renderCard)}
            </div>
          </section>
        </div>
      ) : (
        <section className="max-w-[1360px] mx-auto px-4 lg:px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0D1F3C]">{t('catalog.exchangeTitle')}</h1>
              <p className="text-sm text-slate-600 mt-1">
                {t('catalog.showingProducts', { count: filteredProducts.length })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 border border-slate-200 rounded">
              {(['All', 'Gold', 'Silver', 'Platinum', 'Palladium', 'Diamond'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatalogFilter(cat as MetalType | 'All')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors whitespace-nowrap shrink-0 ${
                    catalogFilter === cat
                      ? 'bg-[#0D1F3C] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#0D1F3C]'
                  }`}
                >
                  {t(`metal.${cat}`)}
                </button>
              ))}
            </div>
          </div>

          {searchQuery && (
            <div className="mb-5 flex items-center justify-between bg-white px-4 py-2.5 border border-slate-200 rounded text-sm">
              <span>
                {t('catalog.filteredBySearch')}{' '}
                <strong className="text-[#0D1F3C]">{searchQuery}</strong>
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-[#B38818] hover:underline"
              >
                {t('catalog.clearFilter')}
              </button>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded p-12 text-center">
              <p className="text-base font-semibold text-[#0D1F3C]">{t('catalog.noMatchesTitle')}</p>
              <p className="text-sm text-slate-500 mt-1">{t('catalog.noMatchesSub')}</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCatalogFilter('All');
                }}
                className="mt-4 px-4 py-2 bg-[#0D1F3C] text-white text-sm font-medium rounded"
              >
                {t('catalog.resetFilters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredProducts.map(renderCard)}
            </div>
          )}
        </section>
      )}

      {/* Product Assay & Dossier Inspection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-3xl w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0D1F3C] text-white">
              <div>
                <p className="text-xs text-[#F2D06B] font-mono">{selectedProduct.sku}</p>
                <h3 className="text-lg font-bold">{selectedProduct.name}</h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                aria-label="Close product modal"
                className="p-1.5 hover:bg-white/10 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-[#F8FAFC] p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
                <div className="aspect-[4/3] w-full rounded overflow-hidden border border-slate-200 bg-white">
                  <ResilientImage src={selectedProduct.image} alt={selectedProduct.name} />
                </div>
              </div>

              <div className="p-6 flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {selectedProduct.description}
                  </p>

                  <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs border-t border-b border-slate-100 py-3">
                    <div>
                      <dt className="text-slate-500">{t('catalog.mintOrLab')}</dt>
                      <dd className="font-semibold text-slate-900">{selectedProduct.mintOrLab}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">{t('catalog.weightCarat')}</dt>
                      <dd className="font-semibold text-slate-900">{selectedProduct.weightLabel}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">{t('catalog.purityGrade')}</dt>
                      <dd className="font-semibold text-slate-900">{selectedProduct.purityOrGrade}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">{t('catalog.singaporeGst')}</dt>
                      <dd className="font-semibold text-emerald-700">
                        {selectedProduct.gstExempt
                          ? t('catalog.gstExemptFull')
                          : t('catalog.gstStandard')}
                      </dd>
                    </div>
                    {selectedProduct.giaNumber && (
                      <div className="col-span-2">
                        <dt className="text-slate-500">{t('catalog.giaCut')}</dt>
                        <dd className="font-mono font-semibold text-[#0D1F3C]">
                          #{selectedProduct.giaNumber} · {selectedProduct.cutGrade}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">
                      {t('catalog.selectDelivery')}
                    </label>
                    <select
                      value={fulfillmentChoice}
                      onChange={(e) =>
                        setFulfillmentChoice(
                          e.target.value as
                            | 'Vault Storage (Singapore)'
                            | 'Showroom Pickup (45 New Bridge Rd)'
                            | 'Insured Delivery'
                        )
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-900"
                    >
                      <option value="Vault Storage (Singapore)">{t('catalog.optVault')}</option>
                      <option value="Showroom Pickup (45 New Bridge Rd)">
                        {t('catalog.optShowroom')}
                      </option>
                      <option value="Insured Delivery">{t('catalog.optCourier')}</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">{t('catalog.liveExecPrice')}</span>
                    <span className="text-xl font-mono font-bold text-[#0D1F3C] tabular-nums">
                      {formatMoney(getProductPriceUSD(selectedProduct))}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      addToCart(selectedProduct, 1, fulfillmentChoice);
                      setSelectedProduct(null);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] font-semibold text-sm rounded transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('catalog.addToOrder')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{t('catalog.assuranceNote')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
