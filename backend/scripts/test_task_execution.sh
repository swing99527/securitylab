#!/bin/bash
# 任务执行引擎端到端测试脚本



echo "🚀 任务执行引擎测试脚本"
echo "=========================="

# 配置
API_BASE="http://localhost:8000/api/v1"
ADMIN_USER="admin@iot-lab.com"
ADMIN_PASS="admin123"

echo ""
echo "📝 Step 1: 登录获取Token"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

# Extract user ID for manager_id
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')

echo "✅ 登录成功"
echo "Token: ${TOKEN:0:20}..."
echo "User ID: $USER_ID"

echo ""
echo "📦 Step 2: 创建测试项目"
PROJECT_RESPONSE=$(curl -s -X POST "$API_BASE/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"任务执行测试项目\",
    \"client\": \"内部测试\",
    \"standard\": \"自定义\",
    \"description\": \"测试任务执行引擎\",
    \"manager_id\": \"$USER_ID\"
  }")

PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.id')

if [ "$PROJECT_ID" = "null" ] || [ -z "$PROJECT_ID" ]; then
  echo "❌ 项目创建失败"
  echo $PROJECT_RESPONSE | jq '.'
  exit 1
fi

echo "✅ 项目创建成功"
echo "Project ID: $PROJECT_ID"

echo ""
echo "🎯 Step 3: 创建Ping扫描任务"
TASK_RESPONSE=$(curl -s -X POST "$API_BASE/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": \"$PROJECT_ID\",
    \"name\": \"Ping扫描 - Google DNS\",
    \"type\": \"ping_scan\",
    \"config\": {
      \"target\": \"8.8.8.8\",
      \"count\": 4,
      \"timeout\": 1
    }
  }")

TASK_ID=$(echo $TASK_RESPONSE | jq -r '.id')
TASK_CODE=$(echo $TASK_RESPONSE | jq -r '.code')

if [ "$TASK_ID" = "null" ] || [ -z "$TASK_ID" ]; then
  echo "❌ 任务创建失败"
  echo $TASK_RESPONSE | jq '.'
  exit 1
fi

echo "✅ 任务创建成功并自动开始执行"
echo "Task ID: $TASK_ID"
echo "Task Code: $TASK_CODE"

echo ""
echo "⏳ Step 4: 轮询任务状态（实时更新）"
echo "-----------------------------------"

POLL_COUNT=0
MAX_POLLS=30

while [ $POLL_COUNT -lt $MAX_POLLS ]; do
  STATUS_RESPONSE=$(curl -s "$API_BASE/tasks/$TASK_ID/status" \
    -H "Authorization: Bearer $TOKEN")
  
  TASK_STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
  PROGRESS=$(echo $STATUS_RESPONSE | jq -r '.progress')
  MESSAGE=$(echo $STATUS_RESPONSE | jq -r '.message')
  
  # 显示进度
  printf "\r[%-20s] %3d%% - %s" \
    "$(printf '█%.0s' $(seq 1 $((PROGRESS/5))))" \
    "$PROGRESS" \
    "$MESSAGE"
  
  # 检查是否完成
  if [ "$TASK_STATUS" = "completed" ] || [ "$TASK_STATUS" = "failed" ]; then
    echo ""
    echo ""
    
    if [ "$TASK_STATUS" = "completed" ]; then
      echo "✅ 任务执行成功！"
      echo ""
      echo "📊 扫描结果:"
      echo "-----------------------------------"
      echo $STATUS_RESPONSE | jq '.result'
    else
      echo "❌ 任务执行失败"
      ERROR=$(echo $STATUS_RESPONSE | jq -r '.error')
      echo "错误: $ERROR"
    fi
    
    break
  fi
  
  POLL_COUNT=$((POLL_COUNT + 1))
  sleep 2
done

if [ $POLL_COUNT -ge $MAX_POLLS ]; then
  echo ""
  echo "⚠️  任务超时（60秒）"
fi

echo ""
echo "🎉 测试完成！"
echo ""
echo "📝 总结:"
echo "  - Project ID: $PROJECT_ID"
echo "  - Task ID: $TASK_ID"
echo "  - Task Code: $TASK_CODE"
echo "  - Final Status: $TASK_STATUS"
