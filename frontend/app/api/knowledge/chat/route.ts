import { generateText } from "ai"

export async function POST(request: Request) {
  const { messages, context } = await request.json()

  const systemPrompt = `你是汕头人工智能实验室网络测试平台的知识库助手。你的职责是：
1. 回答用户关于网络安全检测、EN 18031 合规标准、无线电测试、固件分析等方面的问题
2. 基于知识库中的文章内容提供准确的信息
3. 如果问题超出知识库范围，诚实说明并提供一般性建议

${context ? `\n相关知识库内容:\n${context}` : ""}

请用专业但易懂的方式回答问题，适当使用列表和代码示例来增强可读性。`

  try {
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    })

    return Response.json({ content: text })
  } catch (error) {
    console.error("AI chat error:", error)
    return Response.json({ content: "抱歉，AI 服务暂时不可用。请稍后重试。" }, { status: 500 })
  }
}
