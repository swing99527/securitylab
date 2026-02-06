-- Create demo users for testing
INSERT INTO users (id, email, password_hash, name, role, department, status)
VALUES 
  ('632c8d32-dfb7-4cc7-8b5f-e4fa7827cd7b'::uuid, 'admin@stuailab.com', '$2b$12$Vel/J89OczCeCuHQ8iDIGeTbvKw0X139JRGMmySUxO4caXfWLhhku', '张管理员', 'admin', '信息安全实验室', 'active'),
  ('dbb808e8-4f1e-4238-a1a7-192aaad122ef'::uuid, 'director@stuailab.com', '$2b$12$xNfr.GLAS8L0VgfX1vlkY.c3Ow0R5LUd2Xp3P4FYsHHaS73XBAHci', '李主管', 'director', '检测中心', 'active'),
  ('9fc55b02-36ae-4b55-8257-4e96746fce11'::uuid, 'manager@stuailab.com', '$2b$12$mw5Z9eGAV/jbLigjhL8MZuwbGneIVqK.P6IPVxCURtq90HP/kICmG', '王经理', 'manager', '项目部', 'active'),
  ('11941cd3-143d-4cd3-8821-54553309775a'::uuid, 'engineer@stuailab.com', '$2b$12$jOv8WVeR9GtpMQTolU88HOUy5D005cVeJY9QgWhKTmT45ek8/5reu', '陈工程师', 'engineer', '检测中心', 'active')
ON CONFLICT (email) DO NOTHING;
