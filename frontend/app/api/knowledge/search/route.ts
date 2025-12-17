import { generateText } from "ai"

// AI 语义搜索接口
export async function POST(request: Request) {
  const { query, articles } = await request.json()

  try {
    // 使用 AI 进行语义理解和相关性排序
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `你是一个搜索排序助手。用户搜索: "${query}"

以下是知识库文章列表（JSON格式）:
${JSON.stringify(
  articles.map((a: { id: string; title: string; summary: string; tags: string[] }) => ({
    id: a.id,
    title: a.title,
    summary: a.summary,
    tags: a.tags,
  })),
  null,
  2,
)}

请根据语义相关性对文章进行排序，返回最相关的文章ID数组（最多10个），格式为JSON数组。
只返回JSON数组，不要其他内容。例如: ["id1", "id2", "id3"]`,
    })

    const rankedIds = JSON.parse(text.trim())
    return Response.json({ success: true, rankedIds })
  } catch (error) {
    console.error("AI search error:", error)
    return Response.json({ success: false, rankedIds: [] })
  }
}
