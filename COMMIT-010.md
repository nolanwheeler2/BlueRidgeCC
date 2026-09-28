# Commit 010: The club's logo, its colors, and no "Stripe" anywhere public

## The logo
The club's artwork replaces the drawn placeholder mark and the typed name.
- **Two versions in `public/brand/`**, cut from the artwork using its own transparency and sized for sharp display on retina screens:
  - `logo.png`: the original navy and gold, for light backgrounds;
  - `logo-light.png`: a light version with the **gold kept**, for over photographs and the dark footer.
- **Header:** the light logo over each page's opening photo, **crossfading** to the navy-and-gold original as the header turns solid on scroll. The header is a little taller (88px, 76px on phones) so the logo can be large enough to read "Country Club".
- **Footer:** the light logo, large.
- **Favicon and home-screen icon:** the peak and gold flag from the logo, on paper (`public/favicon.ico`, `public/apple-touch-icon.png`, `public/brand/icon-512.png`). The full lockup is too wide to read at 16px.

## The logo's colors are the site's colors
The site's ink is now the logo's navy (`#0b2540`) and its one accent is the logo's gold (`#997531`), so the brand and the site read as one. The footer, buttons, selected times and headings all follow.

## No "Stripe" on the public site
The booking summary said "Card payments handled securely by Stripe". It now reads **"Card details are encrypted and never stored by the club"**, which is still true and names nobody. Nothing else visible named the processor; the remaining mentions are code comments. This rule is added to `DESIGN-ENGINEERING.md`.

## Checked
Built and rendered at desktop and phone sizes: the header over a photo, the header after scrolling, and the footer.

## Files
- `public/brand/logo.png` (new)
- `public/brand/logo-light.png` (new)
- `public/brand/icon-512.png` (new)
- `public/favicon.ico` (new)
- `public/apple-touch-icon.png` (new)
- `components/Layout.js`
- `components/Summary.js`
- `pages/_document.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md`
