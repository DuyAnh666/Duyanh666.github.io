window.COURSE = {
    title: 'Lịch sử Đảng Cộng sản Việt Nam',
    subtitle: 'Hệ thống trắc nghiệm ôn tập và thi thử chuẩn Đại học Sư phạm Hà Nội',
    unit: 'chương',
    banner: {
        desc: 'Mô phỏng kỳ thi kết thúc học phần với 40 câu hỏi trắc nghiệm ngẫu nhiên bao quát toàn bộ chương trình, thời gian làm bài chuẩn 50 phút. Tự động chấm điểm theo thang điểm 10.',
        bank: () => 'Ngân hàng câu hỏi Lịch sử Đảng Cộng sản Việt Nam'
    },
    exam: {
        title: 'Đề thi thử tổng hợp Lịch sử Đảng Cộng sản Việt Nam',
        total: 40,
        minutes: 50,
        by: 'category',
        matrix: { modau: 4, chuong1: 12, chuong2: 12, chuong3: 12 },
        note: 'trắc nghiệm ngẫu nhiên bao quát các chương'
    },
    topicMinutes: n => (n <= 30 ? 25 : 40),
    filters: [
        {
            id: 'chapter', label: 'Chương', target: 'topic', field: 'id', all: 'Tất cả các chương',
            options: [
                { value: 'modau', label: 'Chương mở đầu' },
                { value: 'chuong1', label: 'Chương 1' },
                { value: 'chuong2', label: 'Chương 2' },
                { value: 'chuong3', label: 'Chương 3' }
            ]
        }
    ],
    feedbackInfo: (q, topic) => `Chương: ${topic ? topic.title : ''}`,
    topics: [
        {
            "id": "modau",
            "title": "Chương mở đầu: Đối tượng, chức năng, nhiệm vụ và phương pháp nghiên cứu Lịch sử Đảng",
            "desc": "Đối tượng nghiên cứu, chức năng, nhiệm vụ, phương pháp nghiên cứu và ý nghĩa của việc học tập Lịch sử Đảng Cộng sản Việt Nam."
        },
        {
            "id": "chuong1",
            "title": "Chương 1: Đảng Cộng sản Việt Nam ra đời và lãnh đạo đấu tranh giành chính quyền (1930 - 1945)",
            "desc": "Bối cảnh lịch sử, sự thành lập Đảng, Cương lĩnh chính trị đầu tiên, các phong trào cách mạng và thắng lợi Cách mạng Tháng Tám 1945."
        },
        {
            "id": "chuong2",
            "title": "Chương 2: Đảng lãnh đạo hai cuộc kháng chiến, hoàn thành giải phóng dân tộc và thống nhất đất nước (1945 - 1975)",
            "desc": "Kháng chiến chống thực dân Pháp (1945 - 1954), xây dựng CNXH ở miền Bắc và kháng chiến chống Mỹ, cứu nước (1954 - 1975)."
        },
        {
            "id": "chuong3",
            "title": "Chương 3: Đảng lãnh đạo cả nước quá độ lên chủ nghĩa xã hội và tiến hành công cuộc đổi mới (1975 - nay)",
            "desc": "Thời kỳ quá độ xây dựng CNXH (1975 - 1986), công cuộc đổi mới toàn diện đất nước từ Đại hội VI đến nay và những thành tựu có ý nghĩa lịch sử."
        }
    ]
};

