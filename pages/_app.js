// pages/_app.js
import { DevModeProvider } from '../components/DevMode';
import { MemberProvider } from '../components/Member';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <DevModeProvider>
      <MemberProvider>
        <Component {...pageProps} />
      </MemberProvider>
    </DevModeProvider>
  );
}
