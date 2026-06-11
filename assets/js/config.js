// Centralized API configuration endpoint mapping
const API_BASE_URL = "https://nanocorn-backend-961610016672.us-central1.run.app";

async function secureFetch(endpoint, options = {}) {
    const token = localStorage.getItem("user_token");
    
    // Bootstrap headers
    const headers = {
        ...options.headers
    };
    
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Automatically serialize to JSON unless uploading FormData binary payloads
    if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }
    
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: headers
    });
    
    // Centralized Session Expiration Interceptor Guard
    if (res.status === 401) {
        console.warn("Session expired or unauthorized header detected. Triggering auto-logout...");
        localStorage.clear();
        alert("Session Expired. Please sign in again.");
        window.location.reload();
        throw new Error("Session Expired");
    }
    
    return res;
}

window.API_BASE_URL = API_BASE_URL;
window.secureFetch = secureFetch;

// -----------------------------------------------------------------------------
// REFACTOR: Dynamic, Non-Intrusive Toast Notification System
// -----------------------------------------------------------------------------
function showToast(message, type = "success") {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    
    // Theme-specific border & text accents
    let bgClass = "bg-white border-emerald-200 text-brand-navy shadow-lg";
    let iconClass = "fa-solid fa-circle-check text-brand-emerald text-base";
    
    if (type === "warning") {
        bgClass = "bg-white border-amber-200 text-brand-navy shadow-lg";
        iconClass = "fa-solid fa-triangle-exclamation text-amber-500 text-base";
    } else if (type === "error") {
        bgClass = "bg-white border-red-200 text-brand-navy shadow-lg";
        iconClass = "fa-solid fa-circle-xmark text-red-500 text-base";
    }

    toast.className = `flex items-start gap-3 p-4 rounded-xl border bg-white/95 backdrop-blur shadow-md pointer-events-auto transform translate-x-12 opacity-0 transition-all duration-300 ${bgClass}`;
    toast.innerHTML = `
        <div class="flex-shrink-0 pt-0.5">
            <i class="${iconClass}"></i>
        </div>
        <div class="flex-grow">
            <p class="text-xs font-extrabold leading-relaxed">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors text-xs focus:outline-none ml-1"><i class="fa-solid fa-xmark"></i></button>
    `;

    container.appendChild(toast);

    // Micro-delay to let DOM register state before slide-in
    setTimeout(() => {
        toast.classList.remove('translate-x-12', 'opacity-0');
    }, 20);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-12', 'opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}
window.showToast = showToast;
