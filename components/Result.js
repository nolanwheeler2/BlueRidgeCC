// components/Result.js
// Pages still mark their requests with <Result>. Since commit 008 every call is
// captured by the developer console (components/DevConsole) instead of being
// printed into the page, so this renders nothing - the site reads as a club's
// own in a demo, and the console shows all of it when Developer view is on.
export default function Result() {
  return null;
}
