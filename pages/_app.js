// pages/_app.js
import { DevModeProvider } from '../components/DevMode';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <DevModeProvider>
      <Component {...pageProps} />
    </DevModeProvider>
  );
}
