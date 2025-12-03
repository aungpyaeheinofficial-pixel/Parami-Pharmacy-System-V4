
import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';

interface CameraScannerProps {
  onScan: (data: string) => void;
  onClose?: () => void;
  className?: string;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, onClose, className = '' }) => {
  const [error, setError] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerId = useRef(`scanner-${Math.random().toString(36).substr(2, 9)}`);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    // Check if library is loaded
    if (!(window as any).Html5Qrcode) {
      setError("Scanner library not loaded. Please refresh.");
      return;
    }
    
    setIsReady(true);

    const initScanner = async () => {
      try {
        const Html5Qrcode = (window as any).Html5Qrcode;
        const html5QrCode = new Html5Qrcode(scannerId.current);
        scannerRef.current = html5QrCode;

        // Config optimized for GS1 DataMatrix
        const config = { 
            fps: 15, 
            qrbox: { width: 300, height: 300 }, // Larger box for density
            aspectRatio: 1.0,
            disableFlip: false,
        };

        await html5QrCode.start(
          { facingMode: "environment" }, 
          config,
          (decodedText: string) => {
             if (isMounted.current) {
                // Throttle/Debounce could go here
                onScan(decodedText);
             }
          },
          () => {} // Ignore per-frame errors
        );
      } catch (err) {
        console.error("Scanner Error:", err);
        if (isMounted.current) {
            setError("Could not access camera. Ensure permissions are granted.");
        }
      }
    };

    const timer = setTimeout(initScanner, 100);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      if (scannerRef.current) {
         scannerRef.current.stop().then(() => {
             scannerRef.current.clear();
         }).catch((err: any) => {
             console.warn("Scanner stop failed", err);
             scannerRef.current.clear();
         });
      }
    };
  }, [onScan]);

  return (
    <div className={`relative bg-black overflow-hidden flex flex-col items-center justify-center ${className}`}>
        <div id={scannerId.current} className="w-full h-full"></div>
        
        {(!isReady || error) && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center bg-slate-900 z-10">
                {error ? (
                    <>
                        <AlertCircle size={32} className="mb-2 text-red-500" />
                        <p className="text-sm font-medium">{error}</p>
                    </>
                ) : (
                    <div className="animate-pulse flex flex-col items-center">
                        <Camera size={32} className="mb-2 opacity-50" />
                        <p className="text-sm">Initializing High-Res Camera...</p>
                    </div>
                )}
            </div>
        )}

        {onClose && (
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 backdrop-blur-md z-20 transition-all"
            >
                <X size={20} />
            </button>
        )}
        
        {/* Viewfinder Overlay for professional feel */}
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-parami/50 rounded-xl relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-parami -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-parami -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-parami -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-parami -mb-1 -mr-1"></div>
                
                {/* Crosshair */}
                <div className="absolute top-1/2 left-1/2 w-4 h-[1px] bg-red-500/50 -translate-x-1/2"></div>
                <div className="absolute top-1/2 left-1/2 h-4 w-[1px] bg-red-500/50 -translate-y-1/2"></div>
            </div>
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-20">
            <p className="text-white/90 text-xs bg-black/60 inline-block px-4 py-1.5 rounded-full backdrop-blur-sm font-medium">
               Center DataMatrix or Barcode
            </p>
        </div>
    </div>
  );
};

export default CameraScanner;
