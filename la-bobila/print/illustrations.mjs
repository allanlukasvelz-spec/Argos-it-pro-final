/** Original line drawings. Sparse vocabulary: olive, tomato, wheat, pizza contour.
 *  Wheat is part of the vocabulary and is not placed on the current sheet. */

export const oliveBranch = `<svg class="lb-illus lb-illus--olive" viewBox="0 0 70 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M36 144c-3-26-2-48 1-70 3-18 2-36-5-60" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
  <ellipse cx="24" cy="34" rx="10" ry="3.3" transform="rotate(-52 24 34)" stroke="currentColor" stroke-width="0.75"/>
  <ellipse cx="47" cy="46" rx="10" ry="3.3" transform="rotate(40 47 46)" stroke="currentColor" stroke-width="0.75"/>
  <ellipse cx="22" cy="60" rx="9.2" ry="3.1" transform="rotate(-48 22 60)" stroke="currentColor" stroke-width="0.75"/>
  <ellipse cx="49" cy="74" rx="9.2" ry="3.1" transform="rotate(38 49 74)" stroke="currentColor" stroke-width="0.75"/>
  <ellipse cx="23" cy="90" rx="8.4" ry="2.9" transform="rotate(-46 23 90)" stroke="currentColor" stroke-width="0.75"/>
  <ellipse cx="47" cy="102" rx="8" ry="2.7" transform="rotate(36 47 102)" stroke="currentColor" stroke-width="0.75"/>
  <circle cx="50" cy="62" r="2.15" stroke="currentColor" stroke-width="0.75"/>
  <circle cx="21" cy="78" r="1.7" stroke="currentColor" stroke-width="0.7"/>
</svg>`;

export const tomato = `<svg class="lb-illus lb-illus--tomato" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M32 56c-11.5 0-19-9-19-18.5 0-7.2 5.2-14.2 12.4-16.2 1.6 3.4 5 5.2 6.6 5.2s5-1.8 6.6-5.2C45.8 23.3 51 30.3 51 37.5 51 47 43.5 56 32 56z" stroke="currentColor" stroke-width="1.15"/>
  <path d="M32 22.5c.2-5.2.8-9.2 1.4-13" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
  <path d="M32 21c-7.2-.8-12.2-5.6-15.2-10.6M32 21c7.2-.8 12.2-5.6 15.2-10.6" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
  <path d="M23.5 20.5c3.2-3.6 5.4-4.8 8.5-4.8s5.3 1.2 8.5 4.8" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
</svg>`;

export const pizzaContour = `<svg class="lb-illus lb-illus--contour" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M80 16c30 2 52 22 58 48 5 24-5 48-26 60-20 13-46 14-64 1-16-11-26-32-24-54C26 40 50 14 80 16z" stroke="currentColor" stroke-width="1.2"/>
  <path d="M36 80c20 11 44 15 70 6" stroke="currentColor" stroke-width="0.85" stroke-linecap="round"/>
  <path d="M46 98c18 7 36 8 54 2" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"/>
</svg>`;

/** Same hand as pizzaContour: one weight of line, no fill, no clipart.
 *  Background support for the A3. Not navigation icons and not product data. */

