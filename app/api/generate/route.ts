import { NextResponse } from 'next/server';

interface Reply {
  id: string;
  content: string;
  timestamp: number;
}

function buildPrompt(text: string, level: number) {
  const basePrompt = `对方说："${text}"

请生成3条不同风格的反驳回复，要求：`;
  if (level <= 2) {
    return (
      basePrompt +
      `
1. 语气温和理性，用事实和逻辑反驳
2. 保持礼貌，避免人身攻击
3. 每条回复控制在50字以内
4. 体现高情商的表达方式
请用JSON格式返回：{"replies": ["回复1", "回复2", "回复3"]}`
    );
  }
  if (level <= 4) {
    return (
      basePrompt +
      `
1. 据理力争，逻辑清晰有力
2. 语气坚定但不失风度
3. 每条回复控制在60字以内
4. 可以适当使用反问句
请用JSON格式返回：{"replies": ["回复1", "回复2", "回复3"]}`
    );
  }
  if (level <= 6) {
    return (
      basePrompt +
      `
1. 针锋相对，直接有力反击
2. 语气较为强硬，态度鲜明
3. 每条回复控制在70字以内
4. 可以使用一些犀利的表达
请用JSON格式返回：{"replies": ["回复1", "回复2", "回复3"]}`
    );
  }
  if (level <= 8) {
    return (
      basePrompt +
      `
1. 火力全开，犀利反击
2. 语气强烈，毫不客气
3. 每条回复控制在80字以内
4. 可以使用讽刺和反讽手法
请用JSON格式返回：{"replies": ["回复1", "回复2", "回复3"]}`
    );
  }
  return (
    basePrompt +
    `
1. 核弹级别回击，毁灭性反驳
2. 语气极其强烈，不留情面
3. 每条回复控制在90字以内
4. 使用最犀利的语言和逻辑
5. 让对方彻底哑口无言
请用JSON格式返回：{"replies": ["回复1", "回复2", "回复3"]}`
  );
}

export async function POST(request: Request) {
  try {
    const { opponentText, intensity } = await request.json();

    if (!opponentText || typeof opponentText !== 'string') {
      return NextResponse.json({ error: 'opponentText is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log('API Key exists:', !!apiKey, 'Length:', apiKey?.length);
    if (!apiKey) {
      return NextResponse.json({ error: 'Server API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://fightwin.ai',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的辩论助手，擅长生成有力的反驳论据。请确保回复内容积极向上，避免使用脏话和人身攻击。',
          },
          {
            role: 'user',
            content: buildPrompt(opponentText, Number(intensity) || 5),
          },
        ],
        max_tokens: 1000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter Error:', response.status, errorText);
      return NextResponse.json({ error: `Upstream error: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    const content: string | undefined = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Empty content from model' }, { status: 502 });
    }

    let parsed: { replies?: string[] } = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch (_) {}

    let replies: string[] = parsed.replies || [];
    if (replies.length === 0) {
      const lines = content
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean);
      replies = lines
        .filter((line: string) => /^\d+\./.test(line) || line.includes('回复'))
        .slice(0, 3)
        .map((line: string) => line.replace(/^\d+\.?\s*/, '').replace(/^回复\d+：?\s*/, ''));
      if (replies.length === 0) {
        replies = lines.filter((l) => !l.includes('JSON')).slice(0, 3);
      }
    }

    while (replies.length < 3) replies.push('请重新生成回复');

    const result: Reply[] = replies.slice(0, 3).map((content: string, index: number) => ({
      id: `${Date.now()}_${index}`,
      content: content.trim(),
      timestamp: Date.now(),
    }));

    return NextResponse.json({ replies: result });
  } catch (error) {
    console.error('API Error:', error);
    const fallback: Reply[] = [
      { id: `fallback_${Date.now()}_0`, content: '你说的这个观点我觉得需要重新考虑一下。', timestamp: Date.now() },
      { id: `fallback_${Date.now()}_1`, content: '这种说法可能存在一些逻辑上的问题。', timestamp: Date.now() },
      { id: `fallback_${Date.now()}_2`, content: '我们可以从另一个角度来看待这个问题。', timestamp: Date.now() },
    ];
    return NextResponse.json({ replies: fallback }, { status: 200 });
  }
}


