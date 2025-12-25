-- Data Consistency Check SQL Script
-- Phase 1: Analysis

-- ============================================
-- Check 1: Orphan Samples (没有project_id的样品)
-- ============================================
SELECT 
    '=== Orphan Samples ===' as check_name,
    COUNT(*) as count
FROM samples 
WHERE project_id IS NULL;

SELECT 
    'Details:' as info,
    id, 
    code, 
    name, 
    status,
    created_at
FROM samples 
WHERE project_id IS NULL
ORDER BY created_at DESC;

-- ============================================
-- Check 2: Cross-Project References (跨项目引用)
-- ============================================
SELECT 
    '=== Cross-Project References ===' as check_name,
    COUNT(*) as count
FROM tasks t
JOIN samples s ON t.sample_id = s.id
WHERE t.project_id != s.project_id;

SELECT 
    'Details:' as info,
    t.id as task_id,
    t.code as task_code,
    t.name as task_name,
    t.project_id as task_project_id,
    s.id as sample_id,
    s.code as sample_code,
    s.name as sample_name,
    s.project_id as sample_project_id,
    p1.code as task_project_code,
    p2.code as sample_project_code
FROM tasks t
JOIN samples s ON t.sample_id = s.id
JOIN projects p1 ON t.project_id = p1.id
JOIN projects p2 ON s.project_id = p2.id
WHERE t.project_id != s.project_id
ORDER BY t.created_at DESC;

-- ============================================
-- Check 3: Project Statistics Mismatch
-- ============================================
SELECT 
    '=== Project Statistics ===' as check_name,
    p.id,
    p.code,
    p.name,
    COUNT(DISTINCT s.id) as samples_direct,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.sample_id IS NOT NULL THEN t.sample_id END) as samples_from_tasks,
    COUNT(DISTINCT s.id) - COUNT(DISTINCT CASE WHEN t.sample_id IS NOT NULL THEN t.sample_id END) as mismatch
FROM projects p
LEFT JOIN samples s ON s.project_id = p.id
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id, p.code, p.name
HAVING COUNT(DISTINCT s.id) != COUNT(DISTINCT CASE WHEN t.sample_id IS NOT NULL THEN t.sample_id END)
ORDER BY mismatch DESC;

-- ============================================
-- Check 4: Overall Database Statistics
-- ============================================
SELECT '=== Database Overview ===' as info;

SELECT 
    'Total Projects' as metric,
    COUNT(*) as count
FROM projects;

SELECT 
    'Total Samples' as metric,
    COUNT(*) as count
FROM samples;

SELECT 
    'Samples with project_id' as metric,
    COUNT(*) as count
FROM samples
WHERE project_id IS NOT NULL;

SELECT 
    'Total Tasks' as metric,
    COUNT(*) as count
FROM tasks;

SELECT 
    'Tasks with samples' as metric,
    COUNT(*) as count
FROM tasks
WHERE sample_id IS NOT NULL;

SELECT 
    'Total Reports' as metric,
    COUNT(*) as count
FROM reports;
