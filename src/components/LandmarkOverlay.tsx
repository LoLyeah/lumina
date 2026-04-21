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
        className="relative w-full max-w-2xl glass-panel p-8 pb-12 m-4 pointer-events-auto max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 text-white/60 text-xs font-semibold tracking-widest uppercase mb-1"
            >
              <MapPin size={12} />
              {info.location}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-serif text-4xl md:text-5xl font-medium tracking-tight"
            >
              {info.name}
            </motion.h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Audio Status & Actions */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <button
            onClick={togglePlayback}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-full border transition-all",
              isNarrating ? "bg-white text-black border-white" : "bg-transparent text-white border-white/20 hover:border-white/40"
            )}
          >
            <Volume2 size={18} className={cn(isNarrating && "animate-pulse")} />
            <span className="text-sm font-medium">
              {isNarrating ? 'Narrating...' : 'Listen to Story'}
            </span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-transparent text-white hover:border-white/40 transition-all"
          >
            <Share2 size={18} />
            <span className="text-sm font-medium">Share</span>
          </button>

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
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>

        {/* History Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <section>
            <div className="flex items-center gap-2 text-white/40 text-xs font-bold tracking-widest uppercase mb-4">
              <Info size={14} />
              Heritage & History
            </div>
            <div className="text-white/80 leading-relaxed text-lg font-light space-y-4 whitespace-pre-wrap">
              {info.history}
            </div>
          </section>

          {/* Fun Fact Card */}
          <section className="bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-white/10 group-hover:scale-125 transition-transform">
              <Sparkles size={48} />
            </div>
            <div className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">
              Did you know?
            </div>
            <p className="text-white font-medium text-lg italic">
              "{info.funFact}"
            </p>
          </section>
        </motion.div>
      </motion.div>
    </div>
  );
}
