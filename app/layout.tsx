import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '吵架包赢 - AI智能反驳助手',
  description: '输入对方的话，让AI帮你生成完美的反驳回复，吵架从此无敌！',
  keywords: '吵架,反驳,AI,智能回复,辩论助手',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">{children}</body>
    </html>
  );
}