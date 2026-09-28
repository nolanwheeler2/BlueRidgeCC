// pages/_document.js
// Type (commit 008): Newsreader for display - an editorial serif with real
// optical sizes, so headlines get the tight, high-contrast cut and small text
// stays sturdy - and Hanken Grotesk for everything you read or tap. Loaded
// from Google Fonts in the browser, with Georgia and the system font standing
// in until they arrive.
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://apnuagczfgwdlthmxrsb.supabase.co" />
        {/* The club's mark: the peak and the flag from its logo (commit 010). */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..500&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <body><Main /><NextScript /></body>
    </Html>
  );
}
