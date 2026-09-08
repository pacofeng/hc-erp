UPDATE emergency_contact AS contact
SET full_name = sample.chinese_name
FROM employees AS employee, (VALUES
    ('EMP00001', 'Olivia Chen', '陈晨'),
    ('EMP00002', 'Noah Wang', '王宁'),
    ('EMP00003', 'Emma Li', '李欣'),
    ('EMP00004', 'Liam Zhang', '张宇'),
    ('EMP00005', 'Ava Liu', '刘悦'),
    ('EMP00006', 'Mason Yang', '杨帆'),
    ('EMP00007', 'Sophia Huang', '黄思远'),
    ('EMP00008', 'Ethan Zhao', '赵雨晴'),
    ('EMP00009', 'Mia Wu', '吴桐'),
    ('EMP00010', 'Lucas Zhou', '周晓彤'),
    ('EMP00011', 'Amelia Xu', '徐子涵'),
    ('EMP00012', 'Logan Sun', '孙雅静'),
    ('EMP00013', 'Harper Ma', '马文轩'),
    ('EMP00014', 'James Zhu', '朱晓敏'),
    ('EMP00015', 'Evelyn Hu', '胡佳宁'),
    ('EMP00016', 'Benjamin Guo', '郭俊杰'),
    ('EMP00017', 'Abigail He', '何安然'),
    ('EMP00018', 'Henry Gao', '高雨欣'),
    ('EMP00019', 'Emily Lin', '林清和'),
    ('EMP00020', 'Alexander Luo', '罗思琪'),
    ('EMP00021', 'Ella Zheng', '郑一鸣'),
    ('EMP00022', 'Daniel Liang', '梁婉婷'),
    ('EMP00023', 'Scarlett Xie', '谢知远'),
    ('EMP00024', 'Michael Song', '宋佳怡'),
    ('EMP00025', 'Grace Tang', '唐明轩'),
    ('EMP00026', 'Chloe Pan', '潘欣怡'),
    ('EMP00027', 'Jacob Cai', '蔡浩然'),
    ('EMP00028', 'Victoria Fang', '方诗涵'),
    ('EMP00029', 'Samuel Deng', '邓博文'),
    ('EMP00030', 'Lily Han', '韩雪'),
    ('EMP00031', 'David Qin', '秦子墨'),
    ('EMP00032', 'Nora Yu', '余可欣'),
    ('EMP00033', 'Isaac Shen', '沈嘉言'),
    ('EMP00034', 'Zoey Jiang', '蒋梦瑶'),
    ('EMP00035', 'Owen Cheng', '程致远'),
    ('EMP00036', 'Hannah Ye', '叶舒雅'),
    ('EMP00037', 'Leo Fu', '傅景明'),
    ('EMP00038', 'Stella Wei', '魏若溪'),
    ('EMP00039', 'Nathan Jin', '金泽宇'),
    ('EMP00040', 'Aurora Qian', '钱语桐'),
    ('EMP00041', 'Ryan Lu', '陆修远'),
    ('EMP00042', 'Bella Xiong', '熊婧怡'),
    ('EMP00043', 'Caleb Shi', '石承安'),
    ('EMP00044', 'Lucy Ren', '任晓萱'),
    ('EMP00045', 'Dylan Tian', '田皓轩'),
    ('EMP00046', 'Alice Cao', '曹静怡'),
    ('EMP00047', 'Aaron Fan', '范思源'),
    ('EMP00048', 'Ruby Yao', '姚心悦'),
    ('EMP00049', 'Julian Kong', '孔令嘉'),
    ('EMP00050', 'Ivy Meng', '孟雨桐')
) AS sample(employee_no, original_name, chinese_name)
WHERE employee.employee_no = sample.employee_no
  AND contact.employee_id = employee.id
  AND contact.full_name = sample.original_name;

UPDATE emergency_contact AS contact
SET relation = translation.chinese
FROM (VALUES
    ('Emergency Contact', '其他'),
    ('Spouse', '配偶'),
    ('Parent', '父母'),
    ('Child', '子女'),
    ('Sibling', '兄弟姐妹'),
    ('Grandparent', '祖父母 / 外祖父母'),
    ('Aunt / Uncle', '姑姨 / 叔舅'),
    ('Cousin', '堂/表兄弟姐妹'),
    ('Niece / Nephew', '侄/甥'),
    ('Other', '其他')
) AS translation(english, chinese)
WHERE LOWER(TRIM(contact.relation)) = LOWER(translation.english);
