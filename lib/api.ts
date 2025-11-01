interface Reply {
  id: string;
  content: string;
  timestamp: number;
}

export async function generateReplies(opponentText: string, intensity: number): Promise<Reply[]> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opponentText, intensity }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const replies = (data.replies || []) as Reply[];
    return replies;
  } catch (error) {
    console.error('生成回复时发生错误:', error);
    const fallbackReplies = [
      '你说的这个观点我觉得需要重新考虑一下。',
      '这种说法可能存在一些逻辑上的问题。',
      '我们可以从另一个角度来看待这个问题。'
    ];
    return fallbackReplies.map((content, index) => ({
      id: `fallback_${Date.now()}_${index}`,
      content,
      timestamp: Date.now()
    }));
  }
}