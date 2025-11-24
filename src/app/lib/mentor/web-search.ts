/**
 * Mentor web search integration
 * Handles internet search for additional context
 */

/**
 * Search the web using Tavily API
 */
export async function searchWeb(query: string, maxResults: number = 5): Promise<Array<{
  title: string;
  url: string;
  content: string;
  score?: number;
}>> {
  if (!process.env.TAVILY_API_KEY) {
    console.warn("[searchWeb] TAVILY_API_KEY not configured, skipping web search");
    return [];
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: "basic",
        max_results: maxResults,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Tavily API error: ${error.error || "Unknown error"}`);
    }

    const data = await response.json();
    
    return (data.results || []).map((result: any) => ({
      title: result.title || "",
      url: result.url || "",
      content: result.content || "",
      score: result.score,
    }));
  } catch (error) {
    console.error("[searchWeb] Error searching web:", error);
    // Return empty array on error - don't break the flow
    return [];
  }
}

/**
 * Format web search results for AI prompt
 */
export function formatWebSearchResults(results: Array<{
  title: string;
  url: string;
  content: string;
}>): string {
  if (results.length === 0) {
    return "";
  }

  const parts = ["## Web Search Results"];
  
  results.forEach((result, index) => {
    parts.push(`### ${index + 1}. ${result.title}`);
    parts.push(`URL: ${result.url}`);
    parts.push(`Content: ${result.content.substring(0, 500)}...`);
    parts.push("");
  });

  return parts.join("\n");
}

