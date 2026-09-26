// components/Icons.js
// Simple line icons, drawn here so the site needs no icon library.
const S = (props) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props} />;
export const Flag = () => <S><path d="M5 21V4" /><path d="M5 4h11l-2 3.5L16 11H5" /><ellipse cx="9" cy="21" rx="5" ry="1" /></S>;
export const Screen = () => <S><rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M8 20h8M12 16v4" /><circle cx="12" cy="10" r="1.6" /></S>;
export const Racket = () => <S><circle cx="9" cy="9" r="5.5" /><path d="M13 13l7 7" /><circle cx="18" cy="5" r="1.4" /></S>;
export const Bed = () => <S><path d="M3 18V7M3 13h18v5M21 18v-3a3 3 0 00-3-3h-7v1" /><circle cx="7" cy="10.5" r="1.8" /></S>;
export const Fork = () => <S><path d="M7 3v8a2 2 0 002 2h0v8M5 3v5M9 3v5M17 3c-1.7 0-3 2-3 5s1.3 4 3 4v9" /></S>;
export const Trophy = () => <S><path d="M8 4h8v4a4 4 0 01-8 0V4zM8 6H5a2 2 0 002 3M16 6h3a2 2 0 01-2 3M12 12v4M8 20h8M9 16h6" /></S>;
export const Glass = () => <S><path d="M8 3h8l-1 7a3 3 0 01-6 0L8 3zM12 13v7M9 20h6" /></S>;
export const Check = () => <S width="22" height="22"><path d="M5 12l5 5L19 7" /></S>;
