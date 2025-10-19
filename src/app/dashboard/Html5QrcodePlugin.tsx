import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Html5QrcodePluginProps {
  onScan: (decodedText: string) => void;
}

export default function Html5QrcodePlugin({ onScan }: Html5QrcodePluginProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null); // Aquí guardamos el escáner

  useEffect(() => {
    const qrRegionId = "html5qr-code-full-region";
    if (!qrRef.current) return;

    const html5QrCode = new Html5Qrcode(qrRegionId);
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await onScan(decodedText);

          // ✅ Detenemos el escáner correctamente para evitar bucles infinitos
          try {
            await html5QrCode.stop();
            html5QrCode.clear();
          } catch (err) {
            console.error("Error al detener el escáner:", err);
          }
        },
        (errorMessage) => {
          // Puedes silenciar o mostrar errores de escaneo aquí
        }
      )
      .catch((err) => {
        console.error("Error al iniciar el escáner:", err);
      });

    // Cleanup al desmontar el componente
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
  }, [onScan]);

  return <div id="html5qr-code-full-region" ref={qrRef} className="w-full" />;
}
