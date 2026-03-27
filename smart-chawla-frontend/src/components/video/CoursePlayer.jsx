import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  FastForward,
  MonitorPlay
} from 'lucide-react';

const CoursePlayer = ({ videoUrl, lessons, currentLesson, onProgress, onLessonComplete }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredControl, setHoveredControl] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const controlsTimeoutRef = useRef(null);

  // ভিডিও ইভেন্ট হ্যান্ডলার
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
      onProgress?.(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      // ভিডিওর আসল ডাইমেনশন ডিটেক্ট করা
      setVideoDimensions({
        width: video.videoWidth,
        height: video.videoHeight
      });
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    const handleEnded = () => {
      setIsPlaying(false);
      onLessonComplete?.(currentLesson?._id);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentLesson, onProgress, onLessonComplete, videoUrl]);

  // প্লে/পজ কন্ট্রোল
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // সিক বার কন্ট্রোল
  const handleSeek = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress(pos * 100);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const changePlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
    }
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  // ✅ ৯:১৬, ১:১ এবং ১৬:৯ এর জন্য ডাইনামিক স্টাইল ফিক্স
  const getDynamicStyles = () => {
    if (!videoDimensions.width || !videoDimensions.height) return { maxWidth: '1000px', aspectRatio: '16/9' };
    
    const ratio = videoDimensions.width / videoDimensions.height;
    
    // ৯:১৬ ভার্টিকাল ভিডিও (Shorts Style)
    if (ratio < 0.7) {
      return {
        maxWidth: '420px', 
        aspectRatio: '9/16',
        margin: '0 auto',
        maxHeight: '80vh' // স্ক্রিনের বাইরে যেন না যায়
      };
    }
    
    // ১:১ স্কয়ার ভিডিও
    if (ratio >= 0.8 && ratio <= 1.2) {
      return {
        maxWidth: '600px',
        aspectRatio: '1/1',
        margin: '0 auto'
      };
    }

    // ডিফল্ট ১৬:৯ ওয়াইডস্ক্রিন
    return {
      maxWidth: '1000px',
      aspectRatio: '16/9',
      margin: '0 auto'
    };
  };

  // কিবোর্ড শর্টকাট
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k': e.preventDefault(); togglePlay(); break;
        case 'arrowleft': e.preventDefault(); skip(-10); break;
        case 'arrowright': e.preventDefault(); skip(10); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 'm': e.preventDefault(); toggleMute(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration]);

  const dynamicStyles = getDynamicStyles();

  return (
    <div className="w-full bg-neutral-950 p-2 sm:p-4 flex justify-center items-center min-h-[400px]">
      <div
        ref={containerRef}
        style={dynamicStyles}
        className="relative bg-black rounded-2xl overflow-hidden shadow-2xl group w-full transition-all duration-500 border border-white/5"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* ভিডিও প্লেয়ার */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain bg-black"
          onClick={togglePlay}
          playsInline
        />

        {/* লোডিং স্পিনার */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-[2px]">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}

        {/* মাঝখানের প্লে বাটন */}
        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <button 
              onClick={togglePlay} 
              className="w-16 h-16 sm:w-20 sm:h-20 bg-white/95 text-primary-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl group/play"
            >
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
            </button>
          </div>
        )}

        {/* কন্ট্রোলস ওভারলে */}
        <div 
          className={`
            absolute bottom-0 left-0 right-0 z-40 
            bg-gradient-to-t from-black/95 via-black/60 to-transparent 
            p-4 sm:p-6 pt-20 transition-opacity duration-300
            ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          {/* প্রগ্রেস বার */}
          <div 
            ref={progressRef} 
            className="group/progress relative h-1.5 bg-white/20 rounded-full cursor-pointer mb-5" 
            onClick={handleSeek}
          >
            <div 
              className="absolute h-full bg-primary-500 rounded-full transition-all duration-100" 
              style={{ width: `${progress}%` }} 
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform" />
            </div>
          </div>

          {/* বাটনের সারি */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button onClick={togglePlay} className="hover:text-primary-400 transition-colors">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
              </button>

              <div className="flex items-center space-x-2 group/volume">
                <button onClick={toggleMute} className="hover:text-primary-400">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  value={isMuted ? 0 : volume} 
                  onChange={handleVolumeChange} 
                  className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/30 rounded-full appearance-none accent-primary-500 cursor-pointer" 
                />
              </div>

              <span className="text-xs sm:text-sm font-mono tracking-wider">
                {formatTime(currentTime)} <span className="text-white/30 mx-1">/</span> {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-5">
              {/* প্লেব্যাক স্পিড মেনু */}
              <div className="relative">
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className="flex items-center space-x-1 text-[10px] sm:text-xs font-bold bg-white/10 px-2 py-1.5 rounded-lg hover:bg-white/20 border border-white/5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{playbackRate}x</span>
                </button>
                
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-3 bg-neutral-900/95 backdrop-blur-md border border-white/10 rounded-xl p-1.5 shadow-2xl min-w-[120px]">
                    {[0.5, 1, 1.25, 1.5, 2].map(rate => (
                      <button 
                        key={rate} 
                        onClick={() => changePlaybackRate(rate)} 
                        className={`block w-full px-4 py-2 text-xs text-left rounded-lg transition-colors ${playbackRate === rate ? 'bg-primary-600 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                      >
                        {rate === 1 ? 'Normal' : `${rate}x Speed`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={toggleFullscreen} className="hover:text-primary-400 transition-colors">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;