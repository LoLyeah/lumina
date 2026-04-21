import { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface CameraViewProps {
  onCapture: (image: string) => void;
  isLoading: boolean;
}

export default function CameraView({ onCapture, isLoading }: CameraViewProps) {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [onCapture]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-center">
      <Webcam
        {...({
          audio: false,
          ref: webcamRef,
          screenshotFormat: "image/jpeg",
          videoConstraints: {
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          className: "h-full w-full object-cover",
          mirrored: facingMode === 'user'
        } as any)}
      />

      {/* AR Sighting Frame */}
      <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none">
        <div className="h-full w-full border border-white/20 relative">
          {/* Corner Elements */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/60" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/60" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/60" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/60" />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-8 px-6">
        <button
          onClick={toggleCamera}
          className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
        >
          <RefreshCw size={24} />
        </button>

        <button
          onClick={capture}
          disabled={isLoading}
          className={cn(
            "p-6 rounded-full bg-white text-black hover:scale-105 active:scale-90 transition-all shadow-2xl relative",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <RefreshCw size={32} />
            </motion.div>
          ) : (
            <Camera size={32} />
          )}
          
          {/* Shutter Animation */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="absolute inset-0 bg-white rounded-full z-[-1]"
              />
            )}
          </AnimatePresence>
        </button>

        <div className="w-14" /> {/* Spacer for balance */}
      </div>

      {/* Scanning Line Animation */}
      {isLoading && (
        <motion.div
          animate={{ top: ['10%', '90%', '10%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute left-0 right-0 h-[2px] bg-white shadow-[0_0_15px_#fff] z-20"
        />
      )}

      {/* Overlay Text */}
      <div className="absolute top-12 left-0 right-0 text-center animate-pulse">
        <p className="text-white/60 text-xs font-semibold tracking-[0.2em] uppercase">
          {isLoading ? 'Analyzing Landmark...' : 'Align Landmark in View'}
        </p>
      </div>
    </div>
  );
}