/** Complete pizza, viewed from above. Background only. */
export const artisanPizza = `<svg class="lb-illus lb-illus--pizza" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M102 14c22 1 40 8 54 20 16 14 28 36 28 58 0 22-8 44-24 60-16 16-40 28-64 30-26 2-50-8-66-26-16-18-24-44-20-68 4-24 18-46 40-58 16-8 32-16 52-16z" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M100 30c18 0 34 7 46 18 12 12 18 28 16 46-2 18-12 34-26 44-16 12-36 16-54 14-20-2-36-14-46-30-8-14-10-32-4-48 6-16 20-30 36-38 10-4 20-6 32-6z" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
  <path d="M72 78c16-8 32-6 44 6M64 104c14 14 36 18 56 8M118 86c8 12 6 24-4 32" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
  <path d="M78 58c8-2 18 2 20 10 1 6-6 12-16 10-8-1-12-8-4-20z" stroke="currentColor" stroke-width="1.15"/>
  <path d="M122 96c10-2 18 6 14 16-4 8-16 8-20 0-2-6 0-12 6-16z" stroke="currentColor" stroke-width="1.15"/>
  <path d="M70 118c8 2 14 10 6 16-8 4-16-2-16-10 0-4 4-7 10-6z" stroke="currentColor" stroke-width="1.15"/>
  <path d="M108 128c8 0 14 6 10 12-4 4-12 2-14-4-1-4 0-8 4-8z" stroke="currentColor" stroke-width="1.1"/>
  <circle class="lb-line--tomato" cx="74" cy="86" r="9" stroke="currentColor" stroke-width="1.35"/>
  <path class="lb-line--tomato" d="M74 77.5v17M65.5 86h17" stroke="currentColor" stroke-width="0.85" stroke-linecap="round"/>
  <circle class="lb-line--tomato" cx="126" cy="72" r="8" stroke="currentColor" stroke-width="1.3"/>
  <path class="lb-line--tomato" d="M126 64.5v15M118.5 72h15" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>
  <circle class="lb-line--tomato" cx="96" cy="118" r="7.5" stroke="currentColor" stroke-width="1.25"/>
  <path class="lb-line--tomato" d="M96 111v15M89 118h14" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>
  <circle class="lb-line--tomato" cx="138" cy="112" r="6.5" stroke="currentColor" stroke-width="1.2"/>
  <path class="lb-line--tomato" d="M138 106v12M132 112h12" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"/>
  <path d="M92 42c-8 6-6 16 2 18 6-6 12-8 14-16-4-2-10-2-16-2z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M104 48c6 1 9 7 5 11" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
  <path d="M136 88c-8 4-8 14 0 16 7-3 12-8 10-14-1-2-6-3-10-2z" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/>
  <path d="M142 92c4 2 5 6 2 8" stroke="currentColor" stroke-width="0.85" stroke-linecap="round"/>
  <path d="M54 92c2-8 12-12 16-4 2 5-1 12-6 14-7 1-12-3-10-10z" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/>
  <path d="M60 94c3 2 4 6 1 8" stroke="currentColor" stroke-width="0.85" stroke-linecap="round"/>
  <path d="M112 54c-6 8-2 16 6 14 6-4 8-12 2-16-2-1-6-1-8 2z" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/>
  <circle cx="108" cy="84" r="5.2" stroke="currentColor" stroke-width="1.15"/>
  <circle cx="108" cy="84" r="1.6" stroke="currentColor" stroke-width="0.85"/>
  <circle cx="84" cy="104" r="4.4" stroke="currentColor" stroke-width="1.1"/>
  <circle cx="84" cy="104" r="1.4" stroke="currentColor" stroke-width="0.8"/>
  <circle cx="58" cy="118" r="4" stroke="currentColor" stroke-width="1.05"/>
  <circle cx="58" cy="118" r="1.2" stroke="currentColor" stroke-width="0.75"/>
  <path d="M116 104c8 0 12 6 8 11-1 2-3 2-5 2v7" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M62 74c8 1 12 7 6 12-1 1-3 2-5 2v6" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>
</svg>`;

export const burger = `<svg class="lb-illus lb-illus--burger" viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M26 64c4-30 124-32 130 2-1 10-8 14-18 14H42c-10 0-16-4-16-16z" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>
  <ellipse cx="58" cy="44" rx="5.2" ry="2.6" transform="rotate(-16 58 44)" stroke="currentColor" stroke-width="1.15"/>
  <ellipse cx="90" cy="38" rx="5" ry="2.5" transform="rotate(10 90 38)" stroke="currentColor" stroke-width="1.15"/>
  <ellipse cx="122" cy="44" rx="4.8" ry="2.4" transform="rotate(-6 122 44)" stroke="currentColor" stroke-width="1.15"/>
  <path d="M24 80c10 8 12-3 22 2 9 5 8-5 18 1 10 6 10-4 20 2 9 5 12-2 22 2 8 3 16 0 26 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  <path class="lb-line--tomato" d="M30 88h120c2 8-4 14-16 14H46c-12 0-18-6-16-14z" stroke="currentColor" stroke-width="1.7"/>
  <path d="M24 104h136l-4 8c-2 4-8 8-16 6l-8 6H46l-10-6c-8 2-16-2-18-8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
  <path d="M18 118c6-8 18-10 28-3 8 5 14-3 26 0 12 3 16-5 28 0 10 4 18 2 28 6 6 8-2 16-16 16H36c-14 0-22-8-18-19z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
  <path d="M28 132c6 12 118 14 126-4 2 8-8 14-20 14H48c-14 0-22-4-20-10z" stroke="currentColor" stroke-width="2.15" stroke-linejoin="round"/>
</svg>`;

