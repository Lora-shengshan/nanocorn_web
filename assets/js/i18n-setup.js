// i18next multi-language engine bootstrap configuration
async function initL10n() {
    await i18next
        .use(i18nextHttpBackend)
        .init({
            lng: localStorage.getItem('user_lang') || 'en',
            fallbackLng: 'en',
            backend: {
                loadPath: './locales/{{lng}}.json'
            }
        });
    
    const selector = document.getElementById('lang-selector');
    if (selector) selector.value = i18next.language;
    document.documentElement.lang = i18next.language;
    applyTranslations();
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = i18next.t(key);
    });
    const emailInput = document.getElementById('auth-email');
    if (emailInput) emailInput.placeholder = i18next.t("Enter your email");
    const passInput = document.getElementById('auth-password');
    if (passInput) passInput.placeholder = "••••••••";
}

function changeLanguage(localeCode) {
    i18next.changeLanguage(localeCode, () => {
        localStorage.setItem('user_lang', localeCode);
        document.documentElement.lang = localeCode;
        applyTranslations();
    });
}

// Global bootstrap initializer
window.addEventListener('DOMContentLoaded', () => {
    initL10n();
    setupGoogleGSI();
    checkExistingSession();
    resolveSharedProductDeepLink();
});

function resolveSharedProductDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('product') || urlParams.get('productId');
    
    if (!productId && window.location.hash.startsWith('#product/')) {
        productId = window.location.hash.split('#product/')[1];
    }
    
    if (productId) {
        console.log("Detected shared product deep-link matching ID:", productId);
        const token = localStorage.getItem("user_token");
        if (!token) {
            alert("Please Sign In / Sign Up to view this protected startup listing.");
            openAuthModal();
        } else {
            switchTab('dashboard-market');
            
            // Allow marketplace fetch to complete then trigger NDA modal
            setTimeout(() => {
                openNdaModal(productId);
            }, 1500);
        }
    }
}
window.resolveSharedProductDeepLink = resolveSharedProductDeepLink;
