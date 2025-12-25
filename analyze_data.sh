#!/bin/bash
# Data Analysis Script - Phase 1
# Safe read-only operations via API

echo "======================================"
echo "Phase 1: Data Analysis Report"
echo "Generated: $(date)"
echo "======================================"
echo ""

echo "=== 1. Sample Statistics ==="
curl -s "http://localhost:8000/api/v1/samples" -H "Authorization: Bearer fake" | jq '{
  total_samples: .total,
  sample_status: [.items[] | .status] | group_by(.) | map({status: .[0], count: length})
}'
echo ""

echo "=== 2. Project-Sample Relationship ==="
# Get all projects and check their samples
for project_id in $(curl -s "http://localhost:8000/api/v1/projects" -H "Authorization: Bearer fake" | jq -r '.items[].id' | head -3); do
    echo "Project: $project_id"
    curl -s "http://localhost:8000/api/v1/samples?project_id=$project_id" -H "Authorization: Bearer fake" | jq '{
        project_id: "'$project_id'",
        sample_count: .total
    }'
done
echo ""

echo "=== 3. Task-Sample Analysis ==="
curl -s "http://localhost:8000/api/v1/tasks" -H "Authorization: Bearer fake" | jq '{
  total_tasks: .total,
  tasks_with_samples: [.items[] | select(.sample_id != null)] | length,
  tasks_without_samples: [.items[] | select(.sample_id == null)] | length
}'
echo ""

echo "=== 4. Cross-Project Check (Sample) ==="
echo "Checking first 5 tasks with samples..."
curl -s "http://localhost:8000/api/v1/tasks" -H "Authorization: Bearer fake" | \
jq -r '.items[] | select(.sample_id != null) | 
  "\(.id)|\(.project_id)|\(.sample_id)"' | head -5 | while IFS='|' read task_id task_project sample_id; do
    sample_project=$(curl -s "http://localhost:8000/api/v1/samples/$sample_id" -H "Authorization: Bearer fake" 2>/dev/null | jq -r '.project_id // "null"')
    if [ "$task_project" != "$sample_project" ]; then
        echo "❌ MISMATCH: Task $task_id (project: $task_project) uses Sample $sample_id (project: $sample_project)"
    else
        echo "✅ OK: Task $task_id and Sample $sample_id both in project $task_project"
    fi
done
echo ""

echo "======================================"
echo "Analysis Complete"
echo "======================================"