export const fries = `<svg class="lb-illus lb-illus--fries" viewBox="0 0 160 190" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M58 98c-3-24-8-44-3-64 7 3 10 18 10 38 0 12-2 20-7 26z" fill="currentColor" fill-opacity="0.55" stroke="currentColor" stroke-width="1.85" stroke-linejoin="round"/>
  <path d="M76 100c-1-28-4-52 1-74 8 3 10 22 10 46 0 12-3 22-7 28-1 0-3 0-4 0z" fill="currentColor" fill-opacity="0.55" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>
  <path d="M96 98c3-22 7-42 2-60 7 4 9 18 7 36-1 12-4 20-9 24z" fill="currentColor" fill-opacity="0.55" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M46 104c-5-16-3-30 2-42 6 3 8 14 7 28 0 6-3 12-7 14-1 0-2 0-2 0z" fill="currentColor" fill-opacity="0.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
  <path d="M112 102c5-14 3-28-2-38 6 3 9 14 7 28-1 6-2 8-5 10z" fill="currentColor" fill-opacity="0.5" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"/>
  <path d="M68 100c-2-18 1-32-3-46 6 2 9 14 8 30 0 7-2 14-5 16z" fill="currentColor" fill-opacity="0.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
  <path d="M46 96c-4 22-10 46-14 62 18 14 78 16 96 0-4-16-10-40-14-62" stroke="currentColor" stroke-width="2.35" stroke-linejoin="round"/>
  <path d="M36 90c20 18 68 18 90-4" stroke="currentColor" stroke-width="2.15" stroke-linecap="round"/>
  <path d="M42 102c18 12 58 12 78-4" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/>
</svg>`;

export const saladBowl = `<svg class="lb-illus lb-illus--salad" viewBox="0 0 200 170" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="64" cy="78" rx="24" ry="10" transform="rotate(-32 64 78)" stroke="currentColor" stroke-width="1.45"/>
  <path d="M48 86c8-10 22-12 32-4" stroke="currentColor" stroke-width="0.85" stroke-linecap="round"/>
  <ellipse cx="102" cy="58" rx="26" ry="11" transform="rotate(8 102 58)" stroke="currentColor" stroke-width="1.5"/>
  <path d="M82 62c10-6 24-4 34 4" stroke="currentColor" stroke-width="0.85" stroke-linecap="round"/>
  <ellipse cx="142" cy="76" rx="22" ry="9" transform="rotate(34 142 76)" stroke="currentColor" stroke-width="1.45"/>
  <path d="M128 84c8-8 20-8 28 0" stroke="currentColor" stroke-width="0.85" stroke-linecap="round"/>
  <ellipse cx="48" cy="98" rx="16" ry="7" transform="rotate(-58 48 98)" stroke="currentColor" stroke-width="1.3"/>
  <ellipse cx="158" cy="96" rx="16" ry="7" transform="rotate(52 158 96)" stroke="currentColor" stroke-width="1.3"/>
  <ellipse cx="100" cy="84" rx="18" ry="8" transform="rotate(-12 100 84)" stroke="currentColor" stroke-width="1.35"/>
  <ellipse cx="78" cy="92" rx="14" ry="6.5" transform="rotate(24 78 92)" stroke="currentColor" stroke-width="1.25"/>
  <ellipse cx="126" cy="90" rx="15" ry="6.5" transform="rotate(-20 126 90)" stroke="currentColor" stroke-width="1.25"/>
  <circle class="lb-line--tomato" cx="84" cy="102" r="8" stroke="currentColor" stroke-width="1.35"/>
  <path class="lb-line--tomato" d="M84 94.5v15M76.5 102h15" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>
  <circle class="lb-line--tomato" cx="128" cy="100" r="7" stroke="currentColor" stroke-width="1.3"/>
  <path class="lb-line--tomato" d="M128 93.5v13M121.5 100h13" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"/>
  <circle cx="108" cy="112" r="5.2" stroke="currentColor" stroke-width="1.2"/>
  <circle cx="108" cy="112" r="1.7" stroke="currentColor" stroke-width="0.85"/>
  <path d="M22 108c16 36 140 38 158-2" stroke="currentColor" stroke-width="2.15" stroke-linecap="round"/>
  <path d="M16 104c22-18 146-18 168 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M36 114c28 16 100 16 130-2" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>
</svg>`;

