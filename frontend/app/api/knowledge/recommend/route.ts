import { generateText } from "ai"

// AI 相关推荐接口
export async function POST(request: Request) {
  const { currentArticle, allArticles } = await request.json()

  try {
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `你是一个内容推荐助手。

当前文章:
- 标题: ${currentArticle.title}
- 摘要: ${currentArticle.summary}
- 标签: ${currentArticle.tags.join(", ")}

知识库中的其他文章:
${JSON.stringify(
  allArticles
    .filter((a: { id: string }) => a.id !== currentArticle.id)
    .map((a: { id: string; title: string; summary: string; tags: string[] }) => ({
      id: a.id,
      title: a.title,
      summary: a.summary,
      tags: a.tags,
    })),
  null,
  2,
)}

请推荐5篇最相关的文章，返回它们的ID数组。
考虑因素: 主题相关性、标签重叠、技术领域关联等。
只返回JSON数组，例如: ["id1", "id2", "id3", "id4", "id5"]`,
    })

    const recommendedIds = JSON.parse(text.trim())
    return Response.json({ success: true, recommendedIds })
  } catch (error) {
    console.error("AI recommend error:", error)
    return Response.json({ success: false, recommendedIds: [] })
  }
}
