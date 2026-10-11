// 지도와 장면의 간단한 선화. 외부 이미지 없이 첫 버전을 실행할 수 있습니다.
const shapes = {
  home: '<path d="M14 38L34 20l20 18M20 33v27h28V33M31 60V45h10v15M59 32l13-10 14 10v28H59ZM64 40h6m6 0h6m-18 8h6m6 0h6M10 62h81"/>',
  school: '<path d="M17 60V31h66v29M39 31V20h22v11M12 60h76M45 60V45h11v15M24 39h8m34 0h8M24 48h8m34 0h8M50 21v-7m0 0h15v8H50"/>',
  library: '<path d="M17 60V31l33-15 33 15v29M12 60h76M29 36v24m14-24v24m14-24v24m14-24v24M17 31h66M45 26h10"/>',
  square: '<path d="M10 58h80M14 55V25h20v30M39 55V34h23v21M69 55V19h17v36M19 32h8m-8 7h8m16 4h14M74 26h7m-7 8h7M44 63h13"/>',
  market: '<path d="M16 60V34h30v26M53 60V34h31v26M12 34l8-14h22l8 14ZM49 34l8-14h23l8 14ZM22 45h9v15m5-15h5M59 45h9v15m6-15h5M10 61h80"/>',
  river: '<path d="M10 56q12-6 24 0t24 0t24 0M10 64q12-6 24 0t24 0t24 0M17 24v21m-10-9 10-16 10 16ZM62 32h25m-23 5h22m-20 0v9m17-9v9M39 19h1m-3 4h5"/>',
  old: '<path d="M10 60h80M16 60V28h24v32m-30-32 18-12 18 12M22 39h12M61 60V27m-8 0h29m-29 0 5-8h20l5 8M57 42h21m-18 0v9m15-9v9M64 31h9v6h-9"/>',
};
export function streetArt(type, className = '') {
  return `<svg class="${className}" viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">${shapes[type] || shapes.home}</svg>`;
}
export const hourglass = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M5 3h14M5 21h14M7 3v4l10 10v4M17 3v4L7 17v4M9 18h6"/></svg>';
export function stationArt() {
  return `<svg class="scene-art" viewBox="0 0 620 190" role="img" aria-label="밤의 오래된 버스 정류장"><defs><pattern id="rain" width="35" height="28" patternUnits="userSpaceOnUse"><path d="M5 0L2 7" stroke="#444" stroke-width=".8"/></pattern></defs><rect width="620" height="190" fill="url(#rain)"/><g fill="none" stroke="#777" stroke-width="1.2"><path d="M0 162h620M38 162V97h110v65M22 97l71-38 71 38M57 112h24v21H57m47-21h24v21h-24M366 161V67m-35 0h130l-16-16H347ZM439 67v94M341 119h109m-103 0v28m97-28v28M253 162V42m-1 0h24m-1 0v9"/></g><rect x="377" y="82" width="47" height="43" fill="#151515" stroke="#999"/><g stroke="#777"><path d="M384 92h32m-32 7h23m-23 7h29m-29 7h17"/></g><rect x="268" y="48" width="14" height="5" fill="#eee"/><path d="M286 158h15l-4 5h-15Z" fill="#ddd"/></svg>`;
}
