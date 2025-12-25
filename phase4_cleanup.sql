-- ============================================
-- Phase 4: 数据清洗脚本 - 样品复制策略
-- 执行时间: 2025-12-25
-- 策略: 为每个项目创建独立的样品副本
-- ============================================

BEGIN;  -- 开始事务，失败可回滚

-- 创建临时表记录清洗前状态
CREATE TEMP TABLE pre_cleanup_tasks AS
SELECT 
    t.id as task_id,
    t.name as task_name,
    t.project_id as task_project_id,
    t.sample_id as sample_id,
    s.name as sample_name,
    s.project_id as sample_project_id
FROM tasks t
LEFT JOIN samples s ON t.sample_id = s.id
WHERE t.sample_id IS NOT NULL;

-- 显示清洗前的不一致数据
SELECT 
    '清洗前不一致任务数' as metric,
    COUNT(*) as count
FROM pre_cleanup_tasks
WHERE task_project_id != sample_project_id;

-- ============================================
-- 样品1: 小米智能门锁Pro (eee78df9...)
-- 原project_id: 062ddd51...
-- 需要为: 7e6dc6d7, c24e423f 创建副本
-- ============================================

DO $$
DECLARE
    new_sample_7e UUID;
    new_sample_c2 UUID;
BEGIN
    -- 副本1: 项目 7e6dc6d7
    INSERT INTO samples (
        id, code, name, model, manufacturer, 
        project_id, status, location, notes, 
        qr_code_url, created_at, updated_at
    )
    SELECT 
        gen_random_uuid(),
        'SPL-20251225-CP1',
        name,
        model,
        manufacturer,
        '7e6dc6d7-be2e-4ce2-98ca-a8ef49fd07dc',
        status,
        location,
        COALESCE(notes, '') || ' [复制自原样品 eee78df9-91aa-4fc8-aac7-2464b740ec2e]',
        NULL,  -- QR码待后续生成
        NOW(),
        NOW()
    FROM samples 
    WHERE id = 'eee78df9-91aa-4fc8-aac7-2464b740ec2e'
    RETURNING id INTO new_sample_7e;
    
    RAISE NOTICE '创建样品副本 (项目7e6dc6d7): %', new_sample_7e;
    
    -- 更新项目 7e6dc6d7 的任务
    UPDATE tasks 
    SET sample_id = new_sample_7e,
        updated_at = NOW()
    WHERE project_id = '7e6dc6d7-be2e-4ce2-98ca-a8ef49fd07dc'
    AND sample_id = 'eee78df9-91aa-4fc8-aac7-2464b740ec2e';
    
    RAISE NOTICE '更新项目7e6dc6d7的任务: % 个', (
        SELECT COUNT(*) FROM tasks 
        WHERE project_id = '7e6dc6d7-be2e-4ce2-98ca-a8ef49fd07dc' 
        AND sample_id = new_sample_7e
    );
    
    -- 副本2: 项目 c24e423f
    INSERT INTO samples (
        id, code, name, model, manufacturer,
        project_id, status, location, notes,
        qr_code_url, created_at, updated_at
    )
    SELECT 
        gen_random_uuid(),
        'SPL-20251225-CP2',
        name,
        model,
        manufacturer,
        'c24e423f-9555-4d95-98d9-bdbf4582c30d',
        status,
        location,
        COALESCE(notes, '') || ' [复制自原样品 eee78df9-91aa-4fc8-aac7-2464b740ec2e]',
        NULL,
        NOW(),
        NOW()
    FROM samples
    WHERE id = 'eee78df9-91aa-4fc8-aac7-2464b740ec2e'
    RETURNING id INTO new_sample_c2;
    
    RAISE NOTICE '创建样品副本 (项目c24e423f): %', new_sample_c2;
    
    -- 更新项目 c24e423f 的任务
    UPDATE tasks
    SET sample_id = new_sample_c2,
        updated_at = NOW()
    WHERE project_id = 'c24e423f-9555-4d95-98d9-bdbf4582c30d'
    AND sample_id = 'eee78df9-91aa-4fc8-aac7-2464b740ec2e';
    
    RAISE NOTICE '更新项目c24e423f的任务: % 个', (
        SELECT COUNT(*) FROM tasks
        WHERE project_id = 'c24e423f-9555-4d95-98d9-bdbf4582c30d'
        AND sample_id = new_sample_c2
    );
END $$;

-- ============================================
-- 样品2: 小米智能门锁青春版 (8d6b5ab7...)
-- 原project_id: 062ddd51...
-- 需要为: 7e6dc6d7 创建副本
-- ============================================

