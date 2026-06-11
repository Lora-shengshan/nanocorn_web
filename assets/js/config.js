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
