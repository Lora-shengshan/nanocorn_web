// Session authentication and login/signup state managers
let isLoginMode = false;
let isCodeSent = false;

function setupGoogleGSI() {
    if (typeof google === 'undefined' || !google.accounts) {
        console.log("Google GSI script not loaded yet. Waiting for onload...");
        return;
    }
    try {
        google.accounts.id.initialize({
            client_id: "961610016672-u9atthbs32er3hie9c859j23rpcqk1dt.apps.googleusercontent.com",
            callback: handleGoogleCredentialResponse
        });
        google.accounts.id.renderButton(
            document.getElementById("google-gsi-signin-btn"),
            { theme: "outline", size: "large", width: "320" }
        );
    } catch (err) {
        console.error("Failed to render Google GSI Button:", err);
    }
}
window._setupGoogleGSIReal = setupGoogleGSI;
window.setupGoogleGSI = setupGoogleGSI;

if (window._googleGSIPending) {
    setupGoogleGSI();
    window._googleGSIPending = false;
}

async function handleGoogleCredentialResponse(response) {
    const idToken = response.credential;
    const selectedRole = document.querySelector('input[name="role"]:checked')?.value || 'buyer';

    try {
        const res = await secureFetch("/api/portal/callback", {
            method: "POST",
            body: JSON.stringify({ idToken: idToken, role: selectedRole })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Google Login failed.");

        saveSession(data);
        closeAuthModal();
        alert(`Welcome back, ${data.displayName}!`);
    } catch (error) {
        alert(error.message);
    }
}

function setAuthMode(mode) {
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleLink = document.getElementById('auth-toggle-link');
    const roleGroup = document.getElementById('role-selection-group');
    const otpSection = document.getElementById('otp-verification-section');
    const tabLogin = document.getElementById('modal-tab-login');
    const tabSignup = document.getElementById('modal-tab-signup');

    if (mode === 'login') {
        isLoginMode = true;
        if (submitBtn) submitBtn.textContent = "Sign In";
        if (toggleLink) toggleLink.textContent = "Need an account? Sign Up instead";
        if (roleGroup) roleGroup.classList.add('hidden');
        if (otpSection) otpSection.classList.add('hidden');
        
        if (tabLogin) tabLogin.className = "flex-1 pb-3 text-brand-emerald border-b-2 border-brand-emerald transition-all font-black";
        if (tabSignup) tabSignup.className = "flex-1 pb-3 text-slate-400 border-b-2 border-transparent transition-all font-semibold";
    } else {
        isLoginMode = false;
        if (submitBtn) submitBtn.textContent = i18next.t("Send Verification Code");
        if (toggleLink) toggleLink.textContent = "Already have an account? Sign In directly";
        if (roleGroup) roleGroup.classList.remove('hidden');
        
        if (tabLogin) tabLogin.className = "flex-1 pb-3 text-slate-400 border-b-2 border-transparent transition-all font-semibold";
        if (tabSignup) tabSignup.className = "flex-1 pb-3 text-brand-emerald border-b-2 border-brand-emerald transition-all font-black";
        
        if (isCodeSent) {
            if (otpSection) otpSection.classList.remove('hidden');
            if (submitBtn) submitBtn.textContent = i18next.t("Complete Registration");
        }
    }
}

function toggleAuthMode() {
    if (isLoginMode) {
        setAuthMode('signup');
    } else {
        setAuthMode('login');
    }
}

function openAuthModal(preselectedRole = null) {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('hidden');
    
    if (preselectedRole) {
        setAuthMode('signup');
        const radio = document.querySelector(`input[name="role"][value="${preselectedRole}"]`);
        if (radio) radio.checked = true;
    } else {
        setAuthMode('login');
    }
    
    setupGoogleGSI();
}

// Global exposure
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.toggleAuthMode = toggleAuthMode;

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
    resetAuthForm();
}

function resetAuthForm() {
    isLoginMode = false;
    isCodeSent = false;
    const form = document.getElementById('auth-wizard-form');
    if (form) form.reset();
    
    const roleGroup = document.getElementById('role-selection-group');
    if (roleGroup) roleGroup.classList.remove('hidden');
    const otpSection = document.getElementById('otp-verification-section');
    if (otpSection) otpSection.classList.add('hidden');
    const submitBtn = document.getElementById('auth-submit-btn');
    if (submitBtn) submitBtn.textContent = i18next.t("Send Verification Code");
    const toggleLink = document.getElementById('auth-toggle-link');
    if (toggleLink) toggleLink.textContent = "Already have an account? Sign In directly";
    
    setAuthMode('signup');
}

async function handleAuthSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const role = document.querySelector('input[name="role"]:checked')?.value || 'buyer';

    if (isLoginMode) {
        try {
            const res = await secureFetch("/api/portal/access", {
                method: "POST",
                body: JSON.stringify({ email: email, password: password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Login failed.");

            saveSession(data);
            closeAuthModal();
            alert(`Welcome, ${data.displayName}!`);
        } catch (error) {
            alert(error.message);
        }
        return;
    }

    if (!isCodeSent) {
        try {
            const res = await secureFetch("/api/portal/dispatch", {
                method: "POST",
                body: JSON.stringify({ email: email, role: role })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to send code.");

            isCodeSent = true;
            const otpSection = document.getElementById('otp-verification-section');
            if (otpSection) otpSection.classList.remove('hidden');
            const submitBtn = document.getElementById('auth-submit-btn');
            if (submitBtn) submitBtn.textContent = i18next.t("Complete Registration");
        } catch (error) {
            alert(error.message);
        }
    } else {
        const code = document.getElementById('auth-otp-code').value;
        const displayName = document.getElementById('auth-display-name').value;

        try {
            const res = await secureFetch("/api/portal/confirm", {
                method: "POST",
                body: JSON.stringify({
                    email: email,
                    code: code,
                    password: password,
                    displayName: displayName
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Registration failed.");

            saveSession(data);
            closeAuthModal();
            alert(i18next.t("Successfully Registered!"));
        } catch (error) {
            alert(error.message);
        }
    }
}

function saveSession(data) {
    localStorage.setItem("user_token", data.token);
    localStorage.setItem("user_id", data.userId);
    localStorage.setItem("user_role", data.role);
    localStorage.setItem("user_display_name", data.displayName);
    if (data.role === "admin") {
        localStorage.setItem("user_is_admin", "true");
    }
    renderSessionUI();
}

function checkExistingSession() {
    if (localStorage.getItem("user_token")) {
        renderSessionUI();
    }
}

function renderSessionUI() {
    const container = document.getElementById('auth-header-container');
    if (!container) return;

    const displayName = localStorage.getItem("user_display_name");
    const role = localStorage.getItem("user_role").toUpperCase();
    const isAdmin = localStorage.getItem("user_is_admin") === "true";

    let roleDisplayHtml = "";
    let btnColorClass = "text-brand-emerald bg-emerald-50 hover:bg-emerald-100 border-emerald-200";
    let outerBorderClass = "border-slate-200";

    if (role === "BUYER") {
        btnColorClass = "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200";
        outerBorderClass = "border-blue-200 shadow-sm shadow-blue-50/50";
    } else if (role === "SELLER") {
        btnColorClass = "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200";
        outerBorderClass = "border-indigo-200 shadow-sm shadow-indigo-50/50";
    } else {
        btnColorClass = "text-brand-emerald bg-emerald-50 hover:bg-emerald-100 border-emerald-200";
        outerBorderClass = "border-emerald-200 shadow-sm shadow-emerald-50/50";
    }

    if (isAdmin) {
        roleDisplayHtml = `
            <div class="relative inline-block text-left" id="admin-role-dropdown-container">
                <button onclick="toggleAdminRoleDropdown()" class="flex items-center gap-1.5 text-xs font-black tracking-wide px-3 py-1.5 rounded-md border transition-all focus:outline-none ${btnColorClass}">
                    <i class="fa-solid fa-user-shield"></i> <span id="admin-active-role-label">SYSTEM ADMIN (${role})</span> <i class="fa-solid fa-chevron-down text-[8px]"></i>
                </button>
                <div id="admin-role-dropdown-menu" class="hidden absolute right-0 mt-2 w-44 rounded-xl bg-white border border-slate-100 shadow-xl z-50 text-xs font-bold text-brand-slate overflow-hidden">
                    <a href="admin.html" class="block px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 text-brand-navy"><i class="fa-solid fa-screwdriver-wrench"></i> Admin Portal</a>
                    <button onclick="switchAdminSessionRole('buyer')" class="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 focus:outline-none flex items-center gap-1.5"><i class="fa-solid fa-cart-shopping"></i> Buyer Mode</button>
                    <button onclick="switchAdminSessionRole('seller')" class="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 focus:outline-none flex items-center gap-1.5"><i class="fa-solid fa-cubes"></i> Seller Mode</button>
                    <button onclick="switchAdminSessionRole('admin')" class="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors focus:outline-none flex items-center gap-1.5"><i class="fa-solid fa-user-shield text-brand-emerald"></i> Admin Mode</button>
                </div>
            </div>
        `;
    } else {
        roleDisplayHtml = `
            <span class="text-xs font-black tracking-wide px-2 py-0.5 rounded-md border ${btnColorClass}">${role}</span>
        `;
    }

    container.innerHTML = `
        <div class="flex items-center space-x-3 bg-brand-light px-3 py-1.5 rounded-lg border transition-all duration-300 ${outerBorderClass}">
            ${roleDisplayHtml}
            <span class="text-sm font-bold text-brand-navy">${displayName}</span>
            <button onclick="logoutSession()" class="text-brand-slate hover:text-red-500 transition-colors text-sm font-semibold pl-2 border-l border-slate-200 focus:outline-none"><i class="fa-solid fa-right-from-bracket"></i></button>
        </div>
    `;

    const hero = document.getElementById('hero-public-section');
    if (hero) hero.classList.add('hidden');
    const dbSec = document.getElementById('dashboard-section');
    if (dbSec) dbSec.classList.remove('hidden');

    if (typeof fetchUserProfile === "function") {
        fetchUserProfile();
    }
}

function logoutSession() {
    localStorage.clear();
    const container = document.getElementById('auth-header-container');
    if (container) {
        container.innerHTML = `
            <button onclick="openAuthModal()" class="bg-brand-navy hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-md shadow-slate-100" data-i18n="Sign Up / Sign In">Sign Up / Sign In</button>
        `;
    }
    
    const hero = document.getElementById('hero-public-section');
    if (hero) hero.classList.remove('hidden');
    const dbSec = document.getElementById('dashboard-section');
    if (dbSec) dbSec.classList.add('hidden');
    
    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
    alert("Session logged out successfully.");
    if (window.location.pathname.includes("admin.html")) {
        window.location.href = "index.html";
    }
}

// -----------------------------------------------------------------------------
// SPRINT 5+: SECURE ADMINISTRATIVE ROLE-SWITCHER DROPDOWN
// -----------------------------------------------------------------------------
function toggleAdminRoleDropdown() {
    const menu = document.getElementById('admin-role-dropdown-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}
window.toggleAdminRoleDropdown = toggleAdminRoleDropdown;

async function switchAdminSessionRole(newRole) {
    try {
        const res = await secureFetch("/api/portal/profile/role", {
            method: "PUT",
            body: JSON.stringify({ role: newRole })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to switch administrative role.");

        // Save new token and role
        localStorage.setItem("user_token", data.token);
        localStorage.setItem("user_role", data.role);
        
        // Close menu
        const menu = document.getElementById('admin-role-dropdown-menu');
        if (menu) menu.classList.add('hidden');

        // Re-render UI dynamically
        renderSessionUI();
        
        showToast(`Successfully switched session mode to ${newRole.toUpperCase()}!`, "success");
        if (window.location.pathname.includes("admin.html")) {
            window.location.href = "index.html";
        }
    } catch (error) {
        alert(error.message);
    }
}
window.switchAdminSessionRole = switchAdminSessionRole;

window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('admin-role-dropdown-menu');
    const container = document.getElementById('admin-role-dropdown-container');
    if (dropdown && container && !container.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});
