'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Loader2, MessageCircle, Zap } from 'lucide-react';
import { generateReplies } from '@/lib/api';

interface Reply {
  id: string;
  content: string;
  timestamp: number;
  displayContent?: string;
  isTyping?: boolean;
}

export default function Home() {
  const [opponentText, setOpponentText] = useState('');
  const [intensity, setIntensity] = useState([5]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingTimeouts, setTypingTimeouts] = useState<NodeJS.Timeout[]>([]);

  // 清理所有打字机定时器
  const clearAllTimeouts = () => {
    typingTimeouts.forEach(timeout => clearTimeout(timeout));
    setTypingTimeouts([]);
  };

  // 打字机效果函数
  const startTypewriterEffect = (replies: Reply[]) => {
    clearAllTimeouts();
    
    // 初始化回复，显示内容为空
    const initialReplies = replies.map(reply => ({
      ...reply,
      displayContent: '',
      isTyping: true
    }));
    setReplies(initialReplies);

    const newTimeouts: NodeJS.Timeout[] = [];

    replies.forEach((reply, replyIndex) => {
      const chars = reply.content.split('');
      
      chars.forEach((char, charIndex) => {
        const timeout = setTimeout(() => {
          setReplies(prevReplies => 
            prevReplies.map((prevReply, index) => {
              if (index === replyIndex) {
                const newDisplayContent = (prevReply.displayContent || '') + char;
                const isComplete = newDisplayContent === reply.content;
                return {
                  ...prevReply,
                  displayContent: newDisplayContent,
                  isTyping: !isComplete
                };
              }
              return prevReply;
            })
          );
        }, replyIndex * 1000 + charIndex * 50); // 每个回复延迟1秒开始，每个字符间隔50ms
        
        newTimeouts.push(timeout);
      });
    });

    setTypingTimeouts(newTimeouts);
  };

  const handleFight = async () => {
    if (!opponentText.trim()) return;

    setIsLoading(true);
    try {
      const newReplies = await generateReplies(opponentText, intensity[0]);
      
      // 使用打字机效果显示回复
      startTypewriterEffect(newReplies);
      
      // 保存到localStorage
      const history = JSON.parse(localStorage.getItem('fightHistory') || '[]');
      const newRecord = {
        id: Date.now().toString(),
        opponentText,
        intensity: intensity[0],
        replies: newReplies,
        timestamp: Date.now()
      };
      history.unshift(newRecord);
      localStorage.setItem('fightHistory', JSON.stringify(history.slice(0, 10))); // 只保留最近10条
      
    } catch (error) {
      console.error('生成回复失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 组件卸载时清理定时器
  React.useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, []);

  const getIntensityLabel = (value: number) => {
    if (value <= 2) return '温和理性';
    if (value <= 4) return '据理力争';
    if (value <= 6) return '针锋相对';
    if (value <= 8) return '火力全开';
    return '核弹级别';
  };

  const getIntensityColor = (value: number) => {
    if (value <= 2) return 'text-blue-600';
    if (value <= 4) return 'text-green-600';
    if (value <= 6) return 'text-yellow-600';
    if (value <= 8) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 头部标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-wechat-green" />
            吵架不输神器
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">输入对方的话，让AI帮你完美反击</p>
        </div>

        {/* 主要操作区域 */}
        <Card className="border-2 border-wechat-green/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-wechat-green" />
              开始反击
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 对方话语输入 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                对方说了什么？
              </label>
              <Textarea
                value={opponentText}
                onChange={(e) => setOpponentText(e.target.value)}
                placeholder="输入对方的话..."
                className="min-h-[100px] text-base border-2 border-gray-200 focus:border-wechat-green resize-none"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right">
                {opponentText.length}/500
              </div>
            </div>

            {/* 语气强烈程度 */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">
                语气强烈程度
              </label>
              <div className="space-y-3">
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">温和</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-wechat-green">
                      {intensity[0]}
                    </span>
                    <span className={`text-sm font-medium ${getIntensityColor(intensity[0])}`}>
                      {getIntensityLabel(intensity[0])}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">激烈</span>
                </div>
              </div>
            </div>

            {/* 开始吵架按钮 */}
            <Button
              onClick={handleFight}
              disabled={!opponentText.trim() || isLoading}
              className="w-full h-12 text-base font-medium bg-wechat-green hover:bg-wechat-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  AI正在思考中...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  开始吵架
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 回复结果 */}
        {replies.length > 0 && (
          <Card className="border-2 border-blue-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-900">🔥 反击回复</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {replies.map((reply, index) => (
                <div
                  key={reply.id}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-wechat-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="text-gray-800 text-base leading-relaxed flex-1">
                      <p>
                        {reply.displayContent || reply.content}
                        {reply.isTyping && (
                          <span className="inline-block w-2 h-5 bg-wechat-green ml-1 animate-pulse"></span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  💡 选择最适合的回复，让对方哑口无言！
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 底部提示 */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>🤖 由AI智能生成，仅供娱乐参考</p>
          <p>😊 理性讨论，友善交流</p>
        </div>
      </div>
    </div>
  );
}