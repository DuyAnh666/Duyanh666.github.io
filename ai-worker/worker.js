/**
 * Cloudflare Worker Proxy cho tính năng "AI giải thích chi tiết" (HNUE Quiz)
 * - Giữ bí mật GEMINI_API_KEY trong Environment Variables (Secrets) của Cloudflare.
 * - Hỗ trợ CORS cho https://on-thi-hnue.web.app và localhost.
 */

const ALLOWED_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...ALLOWED_HEADERS
        }
    });
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: ALLOWED_HEADERS });
        }

        if (request.method !== 'POST') {
            return jsonResponse({ ok: false, error: 'Method Not Allowed' }, 405);
        }

        if (!env.GEMINI_API_KEY) {
            return jsonResponse({ ok: false, error: 'Chưa cấu hình GEMINI_API_KEY trên Worker.' }, 500);
        }

        let payload;
        try {
            payload = await request.json();
        } catch {
            return jsonResponse({ ok: false, error: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
        }

        const {
            courseTitle = '',
            topicTitle = '',
            question = '',
            options = [],
            correctIndex,
            chosenIndex
        } = payload || {};

        if (!question || !Array.isArray(options) || options.length < 2 || !Number.isInteger(correctIndex)) {
            return jsonResponse({ ok: false, error: 'Thiếu thông tin câu hỏi hoặc đáp án.' }, 400);
        }

        const letters = ['A', 'B', 'C', 'D'];
        const optionsText = options.map((opt, idx) => `${letters[idx] || idx + 1}. ${String(opt).replace(/^[A-Da-d][\.\)]\s*/, '')}`).join('\n');
        const correctLabel = letters[correctIndex] || String(correctIndex + 1);
        const hasChosen = Number.isInteger(chosenIndex) && chosenIndex >= 0 && chosenIndex < options.length;
        const chosenLabel = hasChosen ? (letters[chosenIndex] || String(chosenIndex + 1)) : null;
        const isCorrect = hasChosen && chosenIndex === correctIndex;

        const prompt = [
            `Bạn là giảng viên Đại học Sư phạm Hà Nội (HNUE). Hãy giải thích ngắn gọn, rõ ràng, chính xác bằng tiếng Việt cho câu hỏi trắc nghiệm sau:`,
            courseTitle ? `- Học phần: ${courseTitle}` : '',
            topicTitle ? `- Chủ đề/Chương: ${topicTitle}` : '',
            `- Câu hỏi: ${question}`,
            `- Các phương án:\n${optionsText}`,
            `- Đáp án đúng: ${correctLabel}`,
            hasChosen ? `- Sinh viên đã chọn: ${chosenLabel} (${isCorrect ? 'ĐÚNG' : 'SAI'})` : '- Sinh viên chưa chọn đáp án.',
            '',
            'Yêu cầu trình bày súc tích (tối đa khoảng 140-180 từ), chia rõ 3 ý gạch đầu dòng:',
            hasChosen && !isCorrect
                ? `1. Vì sao phương án ${chosenLabel} chưa đúng: giải thích trực tiếp lỗi sai hoặc điểm dễ nhầm của phương án ${chosenLabel}.`
                : `1. Phân tích đáp án đúng (${correctLabel}): giải thích bản chất kiến thức cốt lõi.`,
            hasChosen && !isCorrect
                ? `2. Vì sao ${correctLabel} là đáp án đúng: giải thích bản chất kiến thức cốt lõi.`
                : `2. Phân biệt nhanh với các phương án gây nhiễu còn lại.`,
            '3. Mẹo ghi nhớ nhanh: 1 câu chốt từ khóa giúp lần sau không chọn nhầm.'
        ].filter(Boolean).join('\n');

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
            const geminiRes = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 500
                    }
                })
            });

            if (!geminiRes.ok) {
                const errText = await geminiRes.text();
                return jsonResponse({ ok: false, error: `Lỗi Gemini API (${geminiRes.status})`, detail: errText.slice(0, 300) }, 502);
            }

            const result = await geminiRes.json();
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (!text) {
                return jsonResponse({ ok: false, error: 'AI không trả về nội dung giải thích.' }, 502);
            }

            return jsonResponse({ ok: true, explanation: text, cached: false });
        } catch (err) {
            return jsonResponse({ ok: false, error: 'Không thể kết nối tới Gemini API.' }, 500);
        }
    }
};