export const iceCream = `<svg class="lb-illus lb-illus--ice" viewBox="0 0 120 168" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M60 12c16 0 28 12 28 26 0 14-10 24-22 26-14 3-30 0-36-12-8-16 6-40 30-40z" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M34 64c2 16 14 26 26 28 16 2 32-8 34-26" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M42 90l18 64 20-64" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M48 78c6 4 16 4 24 0" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/>
  <path d="M50 106c8 3 16 2 22-3M52 122c7 3 14 2 18-2M56 138c5 2 10 2 13-1" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/>
  <path d="M54 94l8 52M68 94l-4 48" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>
</svg>`;

export const wineGlass = `<svg class="lb-illus lb-illus--wine" viewBox="0 0 100 170" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M24 16h52c1 24-4 42-16 56-5 5-8 7-10 7s-5-2-10-7C28 58 23 40 24 16z" stroke="currentColor" stroke-width="2.15" stroke-linejoin="round"/>
  <path d="M24 16c8 6 44 6 52 0" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/>
  <path class="lb-line--tomato" d="M32 48c8 10 28 10 36 0" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/>
  <path d="M50 79v48" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
  <ellipse cx="50" cy="132" rx="26" ry="7" stroke="currentColor" stroke-width="1.9"/>
</svg>`;

/** Four corner sprigs. Same leaf construction as the olive study, each drawn apart.
 *  Not a rotation of one file and not a cut from the logo master. */
export const laurelTl = `<svg class="lb-laurel lb-laurel--tl" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M4 36c48 8 96 28 156 72" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M30 6c10 52 32 104 78 150" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M18 22c28 14 48 36 62 66" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/>
  <ellipse cx="48" cy="40" rx="26" ry="8" transform="rotate(-28 48 40)" stroke="currentColor" stroke-width="1.25"/>
  <ellipse cx="78" cy="58" rx="22" ry="7" transform="rotate(16 78 58)" stroke="currentColor" stroke-width="1.15"/>
  <ellipse cx="36" cy="68" rx="20" ry="6.5" transform="rotate(-52 36 68)" stroke="currentColor" stroke-width="1.15"/>
  <ellipse cx="108" cy="78" rx="22" ry="7" transform="rotate(10 108 78)" stroke="currentColor" stroke-width="1.1"/>
  <ellipse cx="58" cy="92" rx="18" ry="6" transform="rotate(-22 58 92)" stroke="currentColor" stroke-width="1.05"/>
  <ellipse cx="138" cy="102" rx="20" ry="6.4" transform="rotate(22 138 102)" stroke="currentColor" stroke-width="1.05"/>
  <ellipse cx="78" cy="118" rx="18" ry="6" transform="rotate(-40 78 118)" stroke="currentColor" stroke-width="1.05"/>
  <ellipse cx="52" cy="112" rx="16" ry="5.4" transform="rotate(30 52 112)" stroke="currentColor" stroke-width="1"/>
  <ellipse cx="112" cy="132" rx="16" ry="5.2" transform="rotate(-18 112 132)" stroke="currentColor" stroke-width="1"/>
  <circle class="lb-line--tomato" cx="92" cy="74" r="3.2" stroke="currentColor" stroke-width="1.05"/>
</svg>`;

export const laurelTr = `<svg class="lb-laurel lb-laurel--tr" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M236 28c-52 14-100 40-148 84" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M210 4c-8 56-28 108-74 154" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
  <path d="M220 26c-30 10-50 36-58 68" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
  <ellipse cx="190" cy="42" rx="26" ry="8" transform="rotate(24 190 42)" stroke="currentColor" stroke-width="1.25"/>
  <ellipse cx="158" cy="62" rx="20" ry="6.6" transform="rotate(-18 158 62)" stroke="currentColor" stroke-width="1.15"/>
  <ellipse cx="204" cy="72" rx="22" ry="7" transform="rotate(46 204 72)" stroke="currentColor" stroke-width="1.15"/>
  <ellipse cx="128" cy="88" rx="20" ry="6.4" transform="rotate(-8 128 88)" stroke="currentColor" stroke-width="1.1"/>
  <ellipse cx="168" cy="98" rx="22" ry="7" transform="rotate(18 168 98)" stroke="currentColor" stroke-width="1.1"/>
  <ellipse cx="104" cy="118" rx="18" ry="6" transform="rotate(-30 104 118)" stroke="currentColor" stroke-width="1.05"/>
  <ellipse cx="148" cy="128" rx="16" ry="5.4" transform="rotate(32 148 128)" stroke="currentColor" stroke-width="1"/>
  <ellipse cx="186" cy="112" rx="15" ry="5.2" transform="rotate(-40 186 112)" stroke="currentColor" stroke-width="1"/>
  <circle class="lb-line--tomato" cx="172" cy="78" r="3.4" stroke="currentColor" stroke-width="1.05"/>
</svg>`;

