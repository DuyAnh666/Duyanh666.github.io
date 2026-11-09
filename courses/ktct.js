window.COURSE = {
    title: 'Kinh tế Chính trị Mác - Lênin',
    banner: {
        desc: 'Mô phỏng kỳ thi kết thúc học phần với 40 câu hỏi trắc nghiệm ngẫu nhiên bao quát 6 chương, thời gian làm bài chuẩn 60 phút. Hỗ trợ 2 bộ câu hỏi độc lập (Bộ câu hỏi 1 và Bộ câu hỏi 2).'
    },
    questionSets: [
        { value: 'bo1', label: 'Bộ câu hỏi 1 (453 câu)' },
        { value: 'bo2', label: 'Bộ câu hỏi 2 (497 câu)' }
    ],
    exam: {
        title: 'Đề thi thử tổng hợp Kinh tế chính trị Mác - Lênin',
        total: 40,
        minutes: 60,
        by: 'category',
        matrix: { chuong2: 10, chuong3: 10, chuong6: 10, chuong1: 3, chuong4: 3, chuong5: 4 },
        poolFilters: ['set'],
        note: 'trắc nghiệm ngẫu nhiên bao quát 6 chương'
    },
    filters: [
        {
            id: 'set',
            label: 'Bộ câu hỏi',
            target: 'question',
            field: 'set',
            all: 'Tất cả 2 bộ',
            defaultValue: 'bo1',
            showCount: true,
            options: [
                { value: 'bo1', label: 'Bộ câu hỏi 1' },
                { value: 'bo2', label: 'Bộ câu hỏi 2' }
            ]
        },
        {
            id: 'chapter',
            label: 'Chương',
            target: 'topic',
            field: 'id',
            all: 'Tất cả các chương'
        }
    ],
    feedbackInfo: (q, topic) => {
        const header = `${q.setName ? `<strong>${q.setName}</strong> • ` : ''}Chương: ${topic ? topic.title : ''}`;
        if (q.explanation) {
            return `${header}<div style="margin-top: 6px; color: var(--text-main);"><strong>Giải thích:</strong> ${q.explanation}</div>`;
        }
        return header;
    },
    topics: [
        {
            id: 'chuong1',
            title: 'Chương 1: Đối tượng, phương pháp và chức năng của Kinh tế chính trị Mác - Lênin',
            desc: 'Sự ra đời và phát triển, đối tượng nghiên cứu, phương pháp nghiên cứu và các chức năng của KTCT Mác - Lênin.'
        },
        {
            id: 'chuong2',
            title: 'Chương 2: Hàng hóa, thị trường và vai trò của các chủ thể tham gia thị trường',
            desc: 'Lý luận về hàng hóa, tiền tệ, các quy luật kinh tế của thị trường và các chủ thể tham gia thị trường.'
        },
        {
            id: 'chuong3',
            title: 'Chương 3: Giá trị thặng dư trong nền kinh tế thị trường',
            desc: 'Nguồn gốc, bản chất của giá trị thặng dư, các phương pháp sản xuất giá trị thặng dư và tích lũy tư bản.'
        },
        {
            id: 'chuong4',
            title: 'Chương 4: Cạnh tranh và độc quyền trong nền kinh tế thị trường',
            desc: 'Cạnh tranh, độc quyền và độc quyền nhà nước trong nền kinh tế thị trường tư bản chủ nghĩa.'
        },
        {
            id: 'chuong5',
            title: 'Chương 5: Kinh tế thị trường định hướng XHCN và quan hệ lợi ích kinh tế ở VN',
            desc: 'Đặc trưng kinh tế thị trường định hướng XHCN, thể chế kinh tế và các quan hệ lợi ích kinh tế ở Việt Nam.'
        },
        {
            id: 'chuong6',
            title: 'Chương 6: Công nghiệp hóa, hiện đại hóa và hội nhập kinh tế quốc tế',
            desc: 'Công nghiệp hóa, hiện đại hóa trong bối cảnh cách mạng công nghiệp lần thứ tư và hội nhập kinh tế quốc tế.'
        }
    ]
};
