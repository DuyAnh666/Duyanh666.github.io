window.COURSE = {
    title: 'Xây dựng Kế hoạch Dạy học Môn Tin học',
    subtitle: 'Hệ thống câu hỏi trắc nghiệm GDPT 2018 theo nhóm học phần',
    unit: 'chủ đề',
    banner: {
        desc: 'Bộ đề 30 câu hỏi cấu trúc chuẩn theo ma trận 3:4:3 (30% Nhận biết, 40% Thông hiểu, 30% Vận dụng) bao quát toàn bộ nội dung học phần. Thời gian làm bài 40 phút, tự động chấm điểm thang 10.',
        highlight: 'Ma trận 3:4:3 (9 NB • 12 TH • 9 VD)',
        bank: ({ values, count }) => values.group === 'all'
            ? `Ngân hàng: Tất cả các nhóm (${count} câu)`
            : `Ngân hàng: ${values.group} (${count} câu)`
    },
    exam: {
        title: 'Đề thi thử tổng hợp kết thúc học phần',
        total: 30,
        minutes: 40,
        by: 'level',
        matrix: { NB: 9, TH: 12, VD: 9 },
        poolFilters: ['group'],
        note: 'ngẫu nhiên chuẩn cấu trúc ma trận 3:4:3 (9 Nhận biết, 12 Thông hiểu, 9 Vận dụng)'
    },
    levelStats: true,
    topicMinutes: n => (n <= 10 ? 15 : 25),
    filters: [
        {
            id: 'group', label: 'Nhóm', target: 'question', field: 'group', all: 'Tất cả các nhóm', showCount: true,
                        options: [
                { value: 'Nhóm 1', label: 'Nhóm 1' },
                { value: 'Nhóm 2', label: 'Nhóm 2' },
                { value: 'Nhóm 4', label: 'Nhóm 4' },
                { value: 'Nhóm 5', label: 'Nhóm 5' },
                { value: 'Nhóm 7', label: 'Nhóm 7' },
                { value: 'Nhóm 9', label: 'Nhóm 9' },
                { value: 'Nhóm 11', label: 'Nhóm 11' }
            ]
        },
        {
            id: 'chapter', label: 'Chương', target: 'topic', field: 'chapter', all: 'Tất cả các chương',
            options: [
                { value: 'c1', label: 'Chương 1: GDPT 2018 Môn Tin học' },
                { value: 'c2', label: 'Chương 2: Xây dựng Kế hoạch Giáo dục' }
            ]
        },
        {
            id: 'level', label: 'Mức độ', target: 'question', field: 'level', all: 'Tất cả mức độ',
            options: [
                { value: 'NB', label: 'Nhận biết (NB - 30%)' },
                { value: 'TH', label: 'Thông hiểu (TH - 40%)' },
                { value: 'VD', label: 'Vận dụng (VD - 30%)' }
            ]
        }
    ],
    feedbackInfo: (q, topic) =>
        `Mức độ: <strong>${q.levelName || ''}</strong> • Chủ đề: ${q.topic || ''} • Nguồn: ${q.group || ''}`,
    topics: [
        {
            "id": "c1_p12",
            "chapter": "c1",
            "chapterTitle": "Chương 1",
            "title": "Phần 1, 2: Đặc điểm môn học & Mục tiêu chương trình",
            "desc": "Khái quát vị trí môn Tin học, giai đoạn giáo dục cơ bản & định hướng nghề nghiệp, các mục tiêu GDPT 2018."
        },
        {
            "id": "c1_p34",
            "chapter": "c1",
            "chapterTitle": "Chương 1",
            "title": "Phần 3, 4: Yêu cầu cần đạt & Nội dung chương trình",
            "desc": "Hệ thống năng lực tin học (NLa - NLe), 3 mạch kiến thức DL, ICT, CS và định hướng chuyên đề học tập."
        },
        {
            "id": "c1_p56",
            "chapter": "c1",
            "chapterTitle": "Chương 1",
            "title": "Phần 5, 6: Phương pháp giáo dục & Đánh giá kết quả",
            "desc": "Phương pháp dạy học phát triển năng lực, dạy học dự án, giáo dục STEM và đánh giá thường xuyên, định kỳ."
        },
        {
            "id": "c2_p1",
            "chapter": "c2",
            "chapterTitle": "Chương 2",
            "title": "Phần 1: Xây dựng kế hoạch giáo dục nhà trường",
            "desc": "Nguyên tắc xây dựng kế hoạch giáo dục nhà trường, phân bổ thời lượng và cấu trúc khung kế hoạch."
        },
        {
            "id": "c2_p2",
            "chapter": "c2",
            "chapterTitle": "Chương 2",
            "title": "Phần 2: Xây dựng KHGD tổ chuyên môn",
            "desc": "Phụ lục 1, Phụ lục 2 theo Công văn 5512/BGDĐT, phân phối chương trình và kế hoạch dạy học tổ chuyên môn."
        },
        {
            "id": "c2_p4",
            "chapter": "c2",
            "chapterTitle": "Chương 2",
            "title": "Phần 4: Xây dựng kế hoạch bài dạy môn Tin học",
            "desc": "Cấu trúc bài dạy theo Công văn 5512, 4 hoạt động học tập (Mở đầu, Hình thành kiến thức, Luyện tập, Vận dụng)."
        }
    ]
};
