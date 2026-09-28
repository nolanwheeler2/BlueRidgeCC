// pages/_app.js
import { DevModeProvider } from '../components/DevMode';
import { MemberProvider } from '../components/Member';
import { ClubProvider } from '../components/Club';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <DevModeProvider>
      <ClubProvider>
        <MemberProvider>
          <Component {...pageProps} />
        </MemberProvider>
      </ClubProvider>
    </DevModeProvider>
  );
}
