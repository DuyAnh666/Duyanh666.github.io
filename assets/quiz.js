/*
 * Quiz engine dung chung cho tat ca khoa hoc.
 * Doc cau hinh tu window.COURSE (courses/<id>.js) va du lieu tu window.QUESTIONS (data/<id>.js).
 */
(function () {
    'use strict';

    if (window.QuizAuth) {
        if (!QuizAuth.requireAuth()) return;
    } else if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    const COURSE_ID = (window.location.pathname.split('/').pop() || '')
        .replace(/\.html.*$/i, '')
        .toLowerCase();
    const C = window.COURSE;
    const ALL = window.QUESTIONS;
    const TOPICS = C.topics || [];
    const EXAM = C.exam;
    const QUESTION_SETS = Array.isArray(C.questionSets) ? C.questionSets : null;
    const SUBTITLE = C.subtitle || 'Hệ thống trắc nghiệm ôn tập và thi thử chuẩn Đại học Sư phạm Hà Nội';
    const UNIT = C.unit || 'chương';
    const UNIT_CAP = UNIT.charAt(0).toUpperCase() + UNIT.slice(1);
    const TOPIC_MINUTES = C.topicMinutes || (n => (n <= 30 ? 25 : 40));
    const FEEDBACK_INFO = C.feedbackInfo || ((q, topic) => `${UNIT_CAP}: ${topic ? topic.title : ''}`);

    const FILTERS = (C.filters || [
        {
            id: 'chapter',
            label: UNIT_CAP,
            target: 'topic',
            field: 'id',
            all: `Tất cả các ${UNIT}`
        }
    ]).map(f => {
        if (f.options) return f;
        const seen = new Set();
        const options = [];
        TOPICS.forEach(t => {
            const val = t[f.field || 'id'];
            if (!val || seen.has(val)) return;
            seen.add(val);
            const label = t.shortTitle || (t.title.includes(':') ? t.title.split(':')[0].trim() : t.title);
            options.push({ value: val, label });
        });
        return { ...f, options };
    });

    // ---------- Helpers ----------
    const $ = id => document.getElementById(id);
    const show = (id, display) => {
        const el = $(id);
        if (el) el.style.display = display;
    };
    const pad = n => String(n).padStart(2, '0');
    const fmtTime = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    const isGraded = q => Number.isInteger(q.correctIndex);
    const esc = (window.QuizAuth && QuizAuth.escHtml)
        ? QuizAuth.escHtml
        : (s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));

    function stripSourcePrefix(text) {
        if (!text) return '';
        let cleaned = text.replace(/^(?:(?:câu|câu hỏi|question)\s*\d+[^:\.\n]*[:\.\-]\s*|\d+[\.:]\s*)/i, '').trim();
        cleaned = cleaned.replace(/^(?:\((?:nhận biết|thông hiểu|vận dụng|nb|th|vd)\)|\[(?:nhận biết|thông hiểu|vận dụng|nb|th|vd)\])\s*[:\.\-]?\s*/i, '').trim();
        if (!cleaned) return text;
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    function stripOptionLabel(text) {
        if (!text) return '';
        return String(text).replace(/^[A-Da-d][\.\:\)]\s*/, '').trim();
    }

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ---------- State ----------
    let quiz = [];
    let idx = 0;
    let answers = [];
    let flags = [];
    let mode = 'practice'; // 'practice' | 'test'
    let reviewing = false;
    let reviewFilter = 'all';
    let timer = null;
    let remaining = 0;
    let initial = 0;
    let pending = null;
    let pendingContext = null; // { type: 'exam' | 'topic', topicId, selectedMode, activeSet }

    // ---------- Filters ----------
    function filterValues() {
        const v = {};
        FILTERS.forEach(f => { v[f.id] = $('filter-' + f.id).value; });
        return v;
    }

    function getActiveQuestionSet(vals) {
        if (!QUESTION_SETS || QUESTION_SETS.length === 0) return null;
        const filterSetVal = vals && vals.set;
        if (filterSetVal && filterSetVal !== 'all') return filterSetVal;
        return QUESTION_SETS[0].value;
    }

    function matchQuestion(q, f, val) {
        return val === 'all' || q[f.field] === val || (f.listField && (q[f.listField] || []).includes(val));
    }

    function applyQuestionFilters(qs, vals, onlyIds) {
        return FILTERS
            .filter(f => f.target === 'question' && (!onlyIds || onlyIds.includes(f.id)))
            .reduce((acc, f) => acc.filter(q => matchQuestion(q, f, vals[f.id])), qs);
    }

    function topicVisible(topic, vals) {
        return FILTERS.every(f => f.target !== 'topic' || vals[f.id] === 'all' || topic[f.field] === vals[f.id]);
    }

    function hasActiveQuestionFilter(vals) {
        return FILTERS.some(f => f.target === 'question' && vals[f.id] !== 'all');
    }

    function filterHtml(f) {
        const defaultVal = f.defaultValue || 'all';
        const options = [{ value: 'all', label: f.all }, ...f.options].map(o => {
            let label = o.label;
            if (f.showCount) {
                const n = o.value === 'all' ? ALL.length : ALL.filter(q => matchQuestion(q, f, o.value)).length;
                label += ` (${n} câu)`;
            }
            const sel = o.value === defaultVal ? ' selected' : '';
            return `<option value="${esc(o.value)}"${sel}>${esc(label)}</option>`;
        }).join('');
        return `
            <div class="filter-group">
                <span class="filter-label">${f.label}:</span>
                <select id="filter-${f.id}" class="filter-select" onchange="Quiz.applyFilters()">${options}</select>
            </div>`;
    }

    // ---------- Page skeleton ----------
    function renderApp() {
        document.title = `${C.title} - Ôn tập HNUE`;
        const bannerDesc = (C.banner && C.banner.desc) || '';
        $('app').innerHTML = `
    <div id="course-navbar-root"></div>

    <div class="course-subbanner">
        <div class="course-subbanner-inner">
            <div class="course-subbanner-left">
                <div class="course-breadcrumb">
                    <a href="home.html">Trang chủ</a>
                    <span>/</span>
                    <span>${esc(C.title)}</span>
                </div>
                <h1>${C.title}</h1>
                <div class="brand-subtitle">${SUBTITLE}</div>
            </div>
            <div class="course-subbanner-right">
                <span class="course-header-meta">Đề chuẩn: ${EXAM.total} câu / ${EXAM.minutes} phút</span>
                <a href="home.html" class="back-home">Danh mục học phần</a>
            </div>
        </div>
    </div>

    <div id="main-app">
        <div id="topics-view" class="content-container">
            <div class="exam-banner-card">
                <div class="exam-banner-info">
                    <span class="exam-banner-eyebrow">Đề thi thử tổng hợp</span>
                    <h2>${EXAM.title}</h2>
                    <p>${bannerDesc}</p>
                    <div class="exam-banner-specs">
                        <span class="exam-spec-pill">Số lượng: ${EXAM.total} câu hỏi</span>
                        <span class="exam-spec-pill">Thời gian: ${EXAM.minutes} phút</span>
                        <span class="exam-spec-pill">Chấm điểm: Thang điểm 10</span>
                    </div>
                </div>
                <div>
                    <button class="btn-exam-start" onclick="Quiz.promptExam()">Bắt đầu thi thử</button>
                </div>
            </div>

            <div class="filters-panel">
                <div class="filters-row">
                    ${FILTERS.map(filterHtml).join('')}
                    <div class="filter-group filter-group-search">
                        <input type="text" id="search-input" class="filter-search" placeholder="Tìm kiếm nội dung chủ đề..." oninput="Quiz.applyFilters()">
                    </div>
                    <button type="button" class="btn-history" id="btn-course-history" onclick="Quiz.openHistory()">Lịch sử môn này (0)</button>
                    <div class="filter-counter" id="filter-counter"></div>
                </div>
            </div>

            <div class="topics-grid" id="topics-grid"></div>
        </div>

        <div id="quiz-section">
            <div class="quiz-topbar">
                <div class="topbar-left">
                    <span class="quiz-mode-badge" id="quiz-mode-badge">Luyện tập</span>
                    <span id="quiz-topic-title" class="quiz-topic-heading"></span>
                </div>
                <div class="topbar-right">
                    <span class="badge-timer" id="quiz-timer" style="display: none;">00:00</span>
                    <button class="btn-exit-quiz" onclick="Quiz.exit()">Thoát bài làm</button>
                </div>
            </div>

            <div class="quiz-layout">
                <div class="quiz-main-column">
                    <div class="question-card">
                        <div class="q-progress-track">
                            <div class="q-progress-fill" id="q-progress-fill"></div>
                        </div>
                        <div class="q-meta">
                            <div class="q-meta-left">
                                <span class="q-index" id="q-index-text"></span>
                                <span class="q-tag-meta" id="q-tag-meta" style="display: none;"></span>
                            </div>
                            <button class="btn-flag" id="btn-flag" onclick="Quiz.toggleFlag()">Đặt cờ xem lại</button>
                        </div>
                        <div class="q-text" id="q-text"></div>
                        <div class="options-list" id="options-list"></div>
                        <div class="practice-feedback" id="practice-feedback"></div>
                        <div class="q-nav-actions">
                            <button class="btn-nav btn-prev" id="btn-prev" onclick="Quiz.nav(-1)">Câu trước</button>
                            <button class="btn-submit-quiz" id="btn-submit" onclick="Quiz.submit(false)">Nộp bài</button>
                            <button class="btn-nav btn-next" id="btn-next" onclick="Quiz.nav(1)">Câu tiếp</button>
                        </div>
                    </div>
                </div>

                <div class="quiz-side-column">
                    <div class="side-header">
                        <div class="side-title">Bảng câu hỏi</div>
                        <div class="side-progress" id="side-progress"></div>
                    </div>
                    <div class="review-filter-bar" id="review-filters" style="display: none;">
                        <button class="review-pill active" onclick="Quiz.setReviewFilter('all', this)">Tất cả</button>
                        <button class="review-pill" onclick="Quiz.setReviewFilter('correct', this)">Đúng</button>
                        <button class="review-pill" onclick="Quiz.setReviewFilter('incorrect', this)">Sai / Chưa làm</button>
                        <button class="review-pill" onclick="Quiz.setReviewFilter('flagged', this)">Có cờ</button>
                    </div>
                    <div class="palette-grid" id="palette-grid"></div>
                    <div class="side-legend">
                        <div class="legend-row"><div class="legend-dot" style="background: #eff6ff; border: 1px solid #93c5fd;"></div><span>Đã chọn đáp án</span></div>
                        <div class="legend-row"><div class="legend-dot" style="background: #ffffff; border: 1px solid #cbd5e1;"></div><span>Chưa trả lời</span></div>
                        <div class="legend-row"><div class="legend-dot" style="background: #f59e0b;"></div><span>Đã đặt cờ xem lại</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <footer class="site-footer">
        <div>Hệ thống Ôn tập và Thi thử Trực tuyến — Trường Đại học Sư phạm Hà Nội</div>
        <div class="site-footer-sub">Monlabs - FIT - SMCS - HNUE</div>
    </footer>

    <div class="modal-overlay" id="start-modal">
        <div class="modal-content">
            <h3 class="modal-title" id="start-modal-title"></h3>
            <div id="start-modal-sets" class="modal-set-picker" style="display: none;"></div>
            <p class="modal-desc" id="start-modal-desc"></p>
            <div class="modal-actions">
                <button class="btn-modal-primary" id="btn-start-action" onclick="Quiz.confirmStart()">Bắt đầu làm bài</button>
                <button class="btn-modal-secondary" onclick="Quiz.closeModal('start-modal')">Hủy bỏ</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="result-modal">
        <div class="modal-content">
            <h3 class="modal-title">Kết quả bài làm</h3>
            <div class="modal-score" id="res-score"></div>
            <div class="modal-stats">
                <div class="modal-stats-row"><span>Số câu trả lời đúng:</span><span class="modal-stats-val" id="res-correct" style="color: var(--success);"></span></div>
                <div class="modal-stats-row"><span>Số câu sai / chưa làm:</span><span class="modal-stats-val" id="res-incorrect" style="color: var(--danger);"></span></div>
                <div class="modal-stats-row"><span>Tổng số câu hỏi:</span><span class="modal-stats-val" id="res-total"></span></div>
                <div class="modal-stats-row"><span>Thời gian hoàn thành:</span><span class="modal-stats-val" id="res-time"></span></div>
                ${C.levelStats ? `
                <div class="level-stats-box">
                    <div class="level-stat-col"><div class="level-stat-label">Nhận biết (NB)</div><div class="level-stat-value" id="res-NB"></div></div>
                    <div class="level-stat-col"><div class="level-stat-label">Thông hiểu (TH)</div><div class="level-stat-value" id="res-TH"></div></div>
                    <div class="level-stat-col"><div class="level-stat-label">Vận dụng (VD)</div><div class="level-stat-value" id="res-VD"></div></div>
                </div>` : ''}
            </div>
            <div class="modal-actions">
                <button class="btn-modal-primary" onclick="Quiz.enterReview()">Xem lại chi tiết bài làm</button>
                <button class="btn-modal-secondary" onclick="Quiz.restart()">Làm lại đề này</button>
                <button class="btn-modal-secondary" onclick="Quiz.toTopics()">Về danh sách ${UNIT}</button>
            </div>
        </div>
    </div>`;
    }

    // ---------- Topics view ----------
    function examPool(vals) {
        let pool = applyQuestionFilters(ALL, vals, EXAM.poolFilters || []);
        if (EXAM.gradedOnly) pool = pool.filter(isGraded);
        return pool;
    }

    function updateCourseHistoryBtn() {
        if (window.QuizAuth && QuizAuth.refreshNavbarHistoryCount) {
            QuizAuth.refreshNavbarHistoryCount();
        }
    }

    function renderTopics() {
        const vals = filterValues();
        const search = $('search-input').value.trim().toLowerCase();
        const strictCount = hasActiveQuestionFilter(vals);
        let visible = 0, total = 0;

        const html = TOPICS.map(topic => {
            if (!topicVisible(topic, vals)) return '';
            if (search && !topic.title.toLowerCase().includes(search) && !topic.desc.toLowerCase().includes(search)) return '';

            const qs = applyQuestionFilters(ALL.filter(q => q.category === topic.id), vals);
            if (qs.length === 0 && strictCount) return '';

            visible++;
            total += qs.length;

            return `
                <div class="topic-card">
                    <div class="card-body">
                        <h3 class="topic-title">${topic.title}</h3>
                        <p class="topic-desc">${topic.desc}</p>
                    </div>
                    <div class="topic-footer">
                        <span class="topic-count">${qs.length} câu hỏi</span>
                        <div class="topic-actions">
                            <button class="btn-topic-practice" onclick="Quiz.promptTopic('${topic.id}', 'practice')">Luyện tập</button>
                            <button class="btn-topic-test" onclick="Quiz.promptTopic('${topic.id}', 'test')">Thi thử</button>
                        </div>
                    </div>
                </div>`;
        }).join('');

        $('topics-grid').innerHTML = html ||
            '<div class="empty-state">Chưa có câu hỏi hoặc chủ đề phù hợp với điều kiện lọc hiện tại.</div>';
        $('filter-counter').textContent = `Hiển thị ${visible} ${UNIT} (${total} câu hỏi)`;
        updateCourseHistoryBtn();
    }

    // ---------- Start modal & Independent Question Set Picker ----------
    function renderModalSetPicker() {
        const box = $('start-modal-sets');
        if (!box) return;
        if (!QUESTION_SETS || QUESTION_SETS.length === 0 || !pendingContext) {
            box.style.display = 'none';
            box.innerHTML = '';
            return;
        }

        const activeSet = pendingContext.activeSet;
        const buttonsHtml = QUESTION_SETS.map(s => {
            let count = 0;
            if (pendingContext.type === 'topic') {
                count = ALL.filter(q => q.category === pendingContext.topicId && q.set === s.value).length;
            } else {
                count = ALL.filter(q => q.set === s.value).length;
            }
            const label = s.label.replace(/\s*\(\d+\s*câu\)/i, '') + ` (${count} câu)`;
            return `
                <button type="button" class="modal-set-btn${s.value === activeSet ? ' active' : ''}" onclick="Quiz.selectQuestionSet('${esc(s.value)}')">
                    ${esc(label)}
                </button>`;
        }).join('');

        box.innerHTML = `
            <div class="modal-set-label">Chọn bộ câu hỏi (tách biệt độc lập):</div>
            <div class="modal-set-buttons">${buttonsHtml}</div>
        `;
        box.style.display = 'block';
    }

    function openStartModal(title, desc, btnText) {
        $('start-modal-title').textContent = title;
        $('start-modal-desc').textContent = desc;
        $('btn-start-action').textContent = btnText;
        renderModalSetPicker();
        show('start-modal', 'flex');
    }

    function selectQuestionSet(setVal) {
        if (!pendingContext) return;
        pendingContext.activeSet = setVal;
        if ($('filter-set')) {
            $('filter-set').value = setVal;
            renderTopics();
        }
        if (pendingContext.type === 'exam') {
            prepareExamSession(setVal);
        } else if (pendingContext.type === 'topic') {
            prepareTopicSession(pendingContext.topicId, pendingContext.selectedMode, setVal);
        }
    }

    function prepareTopicSession(topicId, selectedMode, forcedSet) {
        const topic = TOPICS.find(t => t.id === topicId);
        if (!topic) return;

        const vals = { ...filterValues() };
        const activeSet = forcedSet || getActiveQuestionSet(vals);
        if (activeSet) vals.set = activeSet;

        pendingContext = { type: 'topic', topicId, selectedMode, activeSet };

        let qs = applyQuestionFilters(ALL.filter(q => q.category === topicId), vals);
        if (selectedMode === 'test') {
            const graded = qs.filter(isGraded);
            if (graded.length > 0) qs = graded;
        }
        if (qs.length === 0) {
            alert('Chưa có câu hỏi trong mục này theo bộ lọc hiện tại.');
            return;
        }

        const setObj = QUESTION_SETS ? QUESTION_SETS.find(s => s.value === activeSet) : null;
        const setSuffix = setObj ? ` — ${setObj.label.replace(/\s*\(\d+\s*câu\)/i, '')}` : '';
        const minutes = selectedMode === 'test' ? TOPIC_MINUTES(qs.length) : 0;
        pending = {
            title: topic.title + setSuffix,
            questions: selectedMode === 'test' ? shuffle(qs) : qs,
            mode: selectedMode,
            timeMinutes: minutes
        };

        if (selectedMode === 'practice') {
            openStartModal(
                topic.title,
                `${UNIT_CAP} gồm ${qs.length} câu hỏi${setSuffix}. Chế độ luyện tập không giới hạn thời gian và hiển thị đáp án ngay sau mỗi câu trả lời.`,
                'Bắt đầu luyện tập');
        } else {
            openStartModal(
                topic.title,
                `${UNIT_CAP} gồm ${qs.length} câu hỏi${setSuffix}. Thời gian làm bài ${minutes} phút, hệ thống chấm điểm theo thang điểm 10 sau khi nộp bài.`,
                'Bắt đầu làm bài thi');
        }
    }

    function promptTopic(topicId, selectedMode) {
        prepareTopicSession(topicId, selectedMode, null);
    }

    function buildExam(pool) {
        const picked = [];
        const used = new Set();
        Object.entries(EXAM.matrix).forEach(([key, n]) => {
            shuffle(pool.filter(q => q[EXAM.by] === key)).slice(0, n).forEach(q => { picked.push(q); used.add(q); });
        });
        if (picked.length < EXAM.total) {
            shuffle(pool.filter(q => !used.has(q))).slice(0, EXAM.total - picked.length).forEach(q => picked.push(q));
        }
        return shuffle(picked).slice(0, EXAM.total);
    }

    function prepareExamSession(forcedSet) {
        const vals = { ...filterValues() };
        const activeSet = forcedSet || getActiveQuestionSet(vals);
        if (activeSet) vals.set = activeSet;

        pendingContext = { type: 'exam', activeSet };

        const pool = examPool(vals);
        if (pool.length === 0) {
            alert('Chưa có dữ liệu câu hỏi trong ngân hàng đề thi thử của học phần này.');
            return;
        }
        const setObj = QUESTION_SETS ? QUESTION_SETS.find(s => s.value === activeSet) : null;
        const setLabel = setObj ? setObj.label.replace(/\s*\(\d+\s*câu\)/i, '') : '';
        const otherSuffix = (EXAM.poolFilters || [])
            .filter(id => id !== 'set')
            .map(id => vals[id])
            .filter(v => v && v !== 'all');
        const allTags = [setLabel, ...otherSuffix].filter(Boolean);

        pending = {
            title: EXAM.title + (allTags.length ? ` (${allTags.join(', ')})` : ''),
            questions: buildExam(pool),
            mode: 'test',
            timeMinutes: EXAM.minutes
        };
        openStartModal(
            EXAM.title,
            `Đề thi gồm ${EXAM.total} câu hỏi ${EXAM.note}${setLabel ? ` trích xuất độc lập từ ${setLabel}` : ''}. Thời gian làm bài ${EXAM.minutes} phút, tự động nộp bài khi hết giờ và chấm theo thang điểm 10.`,
            'Bắt đầu làm bài thi');
    }

    function promptExam() {
        prepareExamSession(null);
    }

    function closeModal(id) { show(id, 'none'); }

    function confirmStart() {
        closeModal('start-modal');
        if (pending) startSession(pending);
    }

    // ---------- Session ----------
    function startSession(cfg) {
        quiz = cfg.questions;
        idx = 0;
        answers = new Array(quiz.length).fill(null);
        flags = new Array(quiz.length).fill(false);
        mode = cfg.mode;
        reviewing = false;
        reviewFilter = 'all';

        show('topics-view', 'none');
        show('quiz-section', 'block');
        show('review-filters', 'none');
        show('btn-submit', 'inline-block');
        $('btn-submit').textContent = 'Nộp bài';
        $('quiz-mode-badge').textContent = mode === 'test' ? 'Thi thử' : 'Luyện tập';
        $('quiz-topic-title').textContent = cfg.title;

        const badge = $('quiz-timer');
        if (mode === 'test' && cfg.timeMinutes > 0) {
            show('quiz-timer', 'inline-block');
            badge.classList.remove('urgent');
            initial = remaining = cfg.timeMinutes * 60;
            startTimer();
        } else {
            show('quiz-timer', 'none');
            initial = remaining = 0;
            stopTimer();
        }
        loadQuestion(0);
    }

    function startTimer() {
        stopTimer();
        updateTimer();
        timer = setInterval(() => {
            remaining--;
            updateTimer();
            if (remaining <= 0) {
                stopTimer();
                alert('Thời gian làm bài đã kết thúc! Hệ thống sẽ tự động nộp bài.');
                submit(true);
            }
        }, 1000);
    }

    function stopTimer() {
        if (timer) { clearInterval(timer); timer = null; }
    }

    function updateTimer() {
        const el = $('quiz-timer');
        el.textContent = fmtTime(Math.max(remaining, 0));
        el.classList.toggle('urgent', remaining <= 180);
    }

    function analyzeWrongChoice(q, chosenIdx, chosenText, correctLetter, correctText) {
        const stem = stripSourcePrefix(q.question || '');
        const stemLower = stem.toLowerCase();
        const chosenLetter = 'ABCD'[chosenIdx] || '';
        const chosenClean = chosenText.replace(/\.$/, '');
        const correctClean = correctText.replace(/\.$/, '');

        const negMatch = stem.match(/(không đúng|không phải|không thuộc|không phản ánh|ngoại trừ|sai khi nói về)/i);
        if (negMatch) {
            return `Câu hỏi chứa từ khóa phủ định ("${negMatch[1]}"). Phương án ${chosenLetter} ("${chosenClean}") thực chất là một nội dung đúng nên không phải đáp án cần tìm. Phương án không phù hợp / ngoại trừ cần chọn là ${correctLetter} ("${correctClean}").`;
        }

        if (/tất cả các đáp án|tất cả các phương án|cả ba phương án|cả a, b, c|cả a và b|cả b và c|a, b, c đều đúng/i.test(correctClean)) {
            return `Phương án ${chosenLetter} ("${chosenClean}") là một ý đúng nhưng chưa bao quát hết toàn bộ yêu cầu đề bài, vì các phương án còn lại cũng chính xác. Do đó cần chọn ${correctLetter} ("${correctClean}").`;
        }

        if (/tất cả|cả a|cả ba|a và b|b và c/i.test(chosenClean)) {
            return `Phương án ${chosenLetter} ("${chosenClean}") gộp cả nội dung chưa chính xác. Chỉ có duy nhất phương án ${correctLetter} ("${correctClean}") đáp ứng đúng yêu cầu câu hỏi.`;
        }

        const supMatch = stem.match(/(quan trọng nhất|cơ bản nhất|quyết định nhất|chủ yếu nhất|hàng đầu|then chốt|trung tâm|đầu tiên|sâu xa nhất)/i);
        if (supMatch) {
            return `Đề bài hỏi yếu tố "${supMatch[1]}". Phương án ${chosenLetter} ("${chosenClean}") có thể liên quan đến bài học nhưng chưa phản ánh đúng vai trò cốt lõi nhất bằng phương án ${correctLetter} ("${correctClean}").`;
        }

        if (/\d/.test(chosenClean) && /\d/.test(correctClean)) {
            return `Phương án ${chosenLetter} ("${chosenClean}") là mốc thời gian hoặc số liệu gây nhiễu. Dữ kiện chính xác tương ứng với nội dung câu hỏi là ${correctLetter} ("${correctClean}").`;
        }

        return `Phương án ${chosenLetter} ("${chosenClean}") chưa chính xác vì không phản ánh đúng bản chất hoặc đối tượng câu hỏi đề cập. Đáp án đúng là ${correctLetter} ("${correctClean}").`;
    }

    function buildDynamicFeedbackHtml(q, chosenIdx, topic) {
        const ok = chosenIdx === q.correctIndex;
        const unans = chosenIdx === null;
        const correctLetter = 'ABCD'[q.correctIndex] || '';
        const correctText = stripOptionLabel((q.options && q.options[q.correctIndex]) || '');
        const chosenLetter = !unans ? ('ABCD'[chosenIdx] || '') : '';
        const chosenText = !unans ? stripOptionLabel((q.options && q.options[chosenIdx]) || '') : '';
        const explainText = (q.explain || q.explanation || '').trim();
        const sourceMeta = FEEDBACK_INFO(q, topic);

        const titleHtml = ok
            ? `<div class="fb-title is-ok">Chính xác! Phương án đúng là ${correctLetter}</div>`
            : unans
                ? `<div class="fb-title is-bad">Chưa chọn đáp án. Phương án đúng là ${correctLetter}</div>`
                : `<div class="fb-title is-bad">Chưa chính xác (Bạn chọn ${chosenLetter}). Phương án đúng là ${correctLetter}</div>`;

        const analysisHtml = (!ok && !unans)
            ? `<div class="fb-block fb-analysis"><span class="fb-label">Phân tích lựa chọn ${chosenLetter}:</span> ${esc(analyzeWrongChoice(q, chosenIdx, chosenText, correctLetter, correctText))}</div>`
            : '';

        const explainHtml = explainText
            ? `<div class="fb-block fb-explain"><span class="fb-label">Giải thích kiến thức:</span> ${esc(explainText)}</div>`
            : '';

        const metaHtml = sourceMeta
            ? `<div class="fb-meta">${esc(sourceMeta)}</div>`
            : '';

        return `${titleHtml}${analysisHtml}${explainHtml}${metaHtml}`;
    }


    function loadQuestion(i) {
        if (i < 0 || i >= quiz.length) return;
        idx = i;
        const q = quiz[i];
        const topic = TOPICS.find(t => t.id === q.category);

        $('q-index-text').textContent = `Câu ${i + 1} / ${quiz.length}`;
        const tagMeta = $('q-tag-meta');
        const metaParts = [q.setName, q.levelName, q.group].filter(Boolean);
        if (metaParts.length > 0) {
            tagMeta.textContent = metaParts.join(' • ');
            tagMeta.style.display = 'inline-block';
        } else {
            tagMeta.style.display = 'none';
        }

        const cleanText = stripSourcePrefix(q.question);
        const imgHtml = q.image
            ? `<div class="q-image-wrap"><img class="q-image" src="${q.image}" alt="Hình minh họa câu hỏi"></div>`
            : '';
        $('q-text').innerHTML = `<span class="q-num">Câu ${i + 1}.</span> ${esc(cleanText)}${imgHtml}`;

        const flagBtn = $('btn-flag');
        flagBtn.classList.toggle('active', flags[i]);
        flagBtn.textContent = flags[i] ? 'Bỏ cờ đánh dấu' : 'Đặt cờ xem lại';

        const answered = answers[i] !== null;
        const verified = isGraded(q);
        const revealed = verified && (reviewing || (mode === 'practice' && answered));
        const locked = revealed;

        $('options-list').innerHTML = q.options.map((text, k) => {
            const selected = answers[i] === k;
            let cl = 'option-item' + (selected ? ' selected' : '');
            if (locked) cl += ' locked';
            if (revealed) {
                if (k === q.correctIndex) cl += ' correct';
                else if (selected) cl += ' incorrect';
            }
            const letter = 'ABCD'[k] || String(k + 1);
            const body = stripOptionLabel(text);
            return `
                <div class="${cl}" onclick="Quiz.select(${k})">
                    <span class="option-letter">${letter}</span>
                    <span class="option-content">${esc(body)}</span>
                </div>`;
        }).join('');

        const fb = $('practice-feedback');
        fb.classList.remove('is-correct', 'is-incorrect');
        if (!verified) {
            fb.classList.add('show');
            fb.innerHTML = `<div style="color: var(--text-muted); font-size: 0.88rem;">${C.unverifiedNote ? C.unverifiedNote(q) : 'Câu hỏi chưa có đáp án xác định.'}</div>`;
        } else if (revealed) {
            const ok = answers[i] === q.correctIndex;
            fb.classList.add('show', ok ? 'is-correct' : 'is-incorrect');
            fb.innerHTML = buildDynamicFeedbackHtml(q, answers[i], topic);
        } else {
            fb.classList.remove('show');
        }

        $('btn-prev').disabled = (i === 0);
        $('btn-next').textContent = i === quiz.length - 1 ? (reviewing ? 'Hoàn tất xem lại' : 'Nộp bài') : 'Câu tiếp';
        renderPalette();
    }

    function select(k) {
        if (reviewing) return;
        const q = quiz[idx];
        if (mode === 'practice' && answers[idx] !== null && isGraded(q)) return;
        answers[idx] = k;
        loadQuestion(idx);
    }

    function toggleFlag() {
        flags[idx] = !flags[idx];
        loadQuestion(idx);
    }

    function nav(delta) {
        const next = idx + delta;
        if (next >= 0 && next < quiz.length) loadQuestion(next);
        else if (next >= quiz.length) reviewing ? toTopics() : submit(false);
    }

    function renderPalette() {
        const answeredCount = answers.filter(a => a !== null).length;
        const progEl = $('side-progress');
        if (progEl) progEl.textContent = `Đã chọn: ${answeredCount}/${quiz.length}`;
        const fillEl = $('q-progress-fill');
        if (fillEl && quiz.length > 0) {
            fillEl.style.width = `${Math.round((answeredCount / quiz.length) * 100)}%`;
        }

        let html = '';
        quiz.forEach((q, i) => {
            const verified = isGraded(q);
            if (reviewing) {
                const ok = answers[i] === q.correctIndex;
                if (reviewFilter === 'correct' && !ok) return;
                if (reviewFilter === 'incorrect' && ok) return;
                if (reviewFilter === 'flagged' && !flags[i]) return;
            }
            let cl = 'palette-btn';
            if (i === idx) cl += ' current';
            if (flags[i]) cl += ' flagged';
            if (answers[i] !== null) {
                cl += ' answered';
                if ((reviewing || mode === 'practice') && verified) cl += answers[i] === q.correctIndex ? ' correct' : ' incorrect';
            } else if (reviewing && verified) {
                cl += ' incorrect';
            }
            html += `<div class="${cl}" onclick="Quiz.go(${i})">${i + 1}</div>`;
        });
        $('palette-grid').innerHTML = html ||
            '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 12px 0;">Không có câu hỏi thỏa mãn bộ lọc.</div>';
    }

    // ---------- Submit / review ----------
    function submit(force) {
        if (reviewing) { toTopics(); return; }

        const unanswered = answers.filter(a => a === null).length;
        if (!force && unanswered > 0 && !confirm(`Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?`)) return;
        stopTimer();

        let correct = 0, graded = 0;
        const levels = { NB: [0, 0], TH: [0, 0], VD: [0, 0] }; // [correct, total]
        quiz.forEach((q, i) => {
            if (!isGraded(q)) return;
            graded++;
            const ok = answers[i] === q.correctIndex;
            if (ok) correct++;
            if (levels[q.level]) {
                levels[q.level][1]++;
                if (ok) levels[q.level][0]++;
            }
        });

        const total = graded > 0 ? graded : quiz.length;
        const score = total > 0 ? ((correct / total) * 10).toFixed(2) : '0.00';
        const timeSpentStr = mode === 'test' && initial > 0 ? fmtTime(initial - remaining) : 'Không giới hạn';

        // Luu lich su lam bai cua tai khoan
        if (window.QuizAuth) {
            const records = quiz.map((q, i) => [ALL.indexOf(q), answers[i], flags[i] ? 1 : 0]);
            QuizAuth.saveAttempt({
                courseId: COURSE_ID,
                courseTitle: C.title,
                title: $('quiz-topic-title').textContent || C.title,
                mode,
                score,
                correct,
                total: quiz.length,
                timeSpent: timeSpentStr,
                records
            }).then(() => {
                updateCourseHistoryBtn();
            });
        }

        $('res-score').textContent = `${score} / 10`;
        $('res-correct').textContent = `${correct} câu`;
        $('res-incorrect').textContent = `${total - correct} câu`;
        $('res-total').textContent = `${quiz.length} câu`;
        $('res-time').textContent = timeSpentStr;
        if (C.levelStats) {
            Object.entries(levels).forEach(([k, [c, t]]) => { $('res-' + k).textContent = `${c} / ${t}`; });
        }
        show('result-modal', 'flex');
    }

    function enterReview() {
        closeModal('result-modal');
        reviewing = true;
        reviewFilter = 'all';
        document.querySelectorAll('.review-pill').forEach((p, idxPill) => p.classList.toggle('active', idxPill === 0));
        show('quiz-timer', 'none');
        show('review-filters', 'flex');
        $('quiz-mode-badge').textContent = 'Xem lại bài làm';
        $('btn-submit').textContent = 'Trở về danh sách';
        loadQuestion(0);
    }

    function setReviewFilter(filter, btn) {
        reviewFilter = filter;
        document.querySelectorAll('.review-pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        renderPalette();
    }

    function restart() {
        closeModal('result-modal');
        answers = new Array(quiz.length).fill(null);
        flags = new Array(quiz.length).fill(false);
        reviewing = false;
        show('review-filters', 'none');
        $('btn-submit').textContent = 'Nộp bài';
        $('quiz-mode-badge').textContent = mode === 'test' ? 'Thi thử' : 'Luyện tập';
        if (mode === 'test' && initial > 0) {
            show('quiz-timer', 'inline-block');
            remaining = initial;
            startTimer();
        }
        loadQuestion(0);
    }

    function toTopics() {
        closeModal('result-modal');
        if (window.QuizAuth && QuizAuth.closeAccountModal) {
            QuizAuth.closeAccountModal('account-history-modal');
        }
        stopTimer();
        if (window.history && window.history.replaceState && window.location.search.includes('review=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        show('quiz-section', 'none');
        show('topics-view', 'block');
        renderTopics();
    }

    function exit() {
        if (reviewing || confirm('Bạn có chắc chắn muốn thoát bài làm hiện tại? Kết quả chưa nộp sẽ không được lưu.')) toTopics();
    }

    // ---------- Course History & Attempt Review (delegates modal UI to QuizAuth) ----------
    function openHistory() {
        if (window.QuizAuth && QuizAuth.openHistoryModal) {
            QuizAuth.openHistoryModal(COURSE_ID);
        }
    }

    function reviewAttempt(attemptId) {
        if (!window.QuizAuth) return;
        const att = QuizAuth.getAttemptById(attemptId);
        if (!att || !Array.isArray(att.records) || att.records.length === 0) {
            alert('Không tìm thấy dữ liệu chi tiết của bài làm này.');
            return;
        }

        const loadedQuestions = [];
        const loadedAnswers = [];
        const loadedFlags = [];

        att.records.forEach(rec => {
            const [qIdx, ansIdx, flagBit] = rec;
            if (Number.isInteger(qIdx) && qIdx >= 0 && qIdx < ALL.length) {
                loadedQuestions.push(ALL[qIdx]);
                loadedAnswers.push(ansIdx === null || ansIdx === undefined ? null : ansIdx);
                loadedFlags.push(Boolean(flagBit));
            }
        });

        if (loadedQuestions.length === 0) {
            alert('Dữ liệu câu hỏi của bài làm này không còn tương thích.');
            return;
        }

        if (QuizAuth.closeAccountModal) {
            QuizAuth.closeAccountModal('account-history-modal');
        }
        quiz = loadedQuestions;
        answers = loadedAnswers;
        flags = loadedFlags;
        mode = att.mode || 'test';
        reviewing = true;
        reviewFilter = 'all';
        idx = 0;

        show('topics-view', 'none');
        show('quiz-section', 'block');
        show('quiz-timer', 'none');
        show('review-filters', 'flex');
        document.querySelectorAll('.review-pill').forEach((p, idxPill) => p.classList.toggle('active', idxPill === 0));
        $('quiz-mode-badge').textContent = `Xem lại lịch sử (${att.score}/10)`;
        $('quiz-topic-title').textContent = att.title;
        $('btn-submit').textContent = 'Trở về danh sách';
        loadQuestion(0);
    }

    // ---------- Init ----------
    document.addEventListener('DOMContentLoaded', () => {
        renderApp();
        if (window.QuizAuth && QuizAuth.mountNavbar) {
            QuizAuth.mountNavbar('#course-navbar-root', { activePageId: COURSE_ID });
        }
        renderTopics();

        const checkUrlParams = () => {
            const params = new URLSearchParams(window.location.search);
            const revId = params.get('review');
            if (revId && window.QuizAuth) {
                const found = QuizAuth.getAttemptById(revId);
                if (found) {
                    reviewAttempt(revId);
                    return true;
                }
            }
            if (params.get('autoExam') === '1') {
                if (window.history && window.history.replaceState) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
                promptExam();
                return true;
            }
            return false;
        };

        if (!checkUrlParams() && window.QuizAuth) {
            QuizAuth.syncHistoryFromCloud().then(() => {
                updateCourseHistoryBtn();
                checkUrlParams();
            });
        }

        document.addEventListener('keydown', e => {
            if ($('quiz-section').style.display !== 'block') return;
            if ($('start-modal').style.display === 'flex' || $('result-modal').style.display === 'flex') return;
            if (e.key === 'ArrowLeft' && idx > 0) {
                e.preventDefault();
                nav(-1);
            } else if (e.key === 'ArrowRight' && idx < quiz.length - 1) {
                e.preventDefault();
                nav(1);
            }
        });
    });

    window.Quiz = {
        applyFilters: renderTopics,
        promptTopic, promptExam, selectQuestionSet, confirmStart, closeModal,
        select, toggleFlag, nav, go: loadQuestion,
        submit, enterReview, setReviewFilter, restart, toTopics, exit,
        openHistory, reviewAttempt
    };
})();
