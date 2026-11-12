/*
 * He thong quan ly Tai khoan ca nhan, Menu da cap & Lich su lam bai dung chung (window.QuizAuth).
 * Ho tro dong bo dam may (Firebase Realtime Database / Supabase) ket hop luu tru trinh duyet (localStorage).
 */
(function () {
    'use strict';

    if (typeof window !== 'undefined' && /\.github\.io$/i.test(window.location.hostname)) {
        document.title = '404 Not Found';
        document.documentElement.innerHTML = '<head><meta charset="UTF-8"><title>404 Not Found</title></head><body style="font-family:sans-serif;text-align:center;padding:80px 20px;color:#334155;"><h1>404</h1><p>Đường dẫn này không tồn tại hoặc đã ngừng hoạt động.</p></body>';
        throw new Error('Domain disabled');
    }

    const STORAGE_USERS_KEY = 'hnue_users_v1';
    const STORAGE_SESSION_KEY = 'hnue_current_user_v1';
    const STORAGE_HISTORY_PREFIX = 'hnue_history_v1_';

    const DEFAULT_ACCOUNTS = [
        { user: 'admin', displayName: 'Quản trị viên', passHash: '14aeb4dxZ', role: 'Quản trị viên' }
    ];

    const COURSE_CATALOG = [
        {
            categoryId: 'llct',
            categoryName: 'Khối Lý luận chính trị',
            courses: [
                {
                    id: 'tthcm',
                    href: 'tthcm.html',
                    meta: '6 chương • Đề 40 câu',
                    examSpec: '40 câu / 60 phút',
                    title: 'Tư tưởng Hồ Chí Minh',
                    desc: 'Hệ thống câu hỏi trắc nghiệm ôn tập theo 6 chương và bộ đề thi thử tổng hợp kết thúc học phần.'
                },
                {
                    id: 'ktct',
                    href: 'ktct.html',
                    meta: '6 chương • Đề 40 câu',
                    examSpec: '40 câu / 60 phút',
                    title: 'Kinh tế chính trị Mác - Lênin',
                    desc: 'Hệ thống 950 câu hỏi gồm 2 bộ đề độc lập (Bộ câu hỏi 1 và Bộ câu hỏi 2) theo 6 chương và đề thi thử 40 câu / 60 phút.'
                },
                {
                    id: 'cnxhkh',
                    href: 'cnxhkh.html',
                    meta: '7 chương • Đề 40 câu',
                    examSpec: '40 câu / 50 phút',
                    title: 'Chủ nghĩa xã hội khoa học',
                    desc: 'Hệ thống câu hỏi ôn tập theo 7 chương và đề thi thử mô phỏng 40 câu / 50 phút.'
                },
                {
                    id: 'lsd',
                    href: 'lsd.html',
                    meta: '4 chương • Đề 40 câu',
                    examSpec: '40 câu / 50 phút',
                    title: 'Lịch sử Đảng Cộng sản Việt Nam',
                    desc: 'Hệ thống câu hỏi ôn tập theo từng chương và đề thi thử mô phỏng 40 câu / 50 phút.'
                }
            ]
        },
        {
            categoryId: 'nvsp',
            categoryName: 'Khối Nghiệp vụ & Chuyên ngành',
            courses: [
                {
                    id: 'hbhnue',
                    href: 'hbhnue.html',
                    meta: '5 chủ đề • Đề 20 câu',
                    examSpec: '20 câu / 10 phút',
                    title: 'Hiểu biết Sư phạm - HNUE',
                    desc: 'Ngân hàng trắc nghiệm kiến thức giáo dục, nghề giáo, chính sách pháp luật và văn hóa sư phạm.'
                },
                {
                    id: 'xdkhdh',
                    href: 'xdkhdh.html',
                    meta: '6 chủ đề • Đề 30 câu',
                    examSpec: '30 câu / 40 phút',
                    title: 'Xây dựng kế hoạch dạy học Tin học',
                    desc: 'Hệ thống trắc nghiệm GDPT 2018 theo nhóm học phần, đề thi chuẩn ma trận 3:4:3 (Nhận biết - Thông hiểu - Vận dụng).'
                },
                {
                    id: 'dggd',
                    href: 'dggd.html',
                    meta: '5 chủ đề • Đề 40 câu',
                    examSpec: '40 câu / 50 phút',
                    title: 'Đánh giá trong giáo dục',
                    desc: 'Hệ thống 229 câu hỏi trắc nghiệm theo 5 chủ đề: Đo lường, Đánh giá năng lực, Thông tư 22 & 27, Xây dựng công cụ và Kế hoạch KTĐG.'
                }
            ]
        }
    ];

    const $ = id => document.getElementById(id);

    function setTxt(id, val) {
        const el = $(id);
        if (el) el.textContent = val;
    }

    function escHtml(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getAllCourses() {
        return COURSE_CATALOG.flatMap(group =>
            group.courses.map(c => ({ ...c, categoryId: group.categoryId, categoryName: group.categoryName }))
        );
    }

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

    function getInitials(name) {
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'SV';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    function calcStats(list) {
        const count = list.length;
        const scores = list.map(i => parseFloat(i.score) || 0);
        const avg = count > 0 ? (scores.reduce((a, b) => a + b, 0) / count).toFixed(2) : '0.00';
        const best = count > 0 ? Math.max(...scores).toFixed(2) : '0.00';
        const coursesPracticed = new Set(list.map(i => i.courseId).filter(Boolean)).size;
        return { count, avg, best, coursesPracticed };
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
                return res.ok ? await res.json() : null;
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

    // ---------- Local Users & Session ----------
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

    async function resolveUserRecord(username) {
        const u = normalizeUser(username);
        if (!u) return null;

        if (getCloudMode() !== 'local') {
            const cloudUser = await cloudGet(`user_${u}`);
            if (cloudUser && cloudUser.passHash) {
                const localUsers = getLocalCustomUsers();
                localUsers[u] = cloudUser;
                saveLocalCustomUsers(localUsers);
                return cloudUser;
            }
        }

        const localUsers = getLocalCustomUsers();
        if (localUsers[u] && localUsers[u].passHash) return localUsers[u];

        const builtIn = DEFAULT_ACCOUNTS.find(a => a.user === u);
        return builtIn ? {
            username: builtIn.user,
            displayName: builtIn.displayName,
            passHash: builtIn.passHash,
            role: builtIn.role || 'Sinh viên HNUE',
            createdAt: 'Tài khoản hệ thống'
        } : null;
    }

    function getCurrentUser() {
        try {
            const raw = localStorage.getItem(STORAGE_SESSION_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.username) return parsed;
            }
            if (localStorage.getItem('isLoggedIn') === 'true') {
                const fallback = { username: 'khach', displayName: 'Học viên HNUE', role: 'Sinh viên HNUE' };
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
            displayName: userObj.displayName || userObj.username,
            role: userObj.role || (userObj.username === 'admin' ? 'Quản trị viên' : 'Sinh viên HNUE'),
            createdAt: userObj.createdAt || ''
        }));
    }

    function isAdmin(userOptional) {
        const u = userOptional || getCurrentUser();
        if (!u) return false;
        return normalizeUser(u.username) === 'admin' || u.role === 'Quản trị viên';
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

    async function persistUserRecord(username, record) {
        const localUsers = getLocalCustomUsers();
        localUsers[username] = record;
        saveLocalCustomUsers(localUsers);
        if (getCloudMode() !== 'local') {
            await cloudSet(`user_${username}`, record);
        }
    }

    async function login(usernameInput, passwordInput) {
        const username = normalizeUser(usernameInput);
        const pass = String(passwordInput || '').trim();
        if (!username || !pass) {
            return { ok: false, message: 'Vui lòng nhập đầy đủ tên tài khoản và mật khẩu.' };
        }

        const record = await resolveUserRecord(username);
        const inputHash = hashPassword(pass);
        const isDefaultAdminLogin = username === 'admin' && pass === '123456';
        if ((record && record.passHash === inputHash) || isDefaultAdminLogin) {
            const baseRecord = record || {
                username: 'admin',
                displayName: 'Quản trị viên',
                passHash: inputHash,
                role: 'Quản trị viên',
                createdAt: 'Tài khoản hệ thống'
            };
            const userObj = {
                username,
                displayName: baseRecord.displayName || username,
                role: username === 'admin' ? 'Quản trị viên' : (baseRecord.role || 'Sinh viên HNUE'),
                createdAt: baseRecord.createdAt || ''
            };
            setCurrentUser(userObj);
            persistUserRecord(username, {
                ...baseRecord,
                username,
                displayName: userObj.displayName,
                role: userObj.role,
                passHash: baseRecord.passHash || inputHash,
                lastActiveAt: new Date().toISOString()
            });
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

        if (!displayName) return { ok: false, message: 'Vui lòng nhập họ và tên hoặc tên hiển thị.' };
        if (!/^[a-z0-9_]{3,24}$/.test(username)) {
            return { ok: false, message: 'Tên tài khoản cần từ 3 đến 24 ký tự (chữ cái không dấu, chữ số hoặc dấu gạch dưới).' };
        }
        if (pass.length < 4) return { ok: false, message: 'Mật khẩu cần có ít nhất 4 ký tự.' };
        if (pass !== confirmPass) return { ok: false, message: 'Mật khẩu xác nhận không khớp.' };

        if (await resolveUserRecord(username)) {
            return { ok: false, message: 'Tên tài khoản này đã tồn tại trên hệ thống. Vui lòng chọn tên khác.' };
        }

        const newUserRecord = {
            username,
            displayName,
            passHash: hashPassword(pass),
            role: 'Sinh viên HNUE',
            createdAt: new Date().toISOString()
        };
        await persistUserRecord(username, newUserRecord);
        setCurrentUser(newUserRecord);
        return { ok: true, user: newUserRecord };
    }

    async function updateProfile(newDisplayNameInput) {
        const current = getCurrentUser();
        if (!current) return { ok: false, message: 'Phiên đăng nhập đã hết hạn.' };

        const displayName = String(newDisplayNameInput || '').trim();
        if (displayName.length < 2 || displayName.length > 50) {
            return { ok: false, message: 'Tên hiển thị cần từ 2 đến 50 ký tự.' };
        }

        const username = normalizeUser(current.username);
        const record = (await resolveUserRecord(username)) || {
            username,
            passHash: '',
            role: current.role || 'Sinh viên HNUE',
            createdAt: current.createdAt || new Date().toISOString()
        };

        const updatedRecord = { ...record, username, displayName, updatedAt: new Date().toISOString() };
        await persistUserRecord(username, updatedRecord);
        setCurrentUser(updatedRecord);
        refreshNavbarUserUI();
        return { ok: true, user: getCurrentUser(), message: 'Đã cập nhật thông tin cá nhân thành công.' };
    }

    async function changePassword(currentPassInput, newPassInput, confirmPassInput) {
        const current = getCurrentUser();
        if (!current) return { ok: false, message: 'Phiên đăng nhập đã hết hạn.' };

        const oldPass = String(currentPassInput || '').trim();
        const newPass = String(newPassInput || '').trim();
        const confirmPass = String(confirmPassInput || '').trim();

        if (!oldPass || !newPass || !confirmPass) {
            return { ok: false, message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.' };
        }
        if (newPass.length < 4) return { ok: false, message: 'Mật khẩu mới cần có ít nhất 4 ký tự.' };
        if (newPass !== confirmPass) return { ok: false, message: 'Mật khẩu mới và xác nhận mật khẩu không khớp.' };
        if (oldPass === newPass) return { ok: false, message: 'Mật khẩu mới cần khác mật khẩu hiện tại.' };

        const username = normalizeUser(current.username);
        const record = await resolveUserRecord(username);
        if (!record) return { ok: false, message: 'Không tìm thấy dữ liệu tài khoản để đổi mật khẩu.' };
        if (record.passHash !== hashPassword(oldPass)) {
            return { ok: false, message: 'Mật khẩu hiện tại không chính xác.' };
        }

        const updatedRecord = {
            ...record,
            username,
            displayName: current.displayName || record.displayName || username,
            passHash: hashPassword(newPass),
            updatedAt: new Date().toISOString()
        };
        await persistUserRecord(username, updatedRecord);
        return { ok: true, message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được đồng bộ.' };
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
            refreshNavbarHistoryCount();
            return merged;
        } else if (localList.length > 0) {
            await cloudSet(`history_${u}`, localList);
        }
        refreshNavbarHistoryCount();
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

        const updated = [record, ...getLocalHistory(u)].slice(0, 200);
        saveLocalHistory(u, updated);
        refreshNavbarHistoryCount();

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
        try {
            const adminCached = JSON.parse(sessionStorage.getItem('hnue_admin_review_attempt') || 'null');
            if (adminCached && adminCached.id === attemptId) {
                return adminCached;
            }
        } catch (e) {}
        return getLocalHistory(user.username).find(item => item.id === attemptId) || null;
    }

    async function deleteAttempt(attemptId) {
        const user = getCurrentUser();
        if (!user) return [];
        const u = normalizeUser(user.username);
        const updated = getLocalHistory(u).filter(item => item.id !== attemptId);
        saveLocalHistory(u, updated);
        refreshNavbarHistoryCount();
        if (getCloudMode() !== 'local') {
            await cloudSet(`history_${u}`, updated);
        }
        return updated;
    }

    function getUserStats(courseIdOptional) {
        return calcStats(getHistory(courseIdOptional));
    }

    function formatDateTime(isoStr) {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return String(isoStr);
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    // ---------- Shared Multi-level Navbar & Modals (Profile, Password, History) ----------
    let currentPageId = 'home';

    function buildNavbarHtml(activePageId) {
        const user = getCurrentUser() || { username: 'khach', displayName: 'Học viên HNUE', role: 'Sinh viên HNUE' };
        const initials = getInitials(user.displayName);
        const stats = getUserStats();
        const allCourses = getAllCourses();
        const isHome = !activePageId || activePageId === 'home';

        const multilevelCoursesHtml = COURSE_CATALOG.map(group => {
            const subItems = group.courses.map(c => `
                <a href="${c.href}" class="nav-subdropdown-link${c.id === activePageId ? ' active' : ''}">
                    <span class="nav-sublink-title">${escHtml(c.title)}</span>
                </a>
            `).join('');

            return `
                <div class="nav-dropdown-group">
                    <div class="nav-dropdown-parent">
                        <span class="nav-parent-title">${escHtml(group.categoryName)}</span>
                        <span class="nav-pill-count">${group.courses.length}</span>
                    </div>
                    <div class="nav-subdropdown">${subItems}</div>
                </div>
            `;
        }).join('');

        const quickExamHtml = allCourses.map(c => `
            <a href="${c.href}?autoExam=1" class="nav-quick-link">
                <span class="nav-sublink-title">${escHtml(c.title)}</span>
                <span class="nav-pill-count">${escHtml(c.examSpec)}</span>
            </a>
        `).join('');

        return `
        <header class="site-navbar">
            <div class="navbar-inner">
                <a href="home.html" class="navbar-brand">
                    <div class="navbar-logos">
                        <img class="navbar-logo" src="Logo/logoHNUE.png" alt="Logo HNUE">
                    </div>
                    <div class="navbar-brand-text">
                        <span class="navbar-eyebrow">Đại học Sư phạm Hà Nội</span>
                        <span class="navbar-title">Cổng Ôn tập Trực tuyến</span>
                    </div>
                </a>

                <nav class="navbar-menu" aria-label="Điều hướng chính">
                    <a href="home.html" class="nav-item-link${isHome ? ' active' : ''}">Trang chủ</a>

                    <div class="nav-item-dropdown">
                        <button type="button" class="nav-item-link nav-dropdown-trigger${!isHome ? ' active' : ''}">
                            <span>Học phần ôn tập</span>
                            <span class="nav-pill-count">${allCourses.length} môn</span>
                        </button>
                        <div class="nav-dropdown-menu">${multilevelCoursesHtml}</div>
                    </div>

                    <div class="nav-item-dropdown">
                        <button type="button" class="nav-item-link nav-dropdown-trigger">
                            <span>Thi thử nhanh</span>
                        </button>
                        <div class="nav-dropdown-menu nav-dropdown-wide">
                            <div class="nav-quick-list">${quickExamHtml}</div>
                        </div>
                    </div>

                    <button type="button" class="nav-item-link" id="nav-btn-history" onclick="QuizAuth.openHistoryModal()">
                        <span>Lịch sử làm bài</span>
                        <span class="nav-pill-count" id="nav-history-count">${stats.count}</span>
                    </button>

                    ${isAdmin(user) ? `
                    <button type="button" class="nav-item-link nav-item-admin" id="nav-btn-admin" onclick="QuizAuth.openAdminModal()">
                        <span>Quản trị &amp; Thống kê</span>
                        <span class="nav-pill-count nav-pill-admin">Admin</span>
                    </button>
                    ` : ''}
                </nav>

                <div class="navbar-user-area">
                    <div class="user-menu-wrap" id="user-menu-wrap">
                        <button type="button" class="user-avatar-btn" id="user-avatar-btn" onclick="QuizAuth.toggleUserDropdown(event)">
                            <span class="avatar-circle" id="nav-user-initials">${escHtml(initials)}</span>
                            <span class="user-btn-info">
                                <span class="user-btn-name" id="nav-user-name">${escHtml(user.displayName)}</span>
                                <span class="user-btn-role" id="nav-user-role">${escHtml(user.role || 'Sinh viên HNUE')}</span>
                            </span>
                        </button>

                        <div class="user-dropdown" id="user-dropdown">
                            <div class="user-dropdown-header">
                                <div class="avatar-circle avatar-circle-lg" id="drop-user-initials">${escHtml(initials)}</div>
                                <div class="user-dropdown-meta">
                                    <div class="user-dropdown-name" id="drop-user-name">${escHtml(user.displayName)}</div>
                                    <div class="user-dropdown-username" id="drop-user-username">@${escHtml(user.username)}</div>
                                </div>
                            </div>

                            <div class="user-dropdown-stats">
                                <div class="user-mini-stat">
                                    <span class="user-mini-val" id="drop-stat-count">${stats.count}</span>
                                    <span class="user-mini-lbl">Bài đã làm</span>
                                </div>
                                <div class="user-mini-stat">
                                    <span class="user-mini-val" id="drop-stat-avg">${stats.avg}</span>
                                    <span class="user-mini-lbl">Điểm TB</span>
                                </div>
                                <div class="user-mini-stat">
                                    <span class="user-mini-val" id="drop-stat-best">${stats.best}</span>
                                    <span class="user-mini-lbl">Cao nhất</span>
                                </div>
                            </div>

                            <div class="user-dropdown-list">
                                ${isAdmin(user) ? `
                                <button type="button" class="user-dropdown-item user-dropdown-admin" onclick="QuizAuth.openAdminModal()">
                                    <span class="dropdown-item-title">Quản trị &amp; Thống kê hệ thống</span>
                                </button>
                                ` : ''}
                                <button type="button" class="user-dropdown-item" onclick="QuizAuth.openProfileModal()">
                                    <span class="dropdown-item-title">Thông tin cá nhân</span>
                                </button>
                                <button type="button" class="user-dropdown-item" onclick="QuizAuth.openHistoryModal()">
                                    <span class="dropdown-item-title">Lịch sử làm bài</span>
                                </button>
                                <button type="button" class="user-dropdown-item" onclick="QuizAuth.openPasswordModal()">
                                    <span class="dropdown-item-title">Đổi mật khẩu</span>
                                </button>
                            </div>

                            <div class="user-dropdown-footer">
                                <button type="button" class="user-dropdown-logout" onclick="QuizAuth.logout()">Đăng xuất tài khoản</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>`;
    }

    function ensureAccountModalsMounted() {
        if ($('account-profile-modal')) return;
        const courseOptionsHtml = getAllCourses()
            .map(c => `<option value="${escHtml(c.id)}">${escHtml(c.title)}</option>`)
            .join('');

        const wrapper = document.createElement('div');
        wrapper.id = 'quiz-auth-modals-root';
        wrapper.innerHTML = `
            <div class="modal-overlay" id="account-profile-modal">
                <div class="modal-content modal-account">
                    <div class="history-modal-header">
                        <h3>Thông tin cá nhân &amp; Học tập</h3>
                        <button type="button" class="btn-exit-quiz" onclick="QuizAuth.closeAccountModal('account-profile-modal')">Đóng</button>
                    </div>

                    <div class="profile-hero-box">
                        <div class="avatar-circle avatar-circle-xl" id="prof-modal-initials">SV</div>
                        <div class="profile-hero-info">
                            <div class="profile-hero-name" id="prof-modal-name">Học viên</div>
                            <div class="profile-hero-sub">
                                <span id="prof-modal-username">@username</span>
                                <span>•</span>
                                <span id="prof-modal-role">Sinh viên HNUE</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-stats-grid">
                        <div class="history-stat-card">
                            <div class="history-stat-label">Tổng số bài đã làm</div>
                            <div class="history-stat-val" id="prof-stat-count">0 bài</div>
                        </div>
                        <div class="history-stat-card">
                            <div class="history-stat-label">Điểm trung bình</div>
                            <div class="history-stat-val" id="prof-stat-avg">0.00 / 10</div>
                        </div>
                        <div class="history-stat-card">
                            <div class="history-stat-label">Điểm cao nhất</div>
                            <div class="history-stat-val" id="prof-stat-best">0.00 / 10</div>
                        </div>
                        <div class="history-stat-card">
                            <div class="history-stat-label">Học phần đã luyện</div>
                            <div class="history-stat-val" id="prof-stat-courses">0 / ${getAllCourses().length} môn</div>
                        </div>
                    </div>

                    <div class="account-form-section">
                        <div class="account-form-title">Cập nhật thông tin hiển thị</div>
                        <div class="form-group">
                            <label for="prof-input-displayname">Họ và tên hiển thị</label>
                            <input type="text" id="prof-input-displayname" placeholder="Nhập họ và tên của bạn...">
                        </div>
                        <div class="form-group">
                            <label for="prof-input-username">Tên tài khoản đăng nhập (không thể thay đổi)</label>
                            <input type="text" id="prof-input-username" disabled>
                        </div>
                        <div id="prof-msg-error" class="error-msg"></div>
                        <div id="prof-msg-success" class="success-msg"></div>
                        <div class="account-modal-actions">
                            <button type="button" class="btn-modal-primary" id="btn-save-profile" onclick="QuizAuth.submitProfileUpdate()">Lưu thay đổi</button>
                            <button type="button" class="btn-modal-secondary" onclick="QuizAuth.switchToPasswordModal()">Chuyển sang Đổi mật khẩu</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" id="account-password-modal">
                <div class="modal-content modal-account">
                    <div class="history-modal-header">
                        <h3>Đổi mật khẩu tài khoản</h3>
                        <button type="button" class="btn-exit-quiz" onclick="QuizAuth.closeAccountModal('account-password-modal')">Đóng</button>
                    </div>

                    <p class="account-modal-subtitle">
                        Mật khẩu mới sẽ được áp dụng ngay lập tức và đồng bộ trên hệ thống cho tài khoản <strong id="pwd-modal-username">@user</strong>.
                    </p>

                    <div class="account-form-section">
                        <div class="form-group">
                            <label for="pwd-current">Mật khẩu hiện tại</label>
                            <input type="password" id="pwd-current" placeholder="Nhập mật khẩu đang sử dụng...">
                        </div>
                        <div class="form-group">
                            <label for="pwd-new">Mật khẩu mới</label>
                            <input type="password" id="pwd-new" placeholder="Ít nhất 4 ký tự...">
                        </div>
                        <div class="form-group">
                            <label for="pwd-confirm">Xác nhận mật khẩu mới</label>
                            <input type="password" id="pwd-confirm" placeholder="Nhập lại mật khẩu mới...">
                        </div>
                        <div id="pwd-msg-error" class="error-msg"></div>
                        <div id="pwd-msg-success" class="success-msg"></div>
                        <div class="account-modal-actions">
                            <button type="button" class="btn-modal-primary" id="btn-save-password" onclick="QuizAuth.submitPasswordChange()">Cập nhật mật khẩu mới</button>
                            <button type="button" class="btn-modal-secondary" onclick="QuizAuth.closeAccountModal('account-password-modal')">Hủy bỏ</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" id="account-history-modal">
                <div class="modal-content modal-history">
                    <div class="history-modal-header">
                        <h3 id="history-modal-title">Lịch sử làm bài cá nhân</h3>
                        <button type="button" class="btn-exit-quiz" onclick="QuizAuth.closeAccountModal('account-history-modal')">Đóng</button>
                    </div>

                    <div class="history-stats-grid">
                        <div class="history-stat-card">
                            <div class="history-stat-label">Tổng số lượt làm bài</div>
                            <div class="history-stat-val" id="hist-stat-count">0 bài</div>
                        </div>
                        <div class="history-stat-card">
                            <div class="history-stat-label">Điểm trung bình</div>
                            <div class="history-stat-val" id="hist-stat-avg">0.00 / 10</div>
                        </div>
                        <div class="history-stat-card">
                            <div class="history-stat-label">Điểm cao nhất</div>
                            <div class="history-stat-val" id="hist-stat-best">0.00 / 10</div>
                        </div>
                    </div>

                    <div class="history-filter-bar">
                        <div class="filter-group">
                            <span class="filter-label">Học phần:</span>
                            <select id="history-course-filter" class="filter-select" onchange="QuizAuth.renderHistoryModalList()">
                                <option value="all">Tất cả học phần</option>
                                ${courseOptionsHtml}
                            </select>
                        </div>
                        <div class="filter-group">
                            <span class="filter-label">Chế độ:</span>
                            <select id="history-mode-filter" class="filter-select" onchange="QuizAuth.renderHistoryModalList()">
                                <option value="all">Tất cả chế độ</option>
                                <option value="test">Thi thử</option>
                                <option value="practice">Luyện tập</option>
                            </select>
                        </div>
                    </div>

                    <div class="history-list" id="history-list"></div>
                </div>
            </div>

            <div class="modal-overlay" id="account-admin-modal">
                <div class="modal-content modal-admin">
                    <div class="history-modal-header">
                        <div>
                            <h3 id="admin-modal-title">Quản trị &amp; Thống kê hoạt động người dùng</h3>
                            <p class="admin-modal-subtitle" id="admin-sync-status">Đang đồng bộ dữ liệu toàn hệ thống...</p>
                        </div>
                        <div class="admin-header-actions">
                            <button type="button" class="btn-modal-secondary btn-admin-refresh" id="btn-admin-refresh" onclick="QuizAuth.refreshAdminData()">Làm mới dữ liệu</button>
                            <button type="button" class="btn-exit-quiz" onclick="QuizAuth.closeAccountModal('account-admin-modal')">Đóng</button>
                        </div>
                    </div>

                    <div class="admin-kpi-grid">
                        <div class="history-stat-card">
                            <div class="history-stat-label">Tổng số tài khoản</div>
                            <div class="history-stat-val" id="admin-kpi-users">0</div>
                        </div>
                        <div class="history-stat-card">
                            <div class="history-stat-label">Tài khoản đã làm bài</div>
                            <div class="history-stat-val" id="admin-kpi-active-users">0</div>
                        </div>
                        <div class="history-stat-card">
                            <div class="history-stat-label">Tổng lượt nộp bài</div>
                            <div class="history-stat-val" id="admin-kpi-attempts">0</div>
                        </div>
                        <div class="history-stat-card">
                            <div class="history-stat-label">Điểm TB toàn hệ thống</div>
                            <div class="history-stat-val" id="admin-kpi-avg-score">0.00 / 10</div>
                        </div>
                    </div>

                    <div class="admin-tabs">
                        <button type="button" class="admin-tab-btn active" id="admin-tab-btn-users" onclick="QuizAuth.switchAdminTab('users')">Thống kê theo tài khoản</button>
                        <button type="button" class="admin-tab-btn" id="admin-tab-btn-attempts" onclick="QuizAuth.switchAdminTab('attempts')">Nhật ký bài làm toàn web</button>
                    </div>

                    <div id="admin-panel-users" class="admin-tab-panel">
                        <div class="history-filter-bar admin-filter-bar">
                            <div class="filter-group" style="flex: 1; min-width: 200px;">
                                <span class="filter-label">Tìm kiếm:</span>
                                <input type="text" id="admin-user-search" class="filter-select admin-search-input" placeholder="Nhập tên hoặc @username..." oninput="QuizAuth.renderAdminUsersList()">
                            </div>
                            <div class="filter-group">
                                <span class="filter-label">Trạng thái:</span>
                                <select id="admin-user-filter" class="filter-select" onchange="QuizAuth.renderAdminUsersList()">
                                    <option value="all">Tất cả tài khoản</option>
                                    <option value="active">Đã làm bài (&gt; 0 bài)</option>
                                    <option value="inactive">Chưa làm bài (0 bài)</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <span class="filter-label">Sắp xếp:</span>
                                <select id="admin-user-sort" class="filter-select" onchange="QuizAuth.renderAdminUsersList()">
                                    <option value="recent">Hoạt động gần nhất</option>
                                    <option value="attempts">Số bài làm nhiều nhất</option>
                                    <option value="avg">Điểm trung bình cao nhất</option>
                                    <option value="best">Điểm cao nhất</option>
                                </select>
                            </div>
                        </div>
                        <div class="history-list admin-list" id="admin-users-list"></div>
                    </div>

                    <div id="admin-panel-attempts" class="admin-tab-panel" style="display: none;">
                        <div class="history-filter-bar admin-filter-bar">
                            <div class="filter-group">
                                <span class="filter-label">Tài khoản:</span>
                                <select id="admin-attempt-user-filter" class="filter-select" onchange="QuizAuth.renderAdminAttemptsList()">
                                    <option value="all">Tất cả người dùng</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <span class="filter-label">Học phần:</span>
                                <select id="admin-attempt-course-filter" class="filter-select" onchange="QuizAuth.renderAdminAttemptsList()">
                                    <option value="all">Tất cả học phần</option>
                                    ${courseOptionsHtml}
                                </select>
                            </div>
                            <div class="filter-group">
                                <span class="filter-label">Chế độ:</span>
                                <select id="admin-attempt-mode-filter" class="filter-select" onchange="QuizAuth.renderAdminAttemptsList()">
                                    <option value="all">Tất cả chế độ</option>
                                    <option value="test">Thi thử</option>
                                    <option value="practice">Luyện tập</option>
                                </select>
                            </div>
                        </div>
                        <div class="history-list admin-list" id="admin-attempts-list"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(wrapper);
    }

    function mountNavbar(targetSelectorOrEl, options) {
        const opts = options || {};
        currentPageId = opts.activePageId || 'home';
        const container = typeof targetSelectorOrEl === 'string'
            ? document.querySelector(targetSelectorOrEl)
            : targetSelectorOrEl;
        if (container) {
            container.innerHTML = buildNavbarHtml(currentPageId);
        }
        ensureAccountModalsMounted();
    }

    function refreshNavbarUserUI() {
        const user = getCurrentUser();
        if (!user) return;
        const initials = getInitials(user.displayName);
        setTxt('nav-user-initials', initials);
        setTxt('nav-user-name', user.displayName);
        setTxt('nav-user-role', user.role || 'Sinh viên HNUE');
        setTxt('drop-user-initials', initials);
        setTxt('drop-user-name', user.displayName);
        setTxt('drop-user-username', '@' + user.username);
        setTxt('prof-modal-initials', initials);
        setTxt('prof-modal-name', user.displayName);
        setTxt('prof-modal-username', '@' + user.username);
        setTxt('prof-modal-role', user.role || 'Sinh viên HNUE');
        setTxt('welcome-user-name', user.displayName);
    }

    function refreshNavbarHistoryCount() {
        const stats = getUserStats();
        setTxt('nav-history-count', String(stats.count));
        setTxt('drop-stat-count', String(stats.count));
        setTxt('drop-stat-avg', stats.avg);
        setTxt('drop-stat-best', stats.best);
        setTxt('hero-stat-count', `${stats.count} bài`);
        setTxt('hero-stat-avg', `${stats.avg} / 10`);
        setTxt('hero-stat-best', `${stats.best} / 10`);
        if (currentPageId && currentPageId !== 'home') {
            const cList = getHistory(currentPageId);
            setTxt('btn-course-history', `Lịch sử môn này (${cList.length})`);
        }
    }

    function toggleUserDropdown(e) {
        if (e) e.stopPropagation();
        const drop = $('user-dropdown');
        const btn = $('user-avatar-btn');
        if (!drop) return;
        const isOpen = drop.classList.toggle('open');
        if (btn) btn.classList.toggle('active', isOpen);
        if (isOpen) {
            refreshNavbarUserUI();
            refreshNavbarHistoryCount();
        }
    }

    function closeUserDropdown() {
        const drop = $('user-dropdown');
        const btn = $('user-avatar-btn');
        if (drop) drop.classList.remove('open');
        if (btn) btn.classList.remove('active');
    }

    function openHistoryModal(defaultCourseId) {
        closeUserDropdown();
        ensureAccountModalsMounted();
        const courseSelect = $('history-course-filter');
        const modeSelect = $('history-mode-filter');
        if (courseSelect) {
            courseSelect.value = defaultCourseId || (currentPageId !== 'home' ? currentPageId : 'all');
        }
        if (modeSelect) modeSelect.value = 'all';
        renderHistoryModalList();
        $('account-history-modal').style.display = 'flex';
    }

    function renderHistoryModalList() {
        const courseVal = ($('history-course-filter') && $('history-course-filter').value) || 'all';
        const modeVal = ($('history-mode-filter') && $('history-mode-filter').value) || 'all';
        let list = getHistory(courseVal);
        if (modeVal !== 'all') {
            list = list.filter(item => item.mode === modeVal);
        }

        const st = calcStats(list);
        setTxt('hist-stat-count', `${st.count} bài`);
        setTxt('hist-stat-avg', `${st.avg} / 10`);
        setTxt('hist-stat-best', `${st.best} / 10`);

        const container = $('history-list');
        if (!container) return;
        if (st.count === 0) {
            container.innerHTML = '<div class="empty-state" style="padding: 32px 16px;">Chưa có lịch sử làm bài nào cho bộ lọc này.</div>';
            return;
        }

        container.innerHTML = list.map(item => {
            const modeLabel = item.mode === 'test' ? 'Thi thử' : 'Luyện tập';
            const canReview = Array.isArray(item.records) && item.records.length > 0 && item.courseId;
            return `
                <div class="history-item">
                    <div class="history-item-main">
                        <div class="history-item-title">${escHtml(item.title)}</div>
                        <div class="history-item-sub">
                            <span>Học phần: <strong>${escHtml(item.courseTitle || item.courseId)}</strong></span>
                            <span>Chế độ: ${modeLabel}</span>
                            <span>Đúng: ${item.correct}/${item.total} câu</span>
                            <span>Thời gian: ${escHtml(item.timeSpent)}</span>
                            <span>Nộp lúc: ${formatDateTime(item.createdAt)}</span>
                        </div>
                    </div>
                    <div class="history-item-right">
                        <span class="history-score-badge">${escHtml(item.score)} / 10</span>
                        ${canReview ? `<button type="button" class="btn-history-review" onclick="QuizAuth.handleReviewAttempt('${escHtml(item.courseId)}', '${escHtml(item.id)}')">Xem lại chi tiết</button>` : ''}
                        <button type="button" class="btn-history-del" onclick="QuizAuth.handleRemoveAttempt('${escHtml(item.id)}')">Xóa</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function handleReviewAttempt(courseId, attemptId) {
        closeAccountModal('account-history-modal');
        if (currentPageId === courseId && window.Quiz && typeof window.Quiz.reviewAttempt === 'function') {
            window.Quiz.reviewAttempt(attemptId);
        } else {
            window.location.href = `${courseId}.html?review=${encodeURIComponent(attemptId)}`;
        }
    }

    async function handleRemoveAttempt(attemptId) {
        if (!confirm('Bạn có chắc chắn muốn xóa kết quả bài làm này khỏi lịch sử?')) return;
        await deleteAttempt(attemptId);
        renderHistoryModalList();
    }

    function openProfileModal() {
        closeUserDropdown();
        ensureAccountModalsMounted();
        const user = getCurrentUser();
        if (!user) return;
        const stats = getUserStats();
        refreshNavbarUserUI();

        setTxt('prof-stat-count', `${stats.count} bài`);
        setTxt('prof-stat-avg', `${stats.avg} / 10`);
        setTxt('prof-stat-best', `${stats.best} / 10`);
        setTxt('prof-stat-courses', `${stats.coursesPracticed} / ${getAllCourses().length} môn`);

        $('prof-input-displayname').value = user.displayName || '';
        $('prof-input-username').value = user.username || '';
        $('prof-msg-error').style.display = 'none';
        $('prof-msg-success').style.display = 'none';
        $('account-profile-modal').style.display = 'flex';
    }

    function openPasswordModal() {
        closeUserDropdown();
        ensureAccountModalsMounted();
        const user = getCurrentUser();
        if (!user) return;
        setTxt('pwd-modal-username', '@' + user.username);
        $('pwd-current').value = '';
        $('pwd-new').value = '';
        $('pwd-confirm').value = '';
        $('pwd-msg-error').style.display = 'none';
        $('pwd-msg-success').style.display = 'none';
        $('account-password-modal').style.display = 'flex';
    }

    function switchToPasswordModal() {
        closeAccountModal('account-profile-modal');
        openPasswordModal();
    }

    function closeAccountModal(id) {
        const el = $(id);
        if (el) el.style.display = 'none';
    }

    async function submitProfileUpdate() {
        const errEl = $('prof-msg-error');
        const sucEl = $('prof-msg-success');
        const btn = $('btn-save-profile');
        errEl.style.display = 'none';
        sucEl.style.display = 'none';

        btn.disabled = true;
        btn.textContent = 'Đang lưu...';
        const res = await updateProfile($('prof-input-displayname').value);
        btn.disabled = false;
        btn.textContent = 'Lưu thay đổi';

        const target = res.ok ? sucEl : errEl;
        target.textContent = res.message;
        target.style.display = 'block';
    }

    async function submitPasswordChange() {
        const errEl = $('pwd-msg-error');
        const sucEl = $('pwd-msg-success');
        const btn = $('btn-save-password');
        errEl.style.display = 'none';
        sucEl.style.display = 'none';

        btn.disabled = true;
        btn.textContent = 'Đang cập nhật...';
        const res = await changePassword($('pwd-current').value, $('pwd-new').value, $('pwd-confirm').value);
        btn.disabled = false;
        btn.textContent = 'Cập nhật mật khẩu mới';

        if (res.ok) {
            sucEl.textContent = res.message;
            sucEl.style.display = 'block';
            $('pwd-current').value = '';
            $('pwd-new').value = '';
            $('pwd-confirm').value = '';
        } else {
            errEl.textContent = res.message;
            errEl.style.display = 'block';
        }
    }

    // ---------- Admin Activity & Statistics Dashboard ----------
    let adminCache = {
        users: [],
        allAttempts: [],
        attemptMap: {}
    };

    async function fetchAdminSystemData() {
        const usersMap = {};
        const historiesMap = {};

        // 1. Seed with local users & histories as fallback
        const localUsers = getLocalCustomUsers();
        Object.keys(localUsers).forEach(u => {
            usersMap[u] = localUsers[u];
            const h = getLocalHistory(u);
            if (Array.isArray(h) && h.length > 0) {
                historiesMap[u] = h;
            }
        });

        // 2. Fetch full cloud database snapshot if Firebase is configured
        const cfg = window.CLOUD_CONFIG || {};
        const fbBase = (cfg.firebaseDatabaseURL || '').trim().replace(/\/+$/, '');
        if (fbBase) {
            try {
                const res = await fetch(`${fbBase}/.json`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && typeof data === 'object') {
                        Object.keys(data).forEach(key => {
                            if (key.startsWith('user_') && data[key] && typeof data[key] === 'object') {
                                const u = normalizeUser(key.slice(5));
                                usersMap[u] = { ...(usersMap[u] || {}), ...data[key], username: u };
                            } else if (key.startsWith('history_') && Array.isArray(data[key])) {
                                const u = normalizeUser(key.slice(8));
                                const existing = historiesMap[u] || [];
                                historiesMap[u] = mergeHistories(existing, data[key]);
                            }
                        });
                    }
                }
            } catch (e) {}
        }

        // 3. Ensure every user who has history also appears in usersMap
        Object.keys(historiesMap).forEach(u => {
            if (!usersMap[u]) {
                usersMap[u] = {
                    username: u,
                    displayName: u,
                    role: u === 'admin' ? 'Quản trị viên' : 'Sinh viên HNUE',
                    createdAt: ''
                };
            }
        });

        const allCourses = getAllCourses();
        const courseTitleMap = {};
        allCourses.forEach(c => { courseTitleMap[c.id] = c.title; });

        const usersList = [];
        const allAttempts = [];
        const attemptMap = {};

        Object.keys(usersMap).forEach(u => {
            const uObj = usersMap[u];
            const attempts = (historiesMap[u] || []).filter(Boolean);
            const st = calcStats(attempts);

            const courseBreakdown = {};
            let latestAttemptAt = '';
            attempts.forEach(att => {
                const cTitle = att.courseTitle || courseTitleMap[att.courseId] || att.courseId || 'Khác';
                courseBreakdown[cTitle] = (courseBreakdown[cTitle] || 0) + 1;
                if (att.createdAt && (!latestAttemptAt || new Date(att.createdAt) > new Date(latestAttemptAt))) {
                    latestAttemptAt = att.createdAt;
                }
                const enriched = {
                    ...att,
                    username: u,
                    userDisplayName: uObj.displayName || u,
                    userRole: u === 'admin' ? 'Quản trị viên' : (uObj.role || 'Sinh viên HNUE')
                };
                allAttempts.push(enriched);
                if (enriched.id) {
                    attemptMap[enriched.id] = enriched;
                }
            });

            const timestamps = [uObj.lastActiveAt, latestAttemptAt, uObj.updatedAt, uObj.createdAt]
                .filter(Boolean)
                .map(t => new Date(t).getTime())
                .filter(t => !isNaN(t));
            const lastActiveMs = timestamps.length > 0 ? Math.max(...timestamps) : 0;

            usersList.push({
                username: u,
                displayName: uObj.displayName || u,
                role: u === 'admin' ? 'Quản trị viên' : (uObj.role || 'Sinh viên HNUE'),
                createdAt: uObj.createdAt || '',
                lastActiveAt: lastActiveMs > 0 ? new Date(lastActiveMs).toISOString() : '',
                lastActiveMs,
                count: st.count,
                avg: st.avg,
                avgNum: Number(st.avg) || 0,
                best: st.best,
                bestNum: Number(st.best) || 0,
                coursesPracticed: st.coursesPracticed,
                courseBreakdown
            });
        });

        allAttempts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        adminCache = {
            users: usersList,
            allAttempts,
            attemptMap
        };
        return adminCache;
    }

    async function openAdminModal() {
        const user = getCurrentUser();
        if (!isAdmin(user)) return;
        closeUserDropdown();
        ensureAccountModalsMounted();
        $('account-admin-modal').style.display = 'flex';
        await refreshAdminData();
    }

    async function refreshAdminData() {
        const statusEl = $('admin-sync-status');
        const refreshBtn = $('btn-admin-refresh');
        if (statusEl) statusEl.textContent = 'Đang tải dữ liệu hoạt động từ hệ thống đám mây...';
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.textContent = 'Đang đồng bộ...';
        }

        const data = await fetchAdminSystemData();
        const totalUsers = data.users.length;
        const activeUsers = data.users.filter(u => u.count > 0).length;
        const totalAttempts = data.allAttempts.length;
        const sysStats = calcStats(data.allAttempts);

        setTxt('admin-kpi-users', `${totalUsers} tài khoản`);
        setTxt('admin-kpi-active-users', `${activeUsers} / ${totalUsers}`);
        setTxt('admin-kpi-attempts', `${totalAttempts} lượt`);
        setTxt('admin-kpi-avg-score', `${sysStats.avg} / 10`);

        // Populate user filter dropdown in Attempts tab
        const userSelect = $('admin-attempt-user-filter');
        if (userSelect) {
            const prevVal = userSelect.value || 'all';
            const sortedForDropdown = [...data.users].sort((a, b) => b.count - a.count || a.username.localeCompare(b.username));
            userSelect.innerHTML = `<option value="all">Tất cả người dùng (${totalUsers})</option>` +
                sortedForDropdown.map(u => `<option value="${escHtml(u.username)}">${escHtml(u.displayName)} (@${escHtml(u.username)}) - ${u.count} bài</option>`).join('');
            if (sortedForDropdown.some(u => u.username === prevVal)) {
                userSelect.value = prevVal;
            }
        }

        renderAdminUsersList();
        renderAdminAttemptsList();

        if (statusEl) {
            statusEl.textContent = `Cập nhật lúc ${formatDateTime(new Date().toISOString())} • Đã đồng bộ ${totalUsers} tài khoản và ${totalAttempts} bài làm`;
        }
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.textContent = 'Làm mới dữ liệu';
        }
    }

    function switchAdminTab(tab) {
        const isUsers = tab === 'users';
        const btnUsers = $('admin-tab-btn-users');
        const btnAttempts = $('admin-tab-btn-attempts');
        const panelUsers = $('admin-panel-users');
        const panelAttempts = $('admin-panel-attempts');

        if (btnUsers) btnUsers.classList.toggle('active', isUsers);
        if (btnAttempts) btnAttempts.classList.toggle('active', !isUsers);
        if (panelUsers) panelUsers.style.display = isUsers ? 'block' : 'none';
        if (panelAttempts) panelAttempts.style.display = isUsers ? 'none' : 'block';
    }

    function renderAdminUsersList() {
        const container = $('admin-users-list');
        if (!container) return;

        const q = (($('admin-user-search') && $('admin-user-search').value) || '').trim().toLowerCase();
        const statusFilter = ($('admin-user-filter') && $('admin-user-filter').value) || 'all';
        const sortBy = ($('admin-user-sort') && $('admin-user-sort').value) || 'recent';

        let list = [...adminCache.users];
        if (q) {
            list = list.filter(u =>
                u.username.toLowerCase().includes(q) ||
                u.displayName.toLowerCase().includes(q)
            );
        }
        if (statusFilter === 'active') {
            list = list.filter(u => u.count > 0);
        } else if (statusFilter === 'inactive') {
            list = list.filter(u => u.count === 0);
        }

        list.sort((a, b) => {
            if (sortBy === 'attempts') return b.count - a.count || b.lastActiveMs - a.lastActiveMs;
            if (sortBy === 'avg') return b.avgNum - a.avgNum || b.count - a.count;
            if (sortBy === 'best') return b.bestNum - a.bestNum || b.count - a.count;
            return b.lastActiveMs - a.lastActiveMs || b.count - a.count;
        });

        if (list.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding: 32px 16px;">Không tìm thấy tài khoản nào phù hợp với bộ lọc.</div>';
            return;
        }

        container.innerHTML = list.map(u => {
            const breakdownEntries = Object.entries(u.courseBreakdown || {});
            const breakdownHtml = breakdownEntries.length > 0
                ? `<div class="admin-course-tags">${breakdownEntries.map(([cName, cnt]) => `<span class="admin-course-tag">${escHtml(cName)}: <strong>${cnt} bài</strong></span>`).join('')}</div>`
                : `<div class="admin-course-tags"><span class="admin-course-tag admin-course-tag-muted">Chưa có bài làm nào</span></div>`;

            return `
                <div class="history-item admin-user-item">
                    <div class="history-item-main">
                        <div class="admin-user-header">
                            <span class="avatar-circle avatar-circle-sm">${escHtml(getInitials(u.displayName))}</span>
                            <span class="history-item-title">${escHtml(u.displayName)}</span>
                            <span class="admin-username-badge">@${escHtml(u.username)}</span>
                            <span class="admin-role-badge${u.username === 'admin' ? ' is-admin' : ''}">${escHtml(u.role)}</span>
                        </div>
                        <div class="history-item-sub">
                            <span>Đã làm: <strong>${u.count} bài</strong></span>
                            <span>Điểm TB: <strong>${u.avg} / 10</strong></span>
                            <span>Cao nhất: <strong>${u.best} / 10</strong></span>
                            <span>Số môn đã ôn: <strong>${u.coursesPracticed} môn</strong></span>
                            <span>Hoạt động gần nhất: <strong>${u.lastActiveAt ? formatDateTime(u.lastActiveAt) : 'Chưa ghi nhận'}</strong></span>
                        </div>
                        ${breakdownHtml}
                    </div>
                    <div class="history-item-right">
                        <span class="history-score-badge">${u.count} bài</span>
                        ${u.count > 0 ? `<button type="button" class="btn-history-review" onclick="QuizAuth.inspectUserAttempts('${escHtml(u.username)}')">Xem lịch sử (${u.count})</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderAdminAttemptsList() {
        const container = $('admin-attempts-list');
        if (!container) return;

        const userVal = ($('admin-attempt-user-filter') && $('admin-attempt-user-filter').value) || 'all';
        const courseVal = ($('admin-attempt-course-filter') && $('admin-attempt-course-filter').value) || 'all';
        const modeVal = ($('admin-attempt-mode-filter') && $('admin-attempt-mode-filter').value) || 'all';

        let list = [...adminCache.allAttempts];
        if (userVal !== 'all') {
            list = list.filter(item => item.username === userVal);
        }
        if (courseVal !== 'all') {
            list = list.filter(item => item.courseId === courseVal);
        }
        if (modeVal !== 'all') {
            list = list.filter(item => item.mode === modeVal);
        }

        if (list.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding: 32px 16px;">Chưa có lượt làm bài nào khớp với bộ lọc hiện tại.</div>';
            return;
        }

        container.innerHTML = list.map(item => {
            const modeLabel = item.mode === 'test' ? 'Thi thử' : 'Luyện tập';
            const canReview = Array.isArray(item.records) && item.records.length > 0 && item.courseId && item.id;
            return `
                <div class="history-item">
                    <div class="history-item-main">
                        <div class="admin-user-header">
                            <span class="admin-username-badge">@${escHtml(item.username)}</span>
                            <span class="admin-attempt-user">${escHtml(item.userDisplayName)}</span>
                            <span>•</span>
                            <span class="history-item-title">${escHtml(item.title)}</span>
                        </div>
                        <div class="history-item-sub">
                            <span>Học phần: <strong>${escHtml(item.courseTitle || item.courseId)}</strong></span>
                            <span>Chế độ: <strong>${modeLabel}</strong></span>
                            <span>Kết quả: <strong>${item.correct}/${item.total} câu</strong></span>
                            <span>Thời gian: ${escHtml(item.timeSpent)}</span>
                            <span>Nộp lúc: ${formatDateTime(item.createdAt)}</span>
                        </div>
                    </div>
                    <div class="history-item-right">
                        <span class="history-score-badge">${escHtml(item.score)} / 10</span>
                        ${canReview ? `<button type="button" class="btn-history-review" onclick="QuizAuth.handleAdminReviewAttempt('${escHtml(item.courseId)}', '${escHtml(item.id)}')">Xem bài làm</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    function inspectUserAttempts(username) {
        const userSelect = $('admin-attempt-user-filter');
        if (userSelect) {
            userSelect.value = username;
        }
        switchAdminTab('attempts');
        renderAdminAttemptsList();
    }

    function handleAdminReviewAttempt(courseId, attemptId) {
        const record = adminCache.attemptMap[attemptId];
        if (record) {
            try {
                sessionStorage.setItem('hnue_admin_review_attempt', JSON.stringify(record));
            } catch (e) {}
        }
        closeAccountModal('account-admin-modal');
        if (currentPageId === courseId && window.Quiz && typeof window.Quiz.reviewAttempt === 'function') {
            window.Quiz.reviewAttempt(attemptId);
        } else {
            window.location.href = `${courseId}.html?review=${encodeURIComponent(attemptId)}`;
        }
    }

    document.addEventListener('click', e => {
        const wrap = $('user-menu-wrap');
        if (wrap && !wrap.contains(e.target)) closeUserDropdown();
        if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
            e.target.style.display = 'none';
        }
    });

    window.QuizAuth = {
        COURSE_CATALOG,
        escHtml,
        getAllCourses,
        getInitials,
        getCloudMode,
        getCurrentUser,
        isAdmin,
        requireAuth,
        login,
        register,
        updateProfile,
        changePassword,
        logout,
        saveAttempt,
        getHistory,
        getAttemptById,
        deleteAttempt,
        getUserStats,
        syncHistoryFromCloud,
        formatDateTime,
        buildNavbarHtml,
        mountNavbar,
        refreshNavbarUserUI,
        refreshNavbarHistoryCount,
        toggleUserDropdown,
        closeUserDropdown,
        openHistoryModal,
        renderHistoryModalList,
        handleReviewAttempt,
        handleRemoveAttempt,
        openProfileModal,
        openPasswordModal,
        switchToPasswordModal,
        closeAccountModal,
        submitProfileUpdate,
        submitPasswordChange,
        openAdminModal,
        refreshAdminData,
        switchAdminTab,
        renderAdminUsersList,
        renderAdminAttemptsList,
        inspectUserAttempts,
        handleAdminReviewAttempt
    };
})();
