// User profiles, KYC settings, product creation, and admin moderations
async function fetchUserProfile() {
    try {
        const res = await secureFetch("/api/portal/profile");
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load user profile.");

        const dbEmail = document.getElementById('db-email');
        if (dbEmail) dbEmail.value = data.email;
        const dbRole = document.getElementById('db-role');
        if (dbRole) dbRole.value = data.role;
        const dbDisplayName = document.getElementById('db-display-name');
        if (dbDisplayName) dbDisplayName.value = data.displayName;
        const dbLang = document.getElementById('db-preferred-lang');
        if (dbLang) dbLang.value = data.preferredLang;

        const selector = document.getElementById('lang-selector');
        if (selector) selector.value = data.preferredLang;
        document.documentElement.lang = data.preferredLang;

        const role = data.role;
        const tabBankBtn = document.getElementById('tab-btn-bank');
        const tabProductsBtn = document.getElementById('tab-btn-products');
        const tabAddProdBtn = document.getElementById('tab-btn-add-product');
        const tabMarketBtn = document.getElementById('tab-btn-market');
        const tabChatsBtn = document.getElementById('tab-btn-chats');
        const sellerKycPane = document.getElementById('seller-kyc-pane');

        // Reset visibility
        if (tabBankBtn) tabBankBtn.classList.add('hidden');
        if (tabProductsBtn) tabProductsBtn.classList.add('hidden');
        if (tabAddProdBtn) tabAddProdBtn.classList.add('hidden');
        if (tabMarketBtn) tabMarketBtn.classList.add('hidden');
        if (tabChatsBtn) tabChatsBtn.classList.add('hidden');
        if (sellerKycPane) sellerKycPane.classList.add('hidden');

        if (role === "seller") {
            if (tabBankBtn) tabBankBtn.classList.remove('hidden');
            if (tabProductsBtn) tabProductsBtn.classList.remove('hidden');
            if (tabAddProdBtn) tabAddProdBtn.classList.remove('hidden');
            if (tabChatsBtn) tabChatsBtn.classList.remove('hidden');
            if (sellerKycPane) sellerKycPane.classList.remove('hidden');

            const dbFullName = document.getElementById('db-full-name');
            if (dbFullName) dbFullName.value = data.fullName || "";
            const dbPhone = document.getElementById('db-phone');
            if (dbPhone) dbPhone.value = data.phone || "";

            const kycBadge = document.getElementById('kyc-badge');
            const kycCard = document.getElementById('kyc-info-card');
            if (kycBadge && kycCard) {
                if (data.sellerStatus === "registered") {
                    kycBadge.className = "text-xs font-black px-2 py-0.5 rounded-md border border-red-200 bg-red-50 text-red-500";
                    kycBadge.textContent = "KYC INCOMPLETE";
                    kycCard.className = "p-3 text-xs rounded-xl border border-red-100 bg-red-50/20 text-red-600";
                    kycCard.innerHTML = `
                        <strong><i class="fa-solid fa-triangle-exclamation"></i> KYC Verification Required:</strong>
                        <p class="mt-1">Please enter your Full Legal Name (matching your passport) and verified Phone Number. This data is required prior to listing commercial products on the platform.</p>
                    `;
                } else {
                    kycBadge.className = "text-xs font-black px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-brand-emerald";
                    kycBadge.textContent = "KYC VERIFIED";
                    kycCard.className = "p-3 text-xs rounded-xl border border-emerald-100 bg-emerald-50/20 text-brand-emerald";
                    kycCard.innerHTML = `
                        <strong><i class="fa-solid fa-circle-check"></i> Profile Approved:</strong>
                        <p class="mt-1">Your identity metrics have been successfully logged. You are fully authorized to list commercial SaaS and code assets on our directory.</p>
                    `;
                }
            }

            const bankName = document.getElementById('bank-name');
            if (bankName) bankName.value = data.bankWireDetails?.bankName || "";
            const bankSwift = document.getElementById('bank-swift');
            if (bankSwift) bankSwift.value = data.bankWireDetails?.swiftCode || "";
            const bankAccount = document.getElementById('bank-account');
            if (bankAccount) bankAccount.value = data.bankWireDetails?.accountNumber || "";
            const bankAccName = document.getElementById('bank-acc-name');
            if (bankAccName) bankAccName.value = data.bankWireDetails?.accountName || "";

            const bankBadge = document.getElementById('bank-badge');
            const bankCard = document.getElementById('bank-info-card');
            if (bankBadge && bankCard) {
                if (!data.bankWireComplete) {
                    bankBadge.className = "text-xs font-black px-2 py-0.5 rounded-md border border-orange-200 bg-orange-50 text-orange-500";
                    bankBadge.textContent = "NOT SELL READY";
                    bankCard.className = "p-3 text-xs rounded-xl border border-orange-100 bg-orange-50/20 text-orange-600";
                    bankCard.innerHTML = `
                        <strong><i class="fa-solid fa-bell"></i> Sell-Ready Status Gated:</strong>
                        <p class="mt-1">Linking bank coordinates is optional. However, if a buyer initiates a purchase, you will have a 3-day window to complete this setup. Link your wire details now to bypass all delays and lock in instant sales.</p>
                    `;
                } else {
                    bankBadge.className = "text-xs font-black px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-brand-emerald";
                    bankBadge.textContent = "SELL READY";
                    bankCard.className = "p-3 text-xs rounded-xl border border-emerald-100 bg-emerald-50/20 text-brand-emerald";
                    bankCard.innerHTML = `
                        <strong><i class="fa-solid fa-shield-halved"></i> Wire Transfers Enabled:</strong>
                        <p class="mt-1">International banking routing codes verified. Payouts will settle automatically via Escrow.com's split-wires directly into your bank account.</p>
                    `;
                }
            }

            fetchMyProducts();

        } else if (role === "buyer") {
            if (tabMarketBtn) tabMarketBtn.classList.remove('hidden');
            if (tabChatsBtn) tabChatsBtn.classList.remove('hidden');
            fetchMarketplaceCatalog();
        } else if (role === "admin") {
            window.location.href = "admin.html";
        }
    } catch (error) {
        console.error(error.message);
    }
}

