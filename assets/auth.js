/*
 * He thong quan ly Tai khoan ca nhan & Lich su lam bai (window.QuizAuth).
 * Ho tro dong bo dam may (Firebase Realtime Database / Supabase) ket hop luu tru trinh duyet (localStorage).
 */
(function () {
    'use strict';

    const STORAGE_USERS_KEY = 'hnue_users_v1';
    const STORAGE_SESSION_KEY = 'hnue_current_user_v1';
    const STORAGE_HISTORY_PREFIX = 'hnue_history_v1_';

    // Danh sach tai khoan mac dinh ban dau
    const DEFAULT_ACCOUNTS = [
        { user: 'admin', displayName: 'Quản trị viên', passHash: '14aeb4dxZ' },
        { user: 'duyanh', displayName: 'Duy Anh', passHash: 'd9833136xZ' },
        { user: 'nghung', displayName: 'Nguyễn Hùng', passHash: 'd9833136xZ' },
        { user: 'nhuhoa', displayName: 'Như Hoa', passHash: 'd9833136xZ' },
        { user: 'quynhhoa', displayName: 'Quỳnh Hoa', passHash: 'd9833136xZ' },
        { user: 'ngochung', displayName: 'Ngọc Hưng', passHash: 'd9833136xZ' },
        { user: 'hnue1', displayName: 'Sinh viên HNUE 1', passHash: 'd9833136xZ' },
        { user: 'hnue2', displayName: 'Sinh viên HNUE 2', passHash: 'd9833136xZ' },
        { user: 'hnue3', displayName: 'Sinh viên HNUE 3', passHash: 'd9833136xZ' },
        { user: 'hnue4', displayName: 'Sinh viên HNUE 4', passHash: 'd9833136xZ' }
    ];

    function hashPassword(pass) {
        let sum = 0;
        for (let i = 0; i < pass.length; i++) {
            sum += pass.charCodeAt(i) * Math.pow(13, i);
        }
        return sum.toString(16) + 'xZ';
    }

    function normalizeUser(u) {
        return String(u || '').trim().toLowerCase();
    }

    // ---------- Cloud Adapter (Firebase RTDB / Supabase) ----------
    function getCloudMode() {
        const cfg = window.CLOUD_CONFIG || {};
        if (cfg.firebaseDatabaseURL && cfg.firebaseDatabaseURL.trim()) return 'firebase';
        if (cfg.supabaseUrl && cfg.supabaseUrl.trim() && cfg.supabaseAnonKey && cfg.supabaseAnonKey.trim()) return 'supabase';
        return 'local';
    }

    async function cloudGet(key) {
        const mode = getCloudMode();
        const cfg = window.CLOUD_CONFIG || {};
        try {
            if (mode === 'firebase') {
                const base = cfg.firebaseDatabaseURL.trim().replace(/\/+$/, '');
                const res = await fetch(`${base}/${encodeURIComponent(key)}.json`);
                if (!res.ok) return null;
                return await res.json();
            }
            if (mode === 'supabase') {
                const base = cfg.supabaseUrl.trim().replace(/\/+$/, '');
                const res = await fetch(`${base}/rest/v1/kv_store?key=eq.${encodeURIComponent(key)}&select=value`, {
                    headers: {
                        apikey: cfg.supabaseAnonKey.trim(),
                        Authorization: `Bearer ${cfg.supabaseAnonKey.trim()}`
                    }
                });
                if (!res.ok) return null;
                const rows = await res.json();
                return rows && rows.length ? rows[0].value : null;
            }
        } catch (err) {
            console.warn('Cloud read fallback to local:', err);
        }
        return null;
    }

    async function cloudSet(key, value) {
        const mode = getCloudMode();
        const cfg = window.CLOUD_CONFIG || {};
        try {
            if (mode === 'firebase') {
                const base = cfg.firebaseDatabaseURL.trim().replace(/\/+$/, '');
                await fetch(`${base}/${encodeURIComponent(key)}.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(value)
                });
                return true;
            }
            if (mode === 'supabase') {
                const base = cfg.supabaseUrl.trim().replace(/\/+$/, '');
                await fetch(`${base}/rest/v1/kv_store`, {
                    method: 'POST',
                    headers: {
                        apikey: cfg.supabaseAnonKey.trim(),
                        Authorization: `Bearer ${cfg.supabaseAnonKey.trim()}`,
                        'Content-Type': 'application/json',
                        Prefer: 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify({ key, value, updated_at: new Date().toISOString() })
                });
                return true;
            }
        } catch (err) {
            console.warn('Cloud write error:', err);
        }
        return false;
    }

    // ---------- Local Users Helper ----------
    function getLocalCustomUsers() {
        try {
            const raw = localStorage.getItem(STORAGE_USERS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function saveLocalCustomUsers(map) {
        try {
            localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(map));
        } catch (e) {}
    }

    // ---------- Session Management ----------
    function getCurrentUser() {
        try {
            const raw = localStorage.getItem(STORAGE_SESSION_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.username) return parsed;
            }
            if (localStorage.getItem('isLoggedIn') === 'true') {
                const fallback = { username: 'khach', displayName: 'Học viên HNUE' };
                localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(fallback));
                return fallback;
            }
        } catch (e) {}
        return null;
    }

    function setCurrentUser(userObj) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify({
            username: userObj.username,
            displayName: userObj.displayName || userObj.username
        }));
    }

    function requireAuth() {
        const u = getCurrentUser();
        if (!u) {
            window.location.href = 'index.html';
            return null;
        }
        return u;
    }

    function logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem(STORAGE_SESSION_KEY);
        window.location.href = 'index.html';
    }

    // ---------- Login & Register ----------
    async function login(usernameInput, passwordInput) {
        const username = normalizeUser(usernameInput);
        const pass = String(passwordInput || '').trim();
        if (!username || !pass) {
            return { ok: false, message: 'Vui lòng nhập đầy đủ tên tài khoản và mật khẩu.' };
        }

        const passHash = hashPassword(pass);

        // 1. Kiem tra tai khoan mac dinh
        const builtIn = DEFAULT_ACCOUNTS.find(a => a.user === username && a.passHash === passHash);
        if (builtIn) {
            const userObj = { username: builtIn.user, displayName: builtIn.displayName };
            setCurrentUser(userObj);
            await syncHistoryFromCloud(username);
            return { ok: true, user: userObj };
        }

        // 2. Kiem tra tren Cloud neu co cau hinh
        if (getCloudMode() !== 'local') {
            const cloudUser = await cloudGet(`user_${username}`);
            if (cloudUser && cloudUser.passHash === passHash) {
                const localUsers = getLocalCustomUsers();
                localUsers[username] = cloudUser;
                saveLocalCustomUsers(localUsers);
                const userObj = { username, displayName: cloudUser.displayName || username };
                setCurrentUser(userObj);
                await syncHistoryFromCloud(username);
                return { ok: true, user: userObj };
            }
        }

        // 3. Kiem tra tai khoan luu tai localStorage
        const localUsers = getLocalCustomUsers();
        const custom = localUsers[username];
        if (custom && custom.passHash === passHash) {
            const userObj = { username, displayName: custom.displayName || username };
            setCurrentUser(userObj);
            await syncHistoryFromCloud(username);
            return { ok: true, user: userObj };
        }

        return { ok: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' };
    }

    async function register(displayNameInput, usernameInput, passwordInput, confirmPasswordInput) {
        const displayName = String(displayNameInput || '').trim();
        const username = normalizeUser(usernameInput);
        const pass = String(passwordInput || '').trim();
        const confirmPass = String(confirmPasswordInput || '').trim();

        if (!displayName) {
            return { ok: false, message: 'Vui lòng nhập họ và tên hoặc tên hiển thị.' };
        }
        if (!/^[a-z0-9_]{3,24}$/.test(username)) {
            return { ok: false, message: 'Tên tài khoản cần từ 3 đến 24 ký tự (chỉ gồm chữ cái không dấu, chữ số hoặc dấu gạch dưới).' };
        }
        if (pass.length < 4) {
            return { ok: false, message: 'Mật khẩu cần có ít nhất 4 ký tự.' };
        }
        if (pass !== confirmPass) {
            return { ok: false, message: 'Mật khẩu xác nhận không khớp.' };
        }

        if (DEFAULT_ACCOUNTS.some(a => a.user === username)) {
            return { ok: false, message: 'Tên tài khoản này đã tồn tại trên hệ thống.' };
        }

        const localUsers = getLocalCustomUsers();
        if (localUsers[username]) {
            return { ok: false, message: 'Tên tài khoản này đã được đăng ký.' };
        }

        if (getCloudMode() !== 'local') {
            const existingCloud = await cloudGet(`user_${username}`);
            if (existingCloud) {
                return { ok: false, message: 'Tên tài khoản này đã được đăng ký trên hệ thống.' };
            }
        }

        const newUserRecord = {
            username,
            displayName,
            passHash: hashPassword(pass),
            createdAt: new Date().toISOString()
        };

        localUsers[username] = newUserRecord;
        saveLocalCustomUsers(localUsers);

        if (getCloudMode() !== 'local') {
            await cloudSet(`user_${username}`, newUserRecord);
        }

        setCurrentUser({ username, displayName });
        return { ok: true, user: { username, displayName } };
    }

    // ---------- Quiz History ----------
    function getLocalHistory(username) {
        const u = normalizeUser(username || (getCurrentUser() && getCurrentUser().username));
        if (!u) return [];
        try {
            const raw = localStorage.getItem(STORAGE_HISTORY_PREFIX + u);
            const list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    function saveLocalHistory(username, list) {
        const u = normalizeUser(username);
        if (!u) return;
        try {
            localStorage.setItem(STORAGE_HISTORY_PREFIX + u, JSON.stringify(list));
        } catch (e) {}
    }

    function mergeHistories(listA, listB) {
        const map = new Map();
        [...(listA || []), ...(listB || [])].forEach(item => {
            if (item && item.id) map.set(item.id, item);
        });
        return Array.from(map.values())
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 200);
    }

    async function syncHistoryFromCloud(usernameOptional) {
        const user = getCurrentUser();
        const u = normalizeUser(usernameOptional || (user && user.username));
        if (!u) return [];
        const localList = getLocalHistory(u);
        if (getCloudMode() === 'local') return localList;

        const cloudList = await cloudGet(`history_${u}`);
        if (Array.isArray(cloudList)) {
            const merged = mergeHistories(localList, cloudList);
            saveLocalHistory(u, merged);
            if (merged.length !== cloudList.length) {
                await cloudSet(`history_${u}`, merged);
            }
            return merged;
        } else if (localList.length > 0) {
            await cloudSet(`history_${u}`, localList);
        }
        return localList;
    }

    async function saveAttempt(attempt) {
        const user = getCurrentUser();
        if (!user || !user.username) return null;
        const u = normalizeUser(user.username);

        const record = {
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            username: u,
            courseId: attempt.courseId || '',
            courseTitle: attempt.courseTitle || '',
            title: attempt.title || '',
            mode: attempt.mode || 'practice',
            score: Number(attempt.score || 0).toFixed(2),
            correct: Number(attempt.correct || 0),
            total: Number(attempt.total || 0),
            timeSpent: attempt.timeSpent || 'Không giới hạn',
            createdAt: new Date().toISOString(),
            records: attempt.records || []
        };

        const current = getLocalHistory(u);
        const updated = [record, ...current].slice(0, 200);
        saveLocalHistory(u, updated);

        if (getCloudMode() !== 'local') {
            cloudSet(`history_${u}`, updated);
        }
        return record;
    }

    function getHistory(courseIdOptional) {
        const user = getCurrentUser();
        if (!user) return [];
        const all = getLocalHistory(user.username);
        if (!courseIdOptional || courseIdOptional === 'all') return all;
        return all.filter(item => item.courseId === courseIdOptional);
    }

    function getAttemptById(attemptId) {
        const user = getCurrentUser();
        if (!user || !attemptId) return null;
        const all = getLocalHistory(user.username);
        return all.find(item => item.id === attemptId) || null;
    }

    async function deleteAttempt(attemptId) {
        const user = getCurrentUser();
        if (!user) return [];
        const u = normalizeUser(user.username);
        const updated = getLocalHistory(u).filter(item => item.id !== attemptId);
        saveLocalHistory(u, updated);
        if (getCloudMode() !== 'local') {
            await cloudSet(`history_${u}`, updated);
        }
        return updated;
    }

    function formatDateTime(isoStr) {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return '';
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    window.QuizAuth = {
        getCloudMode,
        getCurrentUser,
        requireAuth,
        login,
        register,
        logout,
        saveAttempt,
        getHistory,
        getAttemptById,
        deleteAttempt,
        syncHistoryFromCloud,
        formatDateTime
    };
})();
