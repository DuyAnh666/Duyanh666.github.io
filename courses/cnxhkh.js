window.COURSE = {
    title: 'Chủ nghĩa Xã hội Khoa học',
    subtitle: 'Hệ thống trắc nghiệm ôn tập và thi thử chuẩn Đại học Sư phạm Hà Nội',
    unit: 'chương',
    banner: {
        desc: 'Mô phỏng kỳ thi kết thúc học phần với 40 câu hỏi trắc nghiệm ngẫu nhiên bao quát 7 chương, thời gian làm bài chuẩn 50 phút. Tự động chấm điểm theo thang điểm 10.',
        bank: () => 'Ngân hàng câu hỏi Chủ nghĩa Xã hội Khoa học'
    },
    exam: {
        title: 'Đề thi thử tổng hợp Chủ nghĩa Xã hội Khoa học',
        total: 40,
        minutes: 50,
        by: 'category',
        matrix: { chuong1: 4, chuong2: 6, chuong3: 6, chuong4: 6, chuong5: 6, chuong6: 6, chuong7: 6 },
        note: 'trắc nghiệm ngẫu nhiên bao quát 7 chương'
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
                { value: 'chuong6', label: 'Chương 6' },
                { value: 'chuong7', label: 'Chương 7' }
            ]
        }
    ],
    feedbackInfo: (q, topic) => `Chương: ${topic ? topic.title : ''}`,
    topics: [
        {
            "id": "chuong1",
            "title": "Chương 1: Nhập môn Chủ nghĩa xã hội khoa học",
            "desc": "Sự ra đời, các giai đoạn phát triển, đối tượng, phương pháp và ý nghĩa của việc học tập, nghiên cứu CNXHKH."
        },
        {
            "id": "chuong2",
            "title": "Chương 2: Sứ mệnh lịch sử của giai cấp công nhân",
            "desc": "Khái niệm, đặc điểm giai cấp công nhân; nội dung và điều kiện quy định sứ mệnh lịch sử của giai cấp công nhân."
        },
        {
            "id": "chuong3",
            "title": "Chương 3: Chủ nghĩa xã hội và thời kỳ quá độ lên chủ nghĩa xã hội",
            "desc": "Bản chất, đặc trưng của CNXH; tính tất yếu và đặc điểm của thời kỳ quá độ lên chủ nghĩa xã hội."
        },
        {
            "id": "chuong4",
            "title": "Chương 4: Dân chủ xã hội chủ nghĩa và Nhà nước xã hội chủ nghĩa",
            "desc": "Bản chất của nền dân chủ XHCN; sự ra đời, bản chất và chức năng của Nhà nước XHCN."
        },
        {
            "id": "chuong5",
            "title": "Chương 5: Cơ cấu xã hội - giai cấp và liên minh giai cấp, tầng lớp",
            "desc": "Cơ cấu xã hội - giai cấp trong thời kỳ quá độ; tính tất yếu và nội dung của liên minh giai cấp, tầng lớp."
        },
        {
            "id": "chuong6",
            "title": "Chương 6: Vấn đề dân tộc và tôn giáo trong thời kỳ quá độ",
            "desc": "Đặc điểm dân tộc và tôn giáo; quan điểm, chính sách dân tộc và tôn giáo của Đảng và Nhà nước Việt Nam."
        },
        {
            "id": "chuong7",
            "title": "Chương 7: Vấn đề gia đình trong thời kỳ quá độ lên chủ nghĩa xã hội",
            "desc": "Khái niệm, vị trí và chức năng của gia đình; các phương hướng xây dựng và phát triển gia đình Việt Nam hiện nay."
        }
    ]
};
