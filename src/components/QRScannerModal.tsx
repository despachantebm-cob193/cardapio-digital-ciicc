import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }: QRScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader-target';

  // State to simulate or test QR code if running inside sandboxed iframe without camera permissions
  const [simulatedCode, setSimulatedCode] = useState('?mesa=3');

  useEffect(() => {
    if (!isOpen) {
      cleanupScanner();
      return;
    }

    setLoading(true);
    setError(null);

    // Give the DOM a tiny bit of time to render the target div
    const timer = setTimeout(() => {
      Html5Qrcode.getCameras()
        .then((devices) => {
          setAvailableDevices(devices);
          if (devices.length === 0) {
            setError('Nenhuma câmera encontrada no seu dispositivo.');
            setLoading(false);
            return;
          }

          const html5Qrcode = new Html5Qrcode(containerId);
          scannerRef.current = html5Qrcode;

          // Start scanning with environment camera first
          html5Qrcode
            .start(
              { facingMode: 'environment' },
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
              },
              (decodedText) => {
                // Success
                onScanSuccess(decodedText);
                cleanupAndClose();
              },
              () => {
                // Ignore silent failures from scans
              }
            )
            .then(() => {
              setLoading(false);
            })
            .catch((err) => {
              console.warn('Erro ao iniciar câmera:', err);
              // Fallback to manual selection or simulator since we might be in AI Studio preview iframe
              setError('Não foi possível obter acesso direto à câmera. Use o simulador ao lado ou insira manualmente.');
              setLoading(false);
            });
        })
        .catch((err) => {
          console.error('Falha ao obter câmeras:', err);
          setError('Permissão de câmera negada ou indisponível.');
          setLoading(false);
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [isOpen]);

  const cleanupScanner = () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch((e) => console.log('Erro ao parar camera:', e));
        }
      } catch (e) {
        console.log(e);
      }
      scannerRef.current = null;
    }
  };

  const cleanupAndClose = () => {
    cleanupScanner();
    onClose();
  };

  const handleSimulateSubmit = () => {
    // Generate simulated URL or action
    let finalUrl = simulatedCode;
    // Ensure it mimics a store URL
    if (!simulatedCode.startsWith('http') && !simulatedCode.startsWith('?')) {
      finalUrl = `?mesa=${simulatedCode}`;
    }
    onScanSuccess(finalUrl);
    cleanupAndClose();
  };

  if (!isOpen) return null;

  return (
    <div id="qr-scanner-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="font-display font-semibold text-lg text-white">Escanear QR Code</h3>
          </div>
          <button
            id="close-scanner-btn"
            onClick={cleanupAndClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-zinc-400 text-sm mb-4 text-center">
            Aponte a câmera do seu celular para o QR Code impresso na mesa para abrir o cardápio da mesa correspondente.
          </p>

          {/* Camera Scan Area */}
          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-zinc-950 aspect-square border border-zinc-800/50 mb-6">
            <div id={containerId} className="w-full h-full object-cover" />

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/90 z-10">
                <div id="scanner-spinner" className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                <span className="text-sm font-medium text-zinc-400">Iniciando câmera...</span>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 p-5 flex flex-col items-center justify-center text-center bg-zinc-950/95 z-10">
                <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
                <h4 className="text-white font-medium text-sm mb-1">Câmera indisponível</h4>
                <p className="text-zinc-500 text-xs px-4 leading-relaxed mb-4">
                  {error}
                </p>
                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-[10px] text-amber-400 font-mono">
                  Ambiente Sandbox / iFrame
                </div>
              </div>
            )}
          </div>

          {/* Fallback Simulator (Super convenient for iframe previews) */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl">
            <h4 className="font-display font-medium text-sm text-amber-400 mb-2">Simulador de QR Code (Mesa)</h4>
            <p className="text-zinc-500 text-xs mb-3">
              Como o preview do AI Studio roda em um iframe protegido, você pode simular a leitura do QR Code digitando o número da mesa abaixo ou o código:
            </p>
            <div className="flex gap-2">
              <input
                id="simulated-code-input"
                type="text"
                placeholder="Ex Lamp: 3 ou ?mesa=5"
                value={simulatedCode}
                onChange={(e) => setSimulatedCode(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                id="simulate-scan-btn"
                onClick={handleSimulateSubmit}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-amber-500/10"
              >
                Simular Scan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