export const laurelBl = `<svg class="lb-laurel lb-laurel--bl" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M6 206c42-16 90-46 142-92" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M28 234c12-54 40-104 90-142" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
  <path d="M22 214c26-18 44-42 54-72" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
  <ellipse cx="46" cy="196" rx="24" ry="7.6" transform="rotate(18 46 196)" stroke="currentColor" stroke-width="1.25"/>
  <ellipse cx="78" cy="174" rx="20" ry="6.6" transform="rotate(-34 78 174)" stroke="currentColor" stroke-width="1.15"/>
  <ellipse cx="38" cy="168" rx="18" ry="6" transform="rotate(8 38 168)" stroke="currentColor" stroke-width="1.1"/>
  <ellipse cx="108" cy="152" rx="22" ry="7" transform="rotate(-16 108 152)" stroke="currentColor" stroke-width="1.1"/>
  <ellipse cx="64" cy="146" rx="16" ry="5.6" transform="rotate(28 64 146)" stroke="currentColor" stroke-width="1.05"/>
  <ellipse cx="136" cy="128" rx="18" ry="6" transform="rotate(-10 136 128)" stroke="currentColor" stroke-width="1.05"/>
  <ellipse cx="92" cy="124" rx="16" ry="5.4" transform="rotate(22 92 124)" stroke="currentColor" stroke-width="1"/>
  <ellipse cx="58" cy="118" rx="14" ry="5" transform="rotate(-46 58 118)" stroke="currentColor" stroke-width="1"/>
  <circle class="lb-line--tomato" cx="86" cy="160" r="3.1" stroke="currentColor" stroke-width="1"/>
</svg>`;

export const laurelBr = `<svg class="lb-laurel lb-laurel--br" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M234 204c-50-10-96-38-140-82" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M212 234c-14-52-42-100-90-140" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
  <path d="M216 208c-28-14-46-40-54-70" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/>
  <ellipse cx="194" cy="198" rx="26" ry="8" transform="rotate(-14 194 198)" stroke="currentColor" stroke-width="1.25"/>
  <ellipse cx="164" cy="176" rx="20" ry="6.6" transform="rotate(26 164 176)" stroke="currentColor" stroke-width="1.15"/>
  <ellipse cx="200" cy="166" rx="18" ry="6" transform="rotate(-38 200 166)" stroke="currentColor" stroke-width="1.1"/>
  <ellipse cx="136" cy="158" rx="20" ry="6.5" transform="rotate(8 136 158)" stroke="currentColor" stroke-width="1.1"/>
  <ellipse cx="172" cy="146" rx="18" ry="6" transform="rotate(-20 172 146)" stroke="currentColor" stroke-width="1.05"/>
  <ellipse cx="112" cy="136" rx="16" ry="5.5" transform="rotate(16 112 136)" stroke="currentColor" stroke-width="1.05"/>
  <ellipse cx="148" cy="122" rx="15" ry="5.2" transform="rotate(-28 148 122)" stroke="currentColor" stroke-width="1"/>
  <ellipse cx="180" cy="118" rx="14" ry="5" transform="rotate(12 180 118)" stroke="currentColor" stroke-width="0.95"/>
  <circle class="lb-line--tomato" cx="156" cy="164" r="3.3" stroke="currentColor" stroke-width="1.05"/>
</svg>`;

export const wheat = `<svg class="lb-illus lb-illus--wheat" viewBox="0 0 40 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M20 112V18" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>
  <ellipse cx="14" cy="28" rx="5" ry="2.2" transform="rotate(-35 14 28)" stroke="currentColor" stroke-width="0.7"/>
  <ellipse cx="26" cy="34" rx="5" ry="2.2" transform="rotate(35 26 34)" stroke="currentColor" stroke-width="0.7"/>
  <ellipse cx="13" cy="44" rx="5" ry="2.2" transform="rotate(-35 13 44)" stroke="currentColor" stroke-width="0.7"/>
  <ellipse cx="27" cy="50" rx="5" ry="2.2" transform="rotate(35 27 50)" stroke="currentColor" stroke-width="0.7"/>
  <ellipse cx="13" cy="60" rx="4.6" ry="2" transform="rotate(-32 13 60)" stroke="currentColor" stroke-width="0.7"/>
  <ellipse cx="27" cy="66" rx="4.6" ry="2" transform="rotate(32 27 66)" stroke="currentColor" stroke-width="0.7"/>
</svg>`;
