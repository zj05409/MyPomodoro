import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="zh-CN">
            <Head>
                <meta charSet="utf-8" />
                <link rel="icon" href="/favicon.ico" />
                <meta name="description" content="专注于提高工作效率的番茄工作法计时应用" />
                <meta name="theme-color" content="#ff6347" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
} 