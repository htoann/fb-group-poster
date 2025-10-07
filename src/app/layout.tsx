import { ConfigProvider } from 'antd';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Facebook Group Poster',
  description: 'Post to Facebook groups automatically',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1677ff',
              fontFamily: "'Segoe UI', Arial, sans-serif",
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
