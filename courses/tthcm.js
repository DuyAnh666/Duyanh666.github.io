window.COURSE = {
    title: 'Tư tưởng Hồ Chí Minh',
    subtitle: 'Hệ thống trắc nghiệm ôn tập và thi thử chuẩn Đại học Sư phạm Hà Nội',
    unit: 'chương',
    banner: {
        desc: 'Mô phỏng kỳ thi kết thúc học phần với 40 câu hỏi trắc nghiệm ngẫu nhiên bao quát toàn bộ 6 chương, thời gian làm bài chuẩn 60 phút. Tự động chấm điểm theo thang điểm 10.',
        bank: () => 'Ngân hàng: 6 chương ôn tập'
    },
    exam: {
        title: 'Đề thi thử tổng hợp Tư tưởng Hồ Chí Minh',
        total: 40,
        minutes: 60,
        by: 'category',
        matrix: { chuong2: 10, chuong3: 10, chuong6: 10, chuong1: 3, chuong4: 3, chuong5: 4 },
        note: 'trắc nghiệm ngẫu nhiên bao quát 6 chương'
    },
    topicMinutes: n => (n <= 30 ? 25 : 40),
    filters: [
        {
            id: 'chapter', label: 'Chương', target: 'topic', field: 'id', all: 'Tất cả các chương',
            options: [
                { value: 'chuong1', label: 'Chương 1' },
                { value: 'chuong2', label: 'Chương 2' },
                { value: 'chuong3', label: 'Chương 3' },
                { value: 'chuong4', label: 'Chương 4' },
                { value: 'chuong5', label: 'Chương 5' },
                { value: 'chuong6', label: 'Chương 6' }
            ]
        }
    ],
    feedbackInfo: (q, topic) => `Chương: ${topic ? topic.title : ''}`,
    topics: [
        {
            "id": "chuong1",
            "badge": "Chương 1",
            "title": "Chương 1: Khái niệm, đối tượng, phương pháp và ý nghĩa học tập môn TTHCM",
            "desc": "Khái niệm tư tưởng Hồ Chí Minh, đối tượng, phương pháp nghiên cứu và ý nghĩa việc học tập đối với sinh viên."
        },
        {
            "id": "chuong2",
            "badge": "Chương 2",
            "title": "Chương 2: Cơ sở, quá trình hình thành và phát triển tư tưởng Hồ Chí Minh",
            "desc": "Cơ sở thực tiễn, cơ sở lý luận, nhân tố chủ quan và các thời kỳ phát triển tư tưởng Hồ Chí Minh."
        },
        {
            "id": "chuong3",
            "badge": "Chương 3",
            "title": "Chương 3: Tư tưởng Hồ Chí Minh về độc lập dân tộc và chủ nghĩa xã hội",
            "desc": "Mục tiêu độc lập dân tộc gắn liền với CNXH, con đường và động lực xây dựng CNXH ở Việt Nam."
        },
        {
            "id": "chuong4",
            "badge": "Chương 4",
            "title": "Chương 4: Đảng Cộng sản Việt Nam và Nhà nước của nhân dân",
            "desc": "Tư tưởng Hồ Chí Minh về sự ra đời, vai trò của Đảng Cộng sản Việt Nam và xây dựng Nhà nước của dân, do dân, vì dân."
        },
        {
            "id": "chuong5",
            "badge": "Chương 5",
            "title": "Chương 5: Đại đoàn kết toàn dân tộc và đoàn kết quốc tế",
            "desc": "Vai trò, lực lượng, hình thức của khối đại đoàn kết toàn dân tộc và nguyên tắc đoàn kết quốc tế."
        },
        {
            "id": "chuong6",
            "badge": "Chương 6",
            "title": "Chương 6: Tư tưởng Hồ Chí Minh về văn hóa, đạo đức, con người",
            "desc": "Xây dựng nền văn hóa mới, các chuẩn mực đạo đức cách mạng và chiến lược trồng người."
        }
    ]
};
