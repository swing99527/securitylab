#!/bin/bash
# Phase 4: 详细分析跨项目引用

echo "======================================"
echo "Phase 4: 跨项目引用详细分析"
echo "======================================"
echo ""

echo "获取所有任务-样品关联..."
tasks_json=$(curl -s "http://localhost:8000/api/v1/tasks" -H "Authorization: Bearer fake")

# 遍历所有有样品的任务
echo "$tasks_json" | jq -r '.items[] | select(.sample_id != null) | "\(.id)|\(.project_id)|\(.sample_id)|\(.name)"' | while IFS='|' read task_id task_project sample_id task_name; do
    # 获取样品信息
    sample_json=$(curl -s "http://localhost:8000/api/v1/samples/$sample_id" -H "Authorization: Bearer fake" 2>/dev/null)
    sample_project=$(echo "$sample_json" | jq -r '.project_id // "null"')
    sample_name=$(echo "$sample_json" | jq -r '.name // "unknown"')
    
    # 检查是否匹配
    if [ "$task_project" != "$sample_project" ]; then
        echo "❌ MISMATCH FOUND:"
        echo "   Task ID: $task_id"
        echo "   Task Name: $task_name"
        echo "   Task Project: $task_project"
        echo "   Sample ID: $sample_id"
        echo "   Sample Name: $sample_name"
        echo "   Sample Project: $sample_project"
        echo "   ---"
        
        # 记录到修复脚本
        echo "-- Fix: $task_id -> $sample_id" >> /tmp/fix_samples.sql
        echo "UPDATE samples SET project_id = '$task_project' WHERE id = '$sample_id';" >> /tmp/fix_samples.sql
    fi
done

echo ""
echo "======================================"
echo "生成修复SQL: /tmp/fix_samples.sql"
echo "======================================"
cat /tmp/fix_samples.sql 2>/dev/null || echo "无问题数据"
