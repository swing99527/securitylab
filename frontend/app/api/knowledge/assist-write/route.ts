import { generateText } from "ai"

// AI 写作助手接口
export async function POST(request: Request) {
  const { action, content, context } = await request.json()

  let prompt = ""

  switch (action) {
    case "expand":
      prompt = `请扩展以下内容，添加更多技术细节和示例：\n\n${content}`
      break
    case "simplify":
      prompt = `请简化以下技术内容，使其更易于理解：\n\n${content}`
      break
    case "format":
      prompt = `请将以下内容格式化为结构清晰的 Markdown 格式，包含适当的标题、列表和代码块：\n\n${content}`
      break
    case "proofread":
      prompt = `请检查以下内容的语法、拼写和技术准确性，并提供修改建议：\n\n${content}`
      break
    case "generate":
      prompt = `请基于以下主题生成一篇专业的技术文章：\n\n主题: ${context?.topic || content}\n\n要求:\n1. 包含引言、主要内容和总结\n2. 使用 Markdown 格式\n3. 适当添加代码示例\n4. 针对汕头人工智能实验室智能玩具安全检测系统的工程师`
      break
    default:
      prompt = content
  }

  try {
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system:
        "你是汕头人工智能实验室的技术文档写作助手，专注于网络安全、无线电测试、固件分析等领域。请使用专业、准确、易读的语言。",
      prompt,
    })

    return Response.json({ content: text })
  } catch (error) {
    console.error("AI assist-write error:", error)
    return Response.json({ content: "抱歉，AI 服务暂时不可用。请稍后重试。" }, { status: 500 })
  }
}
