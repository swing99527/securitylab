import { generateText } from "ai"

// AI 摘要生成接口
export async function POST(request: Request) {
  const { content, title } = await request.json()

  try {
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `请为以下技术文章生成一个简洁的摘要（100-150字）：

标题: ${title}

内容:
${content}

要求:
1. 摘要应概括文章的核心要点
2. 使用专业但易懂的语言
3. 只输出摘要内容，不要其他说明`,
    })

    return Response.json({ summary: text.trim() })
  } catch (error) {
    console.error("AI summarize error:", error)
    return Response.json({ summary: "摘要生成失败，请稍后重试。" }, { status: 500 })
  }
}
