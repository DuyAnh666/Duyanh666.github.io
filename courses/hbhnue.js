const sourceOf = q => (q.sources && q.sources.length ? q.sources.join(', ') : (q.source || 'HNUE'));

window.COURSE = {
    title: 'Hiểu biết Sư phạm - HNUE',
    subtitle: 'Cổng ôn tập và thi thử trắc nghiệm kiến thức giáo dục & nghề giáo',
    unit: 'chủ đề',
    banner: {
        desc: 'Bộ đề 20 câu hỏi trắc nghiệm ngẫu nhiên bao quát toàn diện các chủ đề (Giáo dục, Chính sách, Văn hóa, Tiếng Anh). Thời gian làm bài 10 phút, tự động chấm điểm theo thang điểm 10.',
        highlight: 'Đề thi chuẩn: 20 câu / 10 phút',
        bank: ({ total }) => `Ngân hàng: ${total} câu hỏi`
    },
    exam: {
        title: 'Đề thi thử tổng hợp Hiểu biết Sư phạm',
        total: 20,
        minutes: 10,
        by: 'category',
        matrix: { giao_duc: 7, chinh_sach: 6, van_hoa: 3, tieng_anh: 2, khac: 2 },
        poolFilters: ['year'],
        gradedOnly: true,
        note: 'trắc nghiệm ngẫu nhiên bao quát toàn diện các chủ đề sư phạm'
    },
    topicMinutes: n => (n <= 20 ? 10 : 15),
    filters: [
        {
            id: 'year', label: 'Tài liệu', target: 'question', field: 'source', listField: 'sources', all: 'Tất cả tài liệu',
            options: [
                { value: '2015', label: 'Tài liệu 2015' },
                { value: '2019', label: 'Tài liệu 2019' },
                { value: 'Ngân hàng tổng hợp', label: 'Ngân hàng tổng hợp' },
                { value: 'Chính sách giáo dục', label: 'Chính sách giáo dục' }
            ]
        },
        {
            id: 'category', label: 'Chủ đề', target: 'topic', field: 'id', all: 'Tất cả chủ đề',
            options: [
                { value: 'giao_duc', label: 'Giáo dục & Nghề giáo' },
                { value: 'chinh_sach', label: 'Chính sách & Pháp luật GD' },
                { value: 'van_hoa', label: 'Văn hóa & Xã hội' },
                { value: 'tieng_anh', label: 'Tiếng Anh & Thuật ngữ' },
                { value: 'khac', label: 'Hiểu biết chung & Khác' }
            ]
        }
    ],
    feedbackInfo: q => `Nguồn tài liệu tham khảo: ${sourceOf(q)}`,
    unverifiedNote: q => q.answerConflict
        ? `<span style="color: var(--warning);">Lưu ý: Câu hỏi ghi nhận mâu thuẫn đáp án giữa các nguồn tài liệu gốc (không tính vào điểm thi). Nguồn: ${sourceOf(q)}.</span>`
        : `Chưa xác định được đáp án chính xác từ tài liệu gốc. Nguồn: ${sourceOf(q)}.`,
    topics: [
        {
            "id": "giao_duc",
            "badge": "Giáo dục",
            "title": "Giáo dục & Nghề giáo",
            "desc": "Lịch sử giáo dục, phương pháp dạy học tích cực, đạo đức nhà giáo, hệ thống giáo dục quốc dân."
        },
        {
            "id": "chinh_sach",
            "badge": "Chính sách",
            "title": "Chính sách & Pháp luật GD",
            "desc": "Luật Giáo dục, Nghị quyết 29-NQ/TW, đổi mới GDPT, chế độ chính sách đối với nhà giáo và học sinh."
        },
        {
            "id": "van_hoa",
            "badge": "Văn hóa",
            "title": "Văn hóa & Xã hội",
            "desc": "Lịch sử văn hóa Việt Nam, phong trào thi đua xây dựng trường học thân thiện, truyền thống sư phạm."
        },
        {
            "id": "tieng_anh",
            "badge": "Ngoại ngữ",
            "title": "Tiếng Anh & Thuật ngữ",
            "desc": "Thuật ngữ giáo dục, từ vựng và câu hỏi trắc nghiệm tiếng Anh chuyên ngành sư phạm."
        },
        {
            "id": "khac",
            "badge": "Tổng hợp",
            "title": "Hiểu biết chung & Khác",
            "desc": "Kiến thức xã hội, kỹ năng nghề nghiệp, quy định ngành và hiểu biết tổng hợp sư phạm."
        }
    ]
};
