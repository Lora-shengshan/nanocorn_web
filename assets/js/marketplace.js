// Marketplace search and catalog listing queries
window.allMarketplaceProducts = [];

async function fetchMarketplaceCatalog() {
    try {
        const res = await secureFetch("/api/portal/products");
        if (!res.ok) throw new Error("Failed to fetch marketplace catalog.");
        const data = await res.json();
        window.allMarketplaceProducts = data;
        renderMarketplaceGrid(data);
    } catch (error) {
        console.error(error);
        const grid = document.getElementById('marketplace-products-grid');
        if (grid) {
            grid.innerHTML = `<div class="col-span-full p-8 text-center text-red-500 font-semibold text-sm">Failed to load marketplace catalog.</div>`;
        }
    }
}

function renderMarketplaceGrid(products) {
    const grid = document.getElementById('marketplace-products-grid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <i class="fa-solid fa-store-slash text-4xl text-slate-300 mb-3 block"></i>
                <h4 class="text-brand-navy font-black text-sm" data-i18n="No Listings Found">No Listings Found</h4>
                <p class="text-xs text-brand-slate mt-1" data-i18n="Try refining your filter search terms.">Try refining your filter search terms.</p>
            </div>
        `;
        return;
    }

    let html = "";
    products.forEach(p => {
        const logoUrl = p.productLogo || 'https://storage.googleapis.com/nanocorn-vault/logos/prd_app_default.png';
        const askingPriceStr = (p.askingPrice !== undefined && p.askingPrice !== null) ? `$${p.askingPrice.toLocaleString()}` : "N/A";
        
        let badges = "";
        if (Array.isArray(p.productType)) {
            p.productType.forEach(t => {
                badges += `<span class="bg-blue-50 text-blue-600 text-[10px] font-extrabold px-2 py-1 rounded-md uppercase tracking-wider">${t}</span> `;
            });
        }
        if (Array.isArray(p.techStack)) {
            p.techStack.forEach(t => {
                badges += `<span class="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2 py-1 rounded-md uppercase tracking-wider">${t}</span> `;
            });
        }

        let revInfo = "";
        if (p.hasRevenue) {
            revInfo = `
                <div class="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-[11px]">
                    <div><strong class="text-brand-slate" data-i18n="MRR">MRR:</strong> <span class="font-extrabold text-brand-emerald">$${(p.mrr || 0).toLocaleString()}</span></div>
                    <div><strong class="text-brand-slate" data-i18n="ARR">ARR:</strong> <span class="font-extrabold text-brand-emerald">$${(p.arr || 0).toLocaleString()}</span></div>
                </div>
            `;
        } else {
            revInfo = `
                <div class="mt-4 pt-4 border-t border-slate-100 text-[11px] text-brand-slate italic font-medium" data-i18n="Pre-revenue asset / high-growth potential">
                    Pre-revenue asset / high-growth potential
                </div>
            `;
        }

        html += `
            <div class="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-slate-100/80 transition-all flex flex-col justify-between">
                <div>
                    <div class="flex items-start gap-4">
                        <img src="${logoUrl}" alt="Product Logo" class="w-14 h-14 rounded-2xl object-cover border border-slate-100 flex-shrink-0 bg-brand-light">
                        <div class="space-y-1">
                            <h3 class="text-base font-black text-brand-navy line-clamp-1">${p.title}</h3>
                            <div class="flex flex-wrap gap-1">${badges}</div>
                        </div>
                    </div>
                    <p class="text-xs text-brand-slate mt-4 line-clamp-3 leading-relaxed font-medium">${p.description}</p>
                    ${revInfo}
                </div>
                <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider" data-i18n="Asking Price">Asking Price</div>
                        <div class="text-lg font-black text-brand-emerald">${askingPriceStr}</div>
                    </div>
                    <button onclick="openNdaModal('${p.productId}')" class="bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-slate-100 flex items-center gap-1.5">
                        <i class="fa-solid fa-shield-halved"></i> <span data-i18n="Unlock Details">Unlock Details</span>
                    </button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function applyMarketplaceFilters() {
    const filterTech = (document.getElementById('filter-tech').value || '').trim().toLowerCase();
    const filterPriceVal = (document.getElementById('filter-price').value || '').trim();
    const filterPrice = filterPriceVal ? parseFloat(filterPriceVal) : Infinity;
    const filterCategory = document.getElementById('filter-category').value;

    const filtered = window.allMarketplaceProducts.filter(p => {
        if (filterTech) {
            const titleMatch = (p.title || '').toLowerCase().includes(filterTech);
            const descMatch = (p.description || '').toLowerCase().includes(filterTech);
            const techMatch = Array.isArray(p.techStack) && p.techStack.some(t => t.toLowerCase().includes(filterTech));
            const typeMatch = Array.isArray(p.productType) && p.productType.some(t => t.toLowerCase().includes(filterTech));
            if (!titleMatch && !descMatch && !techMatch && !typeMatch) {
                return false;
            }
        }

        if (p.askingPrice > filterPrice) {
            return false;
        }

        if (filterCategory && filterCategory !== 'all') {
            const typeMatch = Array.isArray(p.productType) && p.productType.includes(filterCategory);
            if (!typeMatch) {
                return false;
            }
        }

        return true;
    });

    renderMarketplaceGrid(filtered);
}