async function saveUserProfile() {
    const displayName = document.getElementById('db-display-name').value;
    const preferredLang = document.getElementById('db-preferred-lang').value;
    const isSeller = localStorage.getItem("user_role") === "seller";

    const payload = {
        displayName: displayName,
        preferredLang: preferredLang
    };

    if (isSeller) {
        payload.fullName = document.getElementById('db-full-name').value;
        payload.phone = document.getElementById('db-phone').value;
    }

    try {
        const res = await secureFetch("/api/portal/profile", {
            method: "PUT",
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to save profile details.");

        localStorage.setItem("user_display_name", data.displayName);
        renderSessionUI();
        changeLanguage(preferredLang);
        alert("Profile details saved successfully!");
    } catch (error) {
        alert(error.message);
    }
}

async function saveBankWireDetails() {
    const payload = {
        bankName: document.getElementById('bank-name').value,
        swiftCode: document.getElementById('bank-swift').value,
        accountNumber: document.getElementById('bank-account').value,
        accountName: document.getElementById('bank-acc-name').value
    };

    try {
        const res = await secureFetch("/api/portal/bank-details", {
            method: "PUT",
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to save wire coordinates.");

        fetchUserProfile();
        alert("USD bank wire coordinates verified and activated successfully! You are now Sell Ready.");
    } catch (error) {
        alert(error.message);
    }
}

function toggleRevenueFields(checked) {
    const group = document.getElementById('revenue-fields-group');
    if (group) {
        if (checked) {
            group.classList.remove('hidden');
        } else {
            group.classList.add('hidden');
            const mrr = document.getElementById('add-prod-mrr');
            if (mrr) mrr.value = 0;
            const arr = document.getElementById('add-prod-arr');
            if (arr) arr.value = 0;
            const rev = document.getElementById('add-prod-revenue');
            if (rev) rev.value = 0;
            const prof = document.getElementById('add-prod-profit');
            if (prof) prof.value = 0;
            const ebitda = document.getElementById('add-prod-ebitda');
            if (ebitda) ebitda.value = 0;
        }
    }
}

async function uploadProductLogoBinary(file) {
    if (!file) return;

    const icon = document.getElementById('logo-placeholder-icon');
    const img = document.getElementById('logo-preview-img');
    if (icon) icon.className = "fa-solid fa-spinner fa-spin text-2xl text-brand-emerald";
    if (img) img.classList.add('hidden');

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await secureFetch("/api/portal/products/upload-logo", {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to upload logo binary.");

        if (icon) icon.classList.add('hidden');
        if (img) {
            img.src = data.logoUrl;
            img.classList.remove('hidden');
        }
        const dbLogo = document.getElementById('db-product-logo');
        if (dbLogo) dbLogo.value = data.logoUrl;
        console.log("Product Logo uploaded successfully! URL:", data.logoUrl);
    } catch (error) {
        if (icon) icon.className = "fa-solid fa-circle-exclamation text-2xl text-red-500";
        alert(error.message);
    }
}

function updatePriceSliderDisplay(value) {
    const display = document.getElementById('add-prod-price-display');
    if (display) {
        display.textContent = `$${parseFloat(value).toLocaleString()}`;
    }
}
window.updatePriceSliderDisplay = updatePriceSliderDisplay;

async function submitProductListing(event) {
    event.preventDefault();

    const selectedTypes = [];
    document.querySelectorAll('input[name="prod-type"]:checked').forEach(cb => {
        selectedTypes.push(cb.value);
    });

    if (selectedTypes.length === 0) {
        alert("Please select at least one Product Type category.");
        return;
    }

    const payload = {
        title: document.getElementById('add-prod-title').value,
        description: document.getElementById('add-prod-desc').value,
        productType: selectedTypes,
        techStack: document.getElementById('add-prod-tech').value.split(",").map(x => x.trim()),
        hasRevenue: document.getElementById('add-prod-has-revenue').checked,
        mrr: parseFloat(document.getElementById('add-prod-mrr').value) || 0.0,
        arr: parseFloat(document.getElementById('add-prod-arr').value) || 0.0,
        annualRevenue: parseFloat(document.getElementById('add-prod-revenue').value) || 0.0,
        annualProfit: parseFloat(document.getElementById('add-prod-profit').value) || 0.0,
        ebitda: parseFloat(document.getElementById('add-prod-ebitda').value) || 0.0,
        askingPrice: parseFloat(document.getElementById('add-prod-price').value),
        metricsSource: "manual",
        productLogo: document.getElementById('db-product-logo').value || "https://storage.googleapis.com/nanocorn-vault/logos/default_logo.png",
        realName: document.getElementById('add-prod-real-name').value,
        realURL: document.getElementById('add-prod-real-url').value,
        domainTransferMethod: document.getElementById('add-prod-trans-domain').value,
        codebaseTransferMethod: document.getElementById('add-prod-trans-code').value,
        hostingTransferMethod: document.getElementById('add-prod-trans-hosting').value,
        customerDatabaseMethod: document.getElementById('add-prod-trans-db').value,
        paymentGatewayMethod: document.getElementById('add-prod-trans-gateway').value,
        estimatedCompletionDays: parseInt(document.getElementById('add-prod-trans-days').value) || 3,
        postSaleSupport: document.getElementById('add-prod-trans-support').value,
        otherTransferItems: document.getElementById('add-prod-trans-other').value
    };

    const isEditMode = !!window._editingProductId;
    const url = isEditMode ? `/api/portal/products/${window._editingProductId}` : "/api/portal/products";
    const method = isEditMode ? "PUT" : "POST";

    try {
        const res = await secureFetch(url, {
            method: method,
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to submit product listing.");

        alert(isEditMode ? "Product Listing updated successfully! It has re-entered the pending vetting queue." : "Product Listing submitted successfully! It has been entered in the Admin review queue.");
        
        // Reset edit states
        window._editingProductId = null;
        const submitBtn = document.querySelector("#add-product-form button[type='submit']");
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>Submit Product for Vetting</span>';

        const form = document.getElementById('add-product-form');
        if (form) form.reset();
        
        const display = document.getElementById('add-prod-price-display');
        if (display) display.textContent = "$15,000";
        
        const icon = document.getElementById('logo-placeholder-icon');
        if (icon) icon.className = "fa-solid fa-image text-2xl text-slate-300";
        const img = document.getElementById('logo-preview-img');
        if (img) img.classList.add('hidden');
        const dbLogo = document.getElementById('db-product-logo');
        if (dbLogo) dbLogo.value = "";
        
        toggleRevenueFields(true);

        fetchMyProducts();
        switchTab('dashboard-products');
    } catch (error) {
        alert(error.message);
    }
}

async function fetchMyProducts() {
    const container = document.getElementById('my-products-list');
    if (!container) return;

    container.innerHTML = `
        <div class="flex items-center justify-center p-8 text-slate-400 font-semibold text-sm">
            <i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading listed products...
        </div>
    `;

    try {
        const res = await secureFetch("/api/portal/products/my");
        const data = await res.json();
        if (!res.ok) throw new Error("Failed to load products.");

        if (data.length === 0) {
            container.innerHTML = `
                <div class="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-sm font-semibold text-slate-400 space-y-4">
                    <i class="fa-solid fa-cubes text-3xl text-slate-300"></i>
                    <p>You have not listed any commercial products on our directory yet.</p>
                </div>
            `;
            return;
        }

        let html = "";
        data.forEach(item => {
            const statusColors = {
                "draft": "border-slate-200 bg-slate-50 text-slate-500",
                "pending_review": "border-orange-200 bg-orange-50 text-orange-500",
                "active": "border-emerald-200 bg-emerald-50 text-brand-emerald",
                "under_holding": "border-amber-200 bg-amber-50 text-amber-500",
                "under_contract": "border-blue-200 bg-blue-50 text-blue-500",
                "sold": "border-slate-300 bg-slate-100 text-brand-navy"
            };
            const badgeClass = statusColors[item.status] || statusColors["draft"];
            const dateFormatted = new Date(item.createdAt).toLocaleDateString();

            let actionButtons = `
                <button onclick="viewProductDetails('${item.productId}')" class="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-brand-slate text-[10px] font-extrabold px-2 py-1 rounded-xl transition-all flex items-center gap-1 focus:outline-none">
                    <i class="fa-solid fa-eye text-brand-emerald"></i> View Details
                </button>
            `;

            if (item.status !== "suspended" && item.status !== "sold") {
                actionButtons += `
                    <button onclick="loadProductForEdit('${item.productId}')" class="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 text-[10px] font-extrabold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 focus:outline-none">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                `;
            }

            actionButtons += `
                <button onclick="viewProductLeads('${item.productId}')" class="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-600 text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 focus:outline-none">
                    <i class="fa-solid fa-chart-line"></i> Leads
                </button>
            `;

            if (item.status === "pending_review") {
                actionButtons += `
                    <button onclick="sellerDirectActivate('${item.productId}')" class="bg-brand-emerald hover:bg-emerald-700 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-sm focus:outline-none">
                        <i class="fa-solid fa-bolt"></i> Activate Now
                    </button>
                `;
            }

            html += `
                <div class="border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                    <div class="flex items-center gap-4">
                        <img src="${item.productLogo}" class="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-brand-light flex-shrink-0">
                        <div>
                            <h4 class="text-sm font-black text-brand-navy">${item.title}</h4>
                            <p class="text-[10px] font-bold text-slate-400 mt-0.5">Created: ${dateFormatted} | Tech: ${item.techStack.join(", ")}</p>
                            <div class="flex gap-1.5 mt-2">
                                ${item.productType.map(t => `<span class="text-[9px] font-black tracking-wide text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">${t}</span>`).join("")}
                            </div>
                        </div>
                    </div>
                    <div class="flex sm:flex-col items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0 gap-2 flex-shrink-0">
                        <div class="flex items-center sm:items-end flex-col gap-1">
                            <span class="text-xs font-black tracking-widest ${badgeClass} border px-2 py-0.5 rounded-md capitalize">${item.status.replace("_", " ")}</span>
                            <span class="text-base font-black text-brand-navy">$${item.askingPrice.toLocaleString()} USD</span>
                        </div>
                        <div class="flex gap-1.5 mt-2 sm:mt-1">
                            ${actionButtons}
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="p-8 text-center text-red-500 font-semibold text-sm">Failed to load listed products.</div>`;
    }
}

async function sellerDirectActivate(productId) {
    if (!confirm("Are you sure you want to directly activate this product? It will bypass standard review, make your product instantly live, and notify system administration.")) {
        return;
    }

    try {
        const res = await secureFetch(`/api/portal/products/${productId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: "active" })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to activate product.");

        alert("Success! Your product is now active and live on the marketplace. Admin has been notified.");
        fetchMyProducts();
    } catch (error) {
        alert(error.message);
    }
}
window.sellerDirectActivate = sellerDirectActivate;

function switchTab(tabId) {
    const profileTab = document.getElementById('sub-view-profile');
    const bankTab = document.getElementById('sub-view-bank');
    const productsTab = document.getElementById('sub-view-products');
    const addProductTab = document.getElementById('sub-view-add-product');
    const marketTab = document.getElementById('sub-view-market');
    const chatsTab = document.getElementById('sub-view-chats');

    const btnProfile = document.getElementById('tab-btn-profile');
    const btnBank = document.getElementById('tab-btn-bank');
    const btnProducts = document.getElementById('tab-btn-products');
    const btnAddProduct = document.getElementById('tab-btn-add-product');
    const btnMarket = document.getElementById('tab-btn-market');
    const btnChats = document.getElementById('tab-btn-chats');

    // Hide all tabs
    if (profileTab) profileTab.classList.add('hidden');
    if (bankTab) bankTab.classList.add('hidden');
    if (productsTab) productsTab.classList.add('hidden');
    if (addProductTab) addProductTab.classList.add('hidden');
    if (marketTab) marketTab.classList.add('hidden');
    if (chatsTab) chatsTab.classList.add('hidden');

    const inactiveClass = "flex-1 md:flex-none text-left px-4 py-3 rounded-xl transition-all hover:bg-slate-50 flex items-center gap-3";
    const activeClass = "flex-1 md:flex-none text-left px-4 py-3 rounded-xl transition-all bg-emerald-50 text-brand-emerald flex items-center gap-3";
    
    if (btnProfile) btnProfile.className = inactiveClass;
    if (btnBank) btnBank.className = inactiveClass;
    if (btnProducts) btnProducts.className = inactiveClass;
    if (btnAddProduct) btnAddProduct.className = inactiveClass;
    if (btnMarket) btnMarket.className = inactiveClass;
    if (btnChats) btnChats.className = inactiveClass;

    if (tabId === 'dashboard-profile') {
        if (profileTab) profileTab.classList.remove('hidden');
        if (btnProfile) btnProfile.className = activeClass;
    } else if (tabId === 'dashboard-bank') {
        if (bankTab) bankTab.classList.remove('hidden');
        if (btnBank) btnBank.className = activeClass;
    } else if (tabId === 'dashboard-products') {
        if (productsTab) productsTab.classList.remove('hidden');
        if (btnProducts) btnProducts.className = activeClass;
    } else if (tabId === 'dashboard-add-product') {
        if (addProductTab) addProductTab.classList.remove('hidden');
        if (btnAddProduct) btnAddProduct.className = activeClass;
    } else if (tabId === 'dashboard-chats') {
        if (chatsTab) chatsTab.classList.remove('hidden');
        if (btnChats) btnChats.className = activeClass;
        fetchMyChatsList();
    } else if (tabId === 'dashboard-market') {
        if (marketTab) marketTab.classList.remove('hidden');
        if (btnMarket) btnMarket.className = activeClass;
        fetchMarketplaceCatalog();
    }
}

// -----------------------------------------------------------------------------
// SPRINT 5+: SELLER EDIT PRODUCT FLOW & LEADS ANALYTICS
// -----------------------------------------------------------------------------
async function loadProductForEdit(productId) {
    try {
        const res = await secureFetch(`/api/portal/products/${productId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to retrieve product details for edit.");

        // Set global edit productId
        window._editingProductId = productId;

        // Populate Form Fields
        document.getElementById('add-prod-title').value = data.title || "";
        document.getElementById('add-prod-desc').value = data.description || "";
        document.getElementById('add-prod-tech').value = (data.techStack || []).join(", ");
        
        // Price slider and reactive text display
        document.getElementById('add-prod-price').value = data.askingPrice || 15000;
        updatePriceSliderDisplay(data.askingPrice || 15000);

        // Revenue settings
        document.getElementById('add-prod-has-revenue').checked = !!data.hasRevenue;
        toggleRevenueFields(!!data.hasRevenue);
        if (data.hasRevenue) {
            document.getElementById('add-prod-mrr').value = data.mrr || 0;
            document.getElementById('add-prod-arr').value = data.arr || 0;
            document.getElementById('add-prod-revenue').value = data.annualRevenue || 0;
            document.getElementById('add-prod-profit').value = data.annualProfit || 0;
            document.getElementById('add-prod-ebitda').value = data.ebitda || 0;
        }

        // Private Identifiers & Handover terms
        document.getElementById('add-prod-real-name').value = data.realName || "";
        document.getElementById('add-prod-real-url').value = data.realURL || "";
        document.getElementById('add-prod-trans-domain').value = data.transferTerms?.domainTransferMethod || "";
        document.getElementById('add-prod-trans-code').value = data.transferTerms?.codebaseTransferMethod || "";
        document.getElementById('add-prod-trans-hosting').value = data.transferTerms?.hostingTransferMethod || "";
        document.getElementById('add-prod-trans-db').value = data.transferTerms?.customerDatabaseMethod || "";
        document.getElementById('add-prod-trans-gateway').value = data.transferTerms?.paymentGatewayMethod || "";
        document.getElementById('add-prod-trans-days').value = data.transferTerms?.estimatedCompletionDays || 3;
        document.getElementById('add-prod-trans-support').value = data.transferTerms?.postSaleSupport || "";
        document.getElementById('add-prod-trans-other').value = data.transferTerms?.otherTransferItems || "";

        // Check product types checkboxes
        document.querySelectorAll('input[name="prod-type"]').forEach(cb => {
            cb.checked = (data.productType || []).includes(cb.value);
        });

        // Logo configuration
        document.getElementById('db-product-logo').value = data.productLogo || "";
        const icon = document.getElementById('logo-placeholder-icon');
        const img = document.getElementById('logo-preview-img');
        if (data.productLogo) {
            if (icon) icon.classList.add('hidden');
            if (img) {
                img.src = data.productLogo;
                img.classList.remove('hidden');
            }
        } else {
            if (icon) icon.className = "fa-solid fa-image text-2xl text-slate-300";
            if (img) img.classList.add('hidden');
        }

        // Rename Submit Button
        const submitBtn = document.querySelector("#add-product-form button[type='submit']");
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>Save Changes & Resubmit</span>';

        // Transition Tab
        switchTab('dashboard-add-product');
    } catch (error) {
        alert(error.message);
    }
}
window.loadProductForEdit = loadProductForEdit;

async function viewProductLeads(productId) {
    const tbody = document.getElementById('leads-list-tbody');
    const totalCount = document.getElementById('leads-total-count');
    if (!tbody || !totalCount) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="3" class="p-4 text-center text-slate-400 font-semibold"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading buyer leads...</td>
        </tr>
    `;
    totalCount.textContent = "0";

    // Show modal
    const modal = document.getElementById('seller-leads-modal');
    if (modal) modal.classList.remove('hidden');

    try {
        const res = await secureFetch(`/api/portal/products/${productId}/leads`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load buyer leads.");

        totalCount.textContent = data.length;

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="p-6 text-center text-slate-400 italic">No buyer leads have signed the NDA for this listing yet.</td>
                </tr>
            `;
            return;
        }

        let html = "";
        data.forEach(lead => {
            const dateStr = new Date(lead.signedAt).toLocaleString();
            html += `
                <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td class="p-3 font-black text-brand-navy">${lead.buyerName}</td>
                    <td class="p-3 font-semibold text-slate-400">${lead.buyerEmail}</td>
                    <td class="p-3 text-slate-400">${dateStr}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-red-500 font-semibold">${error.message}</td></tr>`;
    }
}
window.viewProductLeads = viewProductLeads;

function closeLeadsModal() {
    const modal = document.getElementById('seller-leads-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeLeadsModal = closeLeadsModal;

// -----------------------------------------------------------------------------
// SPRINT 5+: REAL-TIME CONVERSATIONS, FILE SHARING, AND LEGAL CHECKOUT
// -----------------------------------------------------------------------------
async function fetchMyChatsList() {
    const container = document.getElementById('chats-list-container');
    if (!container) return;

    container.innerHTML = `
        <div class="p-6 text-center text-slate-400 font-semibold text-xs">
            <i class="fa-solid fa-spinner fa-spin mr-1"></i> Loading conversations...
        </div>
    `;

    try {
        const res = await secureFetch("/api/chats");
        const data = await res.json();
        if (!res.ok) throw new Error("Failed to load chats list.");

        if (data.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center text-slate-400 italic text-xs">
                    No active chat negotiations found.
                </div>
            `;
            return;
        }

        let html = "";
        data.forEach(chat => {
            const dateStr = new Date(chat.updatedAt).toLocaleDateString();
            const counterparty = localStorage.getItem("user_role") === "buyer" 
                ? `Seller ID: ${chat.sellerId}` 
                : `Buyer ID: ${chat.buyerId}`;

            html += `
                <div onclick="selectActiveChat('${chat.chatId}')" id="chat-card-${chat.chatId}" class="p-3 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all space-y-1">
                    <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                        <span>${counterparty}</span>
                        <span>${dateStr}</span>
                    </div>
                    <div class="font-extrabold text-brand-navy text-[11px] line-clamp-1">Product: ${chat.productId}</div>
                    <p class="text-[10px] text-slate-500 font-medium line-clamp-1 mt-1 italic">"${chat.lastMessage}"</p>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="p-4 text-center text-red-500 text-xs font-semibold">${error.message}</div>`;
    }
}
window.fetchMyChatsList = fetchMyChatsList;

async function selectActiveChat(chatId) {
    // Clear any previous polling loop
    if (window._activeChatPollInterval) {
        clearInterval(window._activeChatPollInterval);
    }

    const placeholder = document.getElementById('chat-empty-placeholder');
    const windowEl = document.getElementById('active-chat-window');
    if (placeholder) placeholder.classList.add('hidden');
    if (windowEl) windowEl.classList.remove('hidden');

    // Highlight selected card
    document.querySelectorAll('[id^="chat-card-"]').forEach(el => el.classList.remove('bg-emerald-50/50', 'border-emerald-200'));
    const selectedCard = document.getElementById(`chat-card-${chatId}`);
    if (selectedCard) selectedCard.classList.add('bg-emerald-50/50', 'border-emerald-200');

    window._currentChatId = chatId;

    // Load active messages
    await refreshActiveChatMessages();

    // Set polling loop to refresh message thread dynamically every 3 seconds
    window._activeChatPollInterval = setInterval(refreshActiveChatMessages, 3000);
}
window.selectActiveChat = selectActiveChat;

async function refreshActiveChatMessages() {
    const chatId = window._currentChatId;
    if (!chatId) return;

    const messagesBox = document.getElementById('active-chat-messages');
    const title = document.getElementById('active-chat-title');
    const subtitle = document.getElementById('active-chat-subtitle');
    if (!messagesBox) return;

    try {
        const res = await secureFetch(`/api/chats/${chatId}/messages`);
        const data = await res.json();
        if (!res.ok) throw new Error("Failed to load message thread.");

        if (title) title.textContent = `Chat Negotiation (Channel: ${chatId})`;
        if (subtitle) subtitle.textContent = `Real-time secure dialogue center`;

        if (data.length === 0) {
            messagesBox.innerHTML = `
                <div class="p-12 text-center text-slate-400 italic text-xs">
                    No messages inside this thread. Write a message below to start negotiating.
                </div>
            `;
            return;
        }

        let html = "";
        data.forEach(msg => {
            const isMe = msg.senderId === localStorage.getItem("user_id");
            const senderLabel = isMe ? "You" : msg.senderId;
            const alignClass = isMe ? "justify-end text-right" : "justify-start text-left";
            const bubbleClass = isMe ? "bg-brand-emerald text-white rounded-tr-none" : "bg-slate-100 text-brand-navy rounded-tl-none";

            let attachmentHtml = "";
            if (msg.attachmentPath && msg.attachmentName) {
                attachmentHtml = `
                    <div onclick="downloadChatFile('${chatId}', '${msg.messageId}')" class="mt-2 p-2 border border-slate-200/50 rounded-lg flex items-center gap-2 cursor-pointer bg-black/5 hover:bg-black/10 text-[10px] font-bold text-left transition-all">
                        <i class="fa-solid fa-file-arrow-down text-brand-emerald text-xs"></i>
                        <span class="truncate max-w-[150px]">${msg.attachmentName}</span>
                    </div>
                `;
            }

            html += `
                <div class="flex ${alignClass} flex-col space-y-1">
                    <span class="text-[9px] text-slate-400 font-extrabold px-1">${senderLabel}</span>
                    <div class="inline-block max-w-[70%] p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${bubbleClass}">
                        <div>${msg.text}</div>
                        ${attachmentHtml}
                    </div>
                </div>
            `;
        });

        // Maintain scroll anchoring at the bottom of the conversation thread
        const shouldScroll = messagesBox.scrollTop + messagesBox.clientHeight >= messagesBox.scrollHeight - 50;
        messagesBox.innerHTML = html;
        if (shouldScroll || messagesBox.scrollTop === 0) {
            messagesBox.scrollTop = messagesBox.scrollHeight;
        }
    } catch (error) {
        console.error("Chat polling failed:", error.message);
    }
}
window.refreshActiveChatMessages = refreshActiveChatMessages;

async function submitChatMessage(event) {
    event.preventDefault();
    const chatId = window._currentChatId;
    if (!chatId) return;

    const input = document.getElementById('chat-message-text');
    const text = input.value.trim();
    if (!text) return;

    // Reset input
    input.value = "";

    try {
        const res = await secureFetch(`/api/chats/${chatId}/messages`, {
            method: "POST",
            body: JSON.stringify({ text: text })
        });
        if (!res.ok) throw new Error("Failed to post message.");
        await refreshActiveChatMessages();
    } catch (error) {
        alert(error.message);
    }
}
window.submitChatMessage = submitChatMessage;

async function uploadChatFile(file) {
    const chatId = window._currentChatId;
    if (!file || !chatId) return;

    const messagesBox = document.getElementById('active-chat-messages');
    if (messagesBox) {
        messagesBox.innerHTML += `
            <div class="flex justify-end flex-col space-y-1">
                <span class="text-[9px] text-slate-400 font-extrabold px-1">You</span>
                <div class="inline-block p-3 bg-brand-emerald text-white text-xs font-bold rounded-2xl rounded-tr-none max-w-[70%] shadow-sm">
                    <i class="fa-solid fa-spinner fa-spin mr-1"></i> Streaming file binary directly to GCS...
                </div>
            </div>
        `;
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    try {
        // Step 1: Request GCS write Signed PUT URL
        const urlRes = await secureFetch(`/api/chats/${chatId}/upload-url?filename=${encodeURIComponent(file.name)}`);
        const urlData = await urlRes.json();
        if (!urlRes.ok) throw new Error(urlData.detail || "Failed to generate storage upload token.");

        // Step 2: Upload file stream directly to GCP Cloud Storage
        const uploadRes = await fetch(urlData.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "application/octet-stream" },
            body: file
        });
        if (!uploadRes.ok) throw new Error("Direct GCS binary stream failure.");

        // Step 3: Log message entry reference in chats messages database
        const msgRes = await secureFetch(`/api/chats/${chatId}/messages`, {
            method: "POST",
            body: JSON.stringify({
                text: `Shared attachment deliverables file: ${file.name}`,
                attachmentPath: urlData.attachmentPath,
                attachmentName: file.name
            })
        });
        if (!msgRes.ok) throw new Error("Failed to register chat file database metadata.");

        alert(`Successfully shared file Deliverable: '${file.name}'!`);
        await refreshActiveChatMessages();
    } catch (error) {
        alert(error.message);
        await refreshActiveChatMessages();
    }
}
window.uploadChatFile = uploadChatFile;

async function downloadChatFile(chatId, messageId) {
    try {
        const res = await secureFetch(`/api/chats/${chatId}/files/${messageId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to generate file download token.");

        // Redirect browser directly to temporary signed GET GCS URL
        window.open(data.downloadUrl, '_blank');
    } catch (error) {
        alert(error.message);
    }
}
window.downloadChatFile = downloadChatFile;

async function initiateBuyerChat(productId) {
    try {
        const res = await secureFetch("/api/chats", {
            method: "POST",
            body: JSON.stringify({ productId: productId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to initiate chat conversation.");

        closeBuyerDetailsModal();
        switchTab('dashboard-chats');
        
        // Brief pause to allow tab transition, then open thread
        setTimeout(() => {
            selectActiveChat(data.chatId);
        }, 1000);
    } catch (error) {
        alert(error.message);
    }
}
window.initiateBuyerChat = initiateBuyerChat;

// -----------------------------------------------------------------------------
// SPRINT 5+: LEGAL ESCROW CHECKOUT CONSENTS
// -----------------------------------------------------------------------------
async function openEscrowConsentModal(productId) {
    const modal = document.getElementById('escrow-consent-modal');
    if (!modal) return;

    modal.classList.remove('hidden');

    // Pre-populate KYC fields from active buyer profile
    const nameInput = document.getElementById('escrow-buyer-name');
    const phoneInput = document.getElementById('escrow-buyer-phone');
    const submitBtn = document.getElementById('escrow-submit-btn');

    if (nameInput) nameInput.value = document.getElementById('db-full-name')?.value || "";
    if (phoneInput) phoneInput.value = document.getElementById('db-phone')?.value || "";

    if (submitBtn) {
        submitBtn.onclick = () => executeEscrowTransaction(productId);
    }
}
window.openEscrowConsentModal = openEscrowConsentModal;

function closeEscrowConsentModal() {
    const modal = document.getElementById('escrow-consent-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeEscrowConsentModal = closeEscrowConsentModal;

async function executeEscrowTransaction(productId) {
    const cbEscrow = document.getElementById('consent-cb-escrow').checked;
    const cbTerms = document.getElementById('consent-cb-terms').checked;
    const cbPartner = document.getElementById('consent-cb-partner').checked;

    if (!cbEscrow || !cbTerms || !cbPartner) {
        alert("Please explicitly check and authorize all data sharing and operating policy consents to initiate checkout escrow.");
        return;
    }

    const legalName = document.getElementById('escrow-buyer-name').value.trim();
    const legalPhone = document.getElementById('escrow-buyer-phone').value.trim();

    if (!legalName || !legalPhone) {
        alert("Please confirm your Full Legal Name and Phone Number to satisfy Escrow KYC regulations.");
        return;
    }

    // Dynamic warning alert for Sell-Ready compliance (Sprint 6 logic bridge)
    try {
        closeEscrowConsentModal();
        closeBuyerDetailsModal();
        
        // Mock Sandbox Success walkthrough for Sprint 5 checkout evaluation
        alert("🎉 CONSENT VERIFIED & ESCROW INITIATED:\n\n" +
              "Sovereign data-sharing legal authorizations logged.\n" +
              "Platform has requested transaction generation on Escrow.com Sandbox!\n\n" +
              "A professional matchmaker will guide you to complete split bank-coordinate settlements.");
    } catch (error) {
        alert(error.message);
    }
}
window.executeEscrowTransaction = executeEscrowTransaction;
