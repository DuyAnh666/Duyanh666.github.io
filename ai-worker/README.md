# Hướng dẫn triển khai AI Proxy trên Cloudflare Workers (Miễn phí)

1. Truy cập https://dash.cloudflare.com/ -> đăng nhập -> vào **Workers & Pages** -> **Create** -> **Create Worker**.
2. Đặt tên (ví dụ `hnue-quiz-ai`) -> bấm **Deploy** -> bấm **Edit code**, dán toàn bộ nội dung file `worker.js` vào và bấm **Deploy**.
3. Vào tab **Settings** -> **Variables and Secrets** -> **Add**:
   - Type: `Secret`
   - Variable name: `GEMINI_API_KEY`
   - Value: dán Gemini API Key (tạo miễn phí tại https://aistudio.google.com/apikey) -> bấm **Deploy**.
4. Copy đường dẫn Worker (ví dụ `https://hnue-quiz-ai.ten-tai-khoan.workers.dev`) và dán vào `aiEndpoint` trong `assets/cloud-config.js`.
