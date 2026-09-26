// pages/_document.js
// Fonts load in the browser from Google Fonts, so the build never depends on
// reaching them; Georgia and the system font stand in until they arrive.
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <body><Main /><NextScript /></body>
    </Html>
  );
}
