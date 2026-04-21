import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import CameraView from './components/CameraView';
import LandmarkOverlay from './components/LandmarkOverlay';
import { identifyAndFetchHistory, LandmarkInfo } from './services/geminiService';

export default function App() {
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

      {/* Main View */}
      <CameraView 
        onCapture={handleCapture} 
        isLoading={isLoading} 
      />

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

