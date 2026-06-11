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

    container.innerHTML = `
        <div class="flex items-center space-x-3 bg-brand-light px-3 py-1.5 rounded-lg border border-slate-200">
            <span class="text-xs font-black text-brand-emerald tracking-wide bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">${role}</span>
            <span class="text-sm font-bold text-brand-navy">${displayName}</span>
            <button onclick="logoutSession()" class="text-brand-slate hover:text-red-500 transition-colors text-sm font-semibold pl-2 border-l border-slate-200"><i class="fa-solid fa-right-from-bracket"></i></button>
        </div>
    `;

    const hero = document.getElementById('hero-public-section');
    if (hero) hero.classList.add('hidden');
    const dbSec = document.getElementById('dashboard-section');
    if (dbSec) dbSec.classList.remove('hidden');

    fetchUserProfile();
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
    
    applyTranslations();
    alert("Session logged out successfully.");
}
