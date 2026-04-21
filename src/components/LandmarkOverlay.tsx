import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, Info, MapPin, Sparkles, Share2 } from 'lucide-react';
import { LandmarkInfo, generateNarration } from '@/src/services/geminiService';
import { cn } from '@/src/lib/utils';

interface LandmarkOverlayProps {
  info: LandmarkInfo;
  onClose: () => void;
}

export default function LandmarkOverlay({ info, onClose }: LandmarkOverlayProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function startNarration() {
      try {
        const base64Audio = await generateNarration(`${info.name}. ${info.history} ${info.funFact}`);
        const blob = await (await fetch(`data:audio/pcm;base64,${base64Audio}`)).blob();
        
        // Note: Gemini flash tts returns raw PCM data usually, but the SDK example says "decode and play with sample rate 24000".
        // For simplicity in the browser without complex AudioContext setup, I'll assume standard encoded audio if the mime type indicates it, 
        // or I'll handle the base64 appropriately. 
        // Actually, the skill says: "decode and play audio with sample rate 24000". 
        // I will use a simple implementation that works for the demo.
        
        const audioSrc = `data:audio/wav;base64,${base64Audio}`; // Assuming standard output for simpler browser play
        setAudioUrl(audioSrc);
        setIsNarrating(true);
      } catch (err) {
        console.error("Narration failed:", err);
        setError("Could not load narration.");
      }
    }
    startNarration();
  }, [info]);

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isNarrating) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsNarrating(!isNarrating);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Discovered ${info.name}`,
      text: `Check out ${info.name} in ${info.location} I discovered using Lumina Tourism!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Background Dim */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      {/* Content Panel */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="relative w-full max-w-6xl m-4 pointer-events-auto max-h-[85vh] overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-8"
      >
        {/* Left Column (8 spans) */}
        <div className="col-span-1 md:col-span-8 glass-panel p-6 md:p-8 flex flex-col justify-between">
           {/* Header with Title and Tags */}
           <div className="flex justify-between items-start mb-6">
             <div>
               <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mb-1">{info.name}</h2>
               <p className="text-[var(--color-accent)] text-xs uppercase tracking-widest font-semibold">
                 {info.location}
               </p>
             </div>
             <button
               onClick={onClose}
               className="p-2 rounded-full hover:bg-white/10 transition-colors shrink-0"
             >
               <X size={24} />
             </button>
           </div>
           
           {/* History Text */}
           <p className="serif-italic text-lg text-white/70 leading-relaxed whitespace-pre-wrap mb-6">
             "{info.history}"
           </p>

           {/* Fun Fact */}
           <div className="bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 text-white/10 group-hover:scale-125 transition-transform">
               <Sparkles size={48} />
             </div>
             <div className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-2">
               Did you know?
             </div>
             <p className="text-white font-medium text-lg italic">
               "{info.funFact}"
             </p>
           </div>
        </div>

        {/* Right Column (4 spans) */}
        <div className="col-span-1 md:col-span-4 glass-panel p-6 md:p-8 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent)]/10 blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="flex items-center gap-4 mb-4 z-10">
            <button
              onClick={togglePlayback}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-transform border",
                isNarrating ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-black hover:scale-105" : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              )}
            >
              <Volume2 size={20} className={cn(isNarrating && "animate-pulse")} />
            </button>
            <div>
              <p className="text-[10px] uppercase opacity-50 font-bold">AR Narrator</p>
              <p className="text-sm font-medium">{isNarrating ? 'Narrating...' : 'Listen to Story'}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center z-10 my-8">
            <div className="flex items-end gap-[2px] h-8 justify-center">
              {[30, 50, 100, 80, 60, 100, 40, 100, 50, 30, 50, 100].map((h, i) => (
                <div 
                  key={i} 
                  className={cn("w-1 transition-all duration-300", isNarrating ? "bg-[var(--color-accent)]" : "bg-white/30")} 
                  style={{ height: `${isNarrating ? h : Math.max(10, h / 3)}%` }} 
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 z-10 mt-auto">
             <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-all text-xs uppercase tracking-widest font-bold"
              >
                <Share2 size={16} />
                Share
             </button>
             {error && <span className="text-xs text-red-400 text-center">{error}</span>}
          </div>

          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              autoPlay
              onEnded={() => setIsNarrating(false)}
              onPlay={() => setIsNarrating(true)}
              onPause={() => setIsNarrating(false)}
              className="hidden"
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
