import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ScanLine, ArrowRight } from 'lucide-react';
import CameraView from './components/CameraView';
import LandmarkOverlay from './components/LandmarkOverlay';
import { identifyAndFetchHistory, LandmarkInfo } from './services/geminiService';

export default function App() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeLandmark, setActiveLandmark] = useState<LandmarkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (base64Image: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await identifyAndFetchHistory(base64Image);
      setActiveLandmark(data);
    } catch (err) {
      console.error("Discovery error:", err);
      setError("We couldn't recognize this landmark. Please try again with a clearer shot.");
      // Auto-clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="atmosphere-bg" />

      {/* Main View Transition */}
      <AnimatePresence mode="wait">
        {!isCameraActive ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-sm"
          >
            <div className="max-w-2xl text-center flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center mb-8 relative glass-panel">
                <div className="absolute inset-0 rounded-full border border-[var(--color-accent)] animate-ping opacity-20 duration-1000"></div>
                <ScanLine size={40} className="text-[var(--color-accent)]" />
              </div>
              
              <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight">
                Lumina<span className="font-semibold text-[var(--color-accent)]">Lens</span>
              </h1>
              
              <p className="text-white/70 text-lg md:text-xl font-light mb-12 max-w-xl leading-relaxed">
                Discover the stories behind your surroundings. Point your camera at any architectural landmark to reveal its history, narrated through an immersive AR guide.
              </p>
              
              <button 
                onClick={() => setIsCameraActive(true)}
                className="group relative px-8 py-4 rounded-full glass-panel overflow-hidden border border-[var(--color-accent)]/30 hover:border-[var(--color-accent)] transition-all duration-500"
              >
                <div className="absolute inset-0 bg-[var(--color-accent)]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <span className="relative flex items-center gap-3 text-sm tracking-widest uppercase font-bold text-white group-hover:text-[var(--color-accent)] transition-colors">
                  Initialize System <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute inset-0"
          >
            <CameraView 
              onCapture={handleCapture} 
              isLoading={isLoading} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <div className="fixed top-12 left-0 right-0 z-[60] flex justify-center px-4">
            <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl text-sm font-medium">
              {error}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Recognition Overlay */}
      <AnimatePresence>
        {activeLandmark && (
          <LandmarkOverlay 
            info={activeLandmark} 
            onClose={() => setActiveLandmark(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

