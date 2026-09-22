/** DEV QR only. Error correction Q, quiet zone of 4 modules, black on white. */

import { qrcode } from "./vendor/qrcode.mjs";

export function devQrSvg(url) {
  if (!/^http:\/\/127\.0\.0\.1:\d+\/carta$/.test(url)) {
    throw new Error("Solo se dibuja un QR_DEV local hacia /carta.");
  }
  const qr = qrcode(0, "Q");
  qr.addData(url);
  qr.make();
  const svg = qr.createSvgTag({
    cellSize: 2,
    margin: 8,
    scalable: true,
    alt: "QR_DEV",
    title: "QR_DEV",
  });
  return svg.replace("<svg ", '<svg class="lb-qr__svg" data-qr="QR_DEV" ');
}
