// Non-Disclosure Agreement and Decrypted asset views
function openNdaModal(productId) {
    const targetInput = document.getElementById('nda-target-product-id');
    if (targetInput) targetInput.value = productId;
    const nameInput = document.getElementById('nda-signature-name');
    if (nameInput) nameInput.value = "";
    const modal = document.getElementById('nda-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeNdaModal() {
    const modal = document.getElementById('nda-modal');
    if (modal) modal.classList.add('hidden');
}

async function submitDigitalNda() {
    const productId = document.getElementById('nda-target-product-id').value;
    const fullName = (document.getElementById('nda-signature-name').value || '').trim();

    if (!fullName) {
        alert("Please type your full legal name to sign the NDA.");
        return;
    }

    try {
        const res = await secureFetch("/api/portal/ndas", {
            method: "POST",
            body: JSON.stringify({ productId: productId, fullName: fullName })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to sign NDA.");

        closeNdaModal();
        await viewProductDetails(productId);
    } catch (error) {
        alert(error.message);
    }
}

async function viewProductDetails(productId) {
    try {
        const res = await secureFetch(`/api/portal/products/${productId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to retrieve product details.");

        if (data.realName && data.realURL) {
            const logo = document.getElementById('buyer-det-logo');
            if (logo) logo.src = data.productLogo || 'https://storage.googleapis.com/nanocorn-vault/logos/prd_app_default.png';

            const title = document.getElementById('buyer-det-title');
            if (title) title.textContent = data.title || "Startup Asset";

            const realName = document.getElementById('buyer-det-real-name');
            if (realName) realName.textContent = data.realName || "Confidential";

            const realUrl = document.getElementById('buyer-det-real-url');
            if (realUrl) {
                realUrl.href = data.realURL || "#";
                realUrl.innerHTML = `<i class="fa-solid fa-earth-americas"></i> ${data.realURL || 'Link'}`;
            }

            const askingPrice = document.getElementById('buyer-det-asking-price');
            if (askingPrice) askingPrice.textContent = `$${(data.askingPrice || 0).toLocaleString()} USD`;

            const pType = document.getElementById('buyer-det-type');
            if (pType) pType.textContent = (data.productType || []).join(", ");

            const pTech = document.getElementById('buyer-det-tech');
            if (pTech) pTech.textContent = (data.techStack || []).join(", ");

            const revenue = document.getElementById('buyer-det-revenue');
            if (revenue) {
                if (data.hasRevenue) {
                    revenue.textContent = `MRR: $${(data.mrr || 0).toLocaleString()} / ARR: $${(data.arr || 0).toLocaleString()}`;
                } else {
                    revenue.textContent = "Pre-revenue asset";
                }
            }

            const desc = document.getElementById('buyer-det-desc');
            if (desc) desc.textContent = data.description || "No description provided.";

            const domain = document.getElementById('buyer-det-trans-domain');
            if (domain) domain.textContent = data.transferTerms?.domainTransferMethod || "N/A";
            const codebase = document.getElementById('buyer-det-trans-code');
            if (codebase) codebase.textContent = data.transferTerms?.codebaseTransferMethod || "N/A";
            const hosting = document.getElementById('buyer-det-trans-hosting');
            if (hosting) hosting.textContent = data.transferTerms?.hostingTransferMethod || "N/A";
            const dbMig = document.getElementById('buyer-det-trans-db');
            if (dbMig) dbMig.textContent = data.transferTerms?.customerDatabaseMethod || "N/A";
            const gateway = document.getElementById('buyer-det-trans-gateway');
            if (gateway) gateway.textContent = data.transferTerms?.paymentGatewayMethod || "N/A";
            const other = document.getElementById('buyer-det-trans-other');
            if (other) other.textContent = data.transferTerms?.otherTransferItems || "None";

            const days = document.getElementById('buyer-det-trans-days');
            if (days) days.textContent = `${data.transferTerms?.estimatedCompletionDays || 3} Days`;
            const support = document.getElementById('buyer-det-trans-support');
            if (support) support.textContent = data.transferTerms?.postSaleSupport || "None";

            const btnChat = document.getElementById('buyer-det-btn-chat');
            const btnBuy = document.getElementById('buyer-det-btn-buy');
            
            if (btnChat) btnChat.onclick = () => initiateBuyerChat(productId);
            if (btnBuy) btnBuy.onclick = () => openEscrowConsentModal(productId);

            const modal = document.getElementById('buyer-product-details-modal');
            if (modal) modal.classList.remove('hidden');
        } else {
            alert("This listing has been successfully locked under standard NDA protection.");
        }
    } catch (error) {
        alert(error.message);
    }
}

function closeBuyerDetailsModal() {
    const modal = document.getElementById('buyer-product-details-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeBuyerDetailsModal = closeBuyerDetailsModal;