DO $$
DECLARE
    new_sample UUID;
BEGIN
    INSERT INTO samples (
        id, code, name, model, manufacturer,
        project_id, status, location, notes,
        qr_code_url, created_at, updated_at
    )
    SELECT 
        gen_random_uuid(),
        'SPL-20251225-CP3',
        name, model, manufacturer,
        '7e6dc6d7-be2e-4ce2-98ca-a8ef49fd07dc',
        status, location,
        COALESCE(notes, '') || ' [复制自原样品 8d6b5ab7-6cd6-45b5-a59e-4d1a19af0e62]',
        NULL, NOW(), NOW()
    FROM samples
    WHERE id = '8d6b5ab7-6cd6-45b5-a59e-4d1a19af0e62'
    RETURNING id INTO new_sample;
    
    RAISE NOTICE '创建样品副本 (项目7e6dc6d7): %', new_sample;
    
    UPDATE tasks
    SET sample_id = new_sample, updated_at = NOW()
    WHERE project_id = '7e6dc6d7-be2e-4ce2-98ca-a8ef49fd07dc'
    AND sample_id = '8d6b5ab7-6cd6-45b5-a59e-4d1a19af0e62';
    
    RAISE NOTICE '更新任务: % 个', (
        SELECT COUNT(*) FROM tasks
        WHERE project_id = '7e6dc6d7-be2e-4ce2-98ca-a8ef49fd07dc'
        AND sample_id = new_sample
    );
END $$;

-- ============================================
-- 样品3: 大疆机甲大师S1 (95771117...)
-- 原project_id: 55cd2eb1...
-- 需要为: e5294498, c24e423f, d8e49504 创建副本
-- ============================================

DO $$
DECLARE
    new_sample_e5 UUID;
    new_sample_c2 UUID;
    new_sample_d8 UUID;
BEGIN
    -- 副本1: 项目 e5294498
    INSERT INTO samples (
        id, code, name, model, manufacturer,
        project_id, status, location, notes,
        qr_code_url, created_at, updated_at
    )
    SELECT 
        gen_random_uuid(),
        'SPL-20251225-CP4',
        name, model, manufacturer,
        'e5294498-a011-4df8-a284-247f541da04e',
        status, location,
        COALESCE(notes, '') || ' [复制自原样品 95771117-32a2-4633-9d24-c09a84909a49]',
        NULL, NOW(), NOW()
    FROM samples
    WHERE id = '95771117-32a2-4633-9d24-c09a84909a49'
    RETURNING id INTO new_sample_e5;
    
    UPDATE tasks
    SET sample_id = new_sample_e5, updated_at = NOW()
    WHERE project_id = 'e5294498-a011-4df8-a284-247f541da04e'
    AND sample_id = '95771117-32a2-4633-9d24-c09a84909a49';
    
    RAISE NOTICE '创建样品副本 (项目e5294498): % , 更新任务: %', 
        new_sample_e5,
        (SELECT COUNT(*) FROM tasks WHERE project_id = 'e5294498-a011-4df8-a284-247f541da04e' AND sample_id = new_sample_e5);
    
    -- 副本2: 项目 c24e423f
    INSERT INTO samples (
        id, code, name, model, manufacturer,
        project_id, status, location, notes,
        qr_code_url, created_at, updated_at
    )
    SELECT 
        gen_random_uuid(),
        'SPL-20251225-CP5',
        name, model, manufacturer,
        'c24e423f-9555-4d95-98d9-bdbf4582c30d',
        status, location,
        COALESCE(notes, '') || ' [复制自原样品 95771117-32a2-4633-9d24-c09a84909a49]',
        NULL, NOW(), NOW()
    FROM samples
    WHERE id = '95771117-32a2-4633-9d24-c09a84909a49'
    RETURNING id INTO new_sample_c2;
    
    UPDATE tasks
    SET sample_id = new_sample_c2, updated_at = NOW()
    WHERE project_id = 'c24e423f-9555-4d95-98d9-bdbf4582c30d'
    AND sample_id = '95771117-32a2-4633-9d24-c09a84909a49';
    
    RAISE NOTICE '创建样品副本 (项目c24e423f): % , 更新任务: %',
        new_sample_c2,
        (SELECT COUNT(*) FROM tasks WHERE project_id = 'c24e423f-9555-4d95-98d9-bdbf4582c30d' AND sample_id = new_sample_c2);
    
    -- 副本3: 项目 d8e49504
    INSERT INTO samples (
        id, code, name, model, manufacturer,
        project_id, status, location, notes,
        qr_code_url, created_at, updated_at
    )
    SELECT 
        gen_random_uuid(),
        'SPL-20251225-CP6',
        name, model, manufacturer,
        'd8e49504-59db-491d-8063-6bf86553af2b',
        status, location,
        COALESCE(notes, '') || ' [复制自原样品 95771117-32a2-4633-9d24-c09a84909a49]',
        NULL, NOW(), NOW()
    FROM samples
    WHERE id = '95771117-32a2-4633-9d24-c09a84909a49'
    RETURNING id INTO new_sample_d8;
    
    UPDATE tasks
    SET sample_id = new_sample_d8, updated_at = NOW()
    WHERE project_id = 'd8e49504-59db-491d-8063-6bf86553af2b'
    AND sample_id = '95771117-32a2-4633-9d24-c09a84909a49';
    
    RAISE NOTICE '创建样品副本 (项目d8e49504): % , 更新任务: %',
        new_sample_d8,
        (SELECT COUNT(*) FROM tasks WHERE project_id = 'd8e49504-59db-491d-8063-6bf86553af2b' AND sample_id = new_sample_d8);
