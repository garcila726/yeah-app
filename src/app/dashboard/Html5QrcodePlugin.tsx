import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Html5QrcodePluginProps {
  onScan: (decodedText: string) => void;
}

export default function Html5QrcodePlugin({ onScan }: Html5QrcodePluginProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const qrRegionId = "html5qr-code-full-region";

    if (!qrRef.current) return;

    const html5QrCode = new Html5Qrcode(qrRegionId);
    const config = { fps: 10, qrbox: 250 };

    html5QrCode
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          html5QrCode.stop();
          onScan(decodedText);
        },
        (error) => {
          console.warn("QR error:", error);
        }
      )
      .catch((err) => {
        console.error("Unable to start scanning", err);
      });

    return () => {
      html5QrCode.stop().catch((err) => console.error("Stop failed", err));
    };
  }, [onScan]);

  return <div id="html5qr-code-full-region" ref={qrRef} className="w-full" />;
}