END $$;

-- ============================================
-- 样品4: DJI Tello无人机 (fba02002...)
-- 原project_id: 55cd2eb1...
-- 需要为: d8e49504 创建副本
-- ============================================

DO $$
DECLARE
    new_sample UUID;
BEGIN
    INSERT INTO samples (
        id, code, name, model, manufacturer,
        project_id, status, location, notes,
        qr_code_url, created_at, updated_at
    )
    SELECT 
        gen_random_uuid(),
        'SPL-20251225-CP7',
        name, model, manufacturer,
        'd8e49504-59db-491d-8063-6bf86553af2b',
        status, location,
        COALESCE(notes, '') || ' [复制自原样品 fba02002-3d24-4fc3-ac1d-1a4dddf7f7c1]',
        NULL, NOW(), NOW()
    FROM samples
    WHERE id = 'fba02002-3d24-4fc3-ac1d-1a4dddf7f7c1'
    RETURNING id INTO new_sample;
    
    RAISE NOTICE '创建样品副本 (项目d8e49504): %', new_sample;
    
    UPDATE tasks
    SET sample_id = new_sample, updated_at = NOW()
    WHERE project_id = 'd8e49504-59db-491d-8063-6bf86553af2b'
    AND sample_id = 'fba02002-3d24-4fc3-ac1d-1a4dddf7f7c1';
    
    RAISE NOTICE '更新任务: % 个',
        (SELECT COUNT(*) FROM tasks WHERE project_id = 'd8e49504-59db-491d-8063-6bf86553af2b' AND sample_id = new_sample);
END $$;

-- ============================================
-- 验证清洗结果
-- ============================================

-- 检查是否还有跨项目引用
SELECT 
    '清洗后不一致任务数' as metric,
    COUNT(*) as count
FROM tasks t
JOIN samples s ON t.sample_id = s.id
WHERE t.project_id != s.project_id;
-- 期望结果: 0

-- 统计新创建的样品
SELECT 
    '新创建样品数' as metric,
    COUNT(*) as count
FROM samples
WHERE code LIKE 'SPL-20251225-CP%';
-- 期望结果: 7

-- 显示清洗前后对比
SELECT 
    '清洗前不一致' as status,
    COUNT(*) as count
FROM pre_cleanup_tasks
WHERE task_project_id != sample_project_id
UNION ALL
SELECT 
    '清洗后不一致' as status,
    COUNT(*) as count
FROM tasks t
JOIN samples s ON t.sample_id = s.id
WHERE t.project_id != s.project_id;

-- 显示详细的变更日志
SELECT 
    '变更日志：更新的任务' as info,
    COUNT(*) as count
FROM tasks
WHERE updated_at > NOW() - INTERVAL '5 minutes';

-- ============================================
-- 提交或回滚决策点
-- ============================================

-- 如果一切正常，手动执行: COMMIT;
-- 如果有问题，执行: ROLLBACK;

-- 暂停在这里，等待手动确认
SELECT 
    '===========================================' as separator,
    '数据清洗完成，请检查上述验证结果' as message,
    '如果验证通过，执行 COMMIT' as action_if_ok,
    '如果有问题，执行 ROLLBACK' as action_if_error,
    '===========================================' as separator2;
