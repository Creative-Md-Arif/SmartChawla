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
      // ✅ ভিডিওর আসল ডাইমেনশন সেট করুন
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

    // ✅ ভিডিও সাইজ পরিবর্তন হলে আপডেট করুন
    const handleResize = () => {
      if (video.videoWidth && video.videoHeight) {
        setVideoDimensions({
          width: video.videoWidth,
          height: video.videoHeight
        });
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('resize', handleResize);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('resize', handleResize);
    };
  }, [currentLesson, onProgress, onLessonComplete]);

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

  // ✅ অ্যাসপেক্ট রেশিও ক্যালকুলেট করুন
  const getAspectRatioClass = () => {
    if (!videoDimensions.width || !videoDimensions.height) return 'aspect-video';
    
    const ratio = videoDimensions.width / videoDimensions.height;
    
    // 16:9 (1.77) - স্ট্যান্ডার্ড ওয়াইডস্ক্রিন
    if (ratio >= 1.7 && ratio <= 1.8) return 'aspect-video';
    
    // 4:3 (1.33) - ক্লাসিক
    if (ratio >= 1.3 && ratio < 1.4) return 'aspect-[4/3]';
    
    // 21:9 (2.33) - আলট্রাওয়াইড
    if (ratio >= 2.2) return 'aspect-[21/9]';
    
    // 9:16 (0.56) - ভার্টিকাল/মোবাইল
    if (ratio <= 0.6) return 'aspect-[9/16]';
    
    // 1:1 (1.0) - স্কয়ার
    if (ratio >= 0.9 && ratio <= 1.1) return 'aspect-square';
    
    // ডিফল্ট
    return 'aspect-video';
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange({ target: { value: Math.min(volume + 0.1, 1) } });
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange({ target: { value: Math.max(volume - 0.1, 0) } });
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = (parseInt(e.key) / 10) * duration;
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, duration]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const aspectRatioClass = getAspectRatioClass();

  return (
    <div
      ref={containerRef}
      className="relative bg-neutral-900 rounded-2xl overflow-hidden shadow-premium group w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* ✅ ডাইনামিক অ্যাসপেক্ট রেশিও কন্টেইনার */}
      <div className={`relative w-full ${aspectRatioClass} bg-neutral-950`}>
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          playsInline
          preload="metadata"
          // ✅ ভিডিওর নিজস্ব সাইজ মেইনটেইন করুন
          style={{
            objectFit: 'contain',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        />
      </div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm z-10">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <MonitorPlay className="w-6 h-6 text-primary-500" />
            </div>
          </div>
        </div>
      )}

      {/* Center Play Button */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-neutral-900/30 backdrop-blur-[2px] transition-all duration-300 z-20"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/95 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 group/play">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600 ml-1 group-hover/play:text-primary-700" />
          </div>
        </button>
      )}

      {/* Video Info Overlay */}
      {videoDimensions.width > 0 && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white/80 text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
          {videoDimensions.width}x{videoDimensions.height}
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 z-40
          bg-gradient-to-t from-neutral-900/95 via-neutral-900/70 to-transparent 
          px-4 sm:px-6 pb-4 sm:pb-6 pt-12 sm:pt-20
          transition-all duration-500 ease-out
          ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="group/progress mb-4 sm:mb-6 cursor-pointer"
          onClick={handleSeek}
        >
          <div className="relative h-1.5 sm:h-2 bg-neutral-600/50 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
            
            <div 
              className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-all duration-200 scale-0 group-hover/progress:scale-100 -translate-y-1/2"
              style={{ left: `${progress}%`, marginLeft: '-8px' }}
            />
          </div>
          
          <div className="flex justify-between text-xs sm:text-sm text-neutral-300 mt-2 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={togglePlay}
              onMouseEnter={() => setHoveredControl('play')}
              onMouseLeave={() => setHoveredControl(null)}
              className={`
                p-2 sm:p-3 rounded-full transition-all duration-300
                ${hoveredControl === 'play' ? 'bg-primary-500 text-white scale-110' : 'text-white hover:bg-white/10'}
              `}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => skip(-10)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 hidden sm:flex flex-col items-center"
            >
              <SkipBack className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">10s</span>
            </button>

            <button
              onClick={() => skip(10)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 hidden sm:flex flex-col items-center"
            >
              <SkipForward className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">10s</span>
            </button>

            <div className="flex items-center space-x-2 group/volume">
              <button
                onClick={toggleMute}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              
              <div className="hidden sm:block w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-neutral-600 rounded-full appearance-none cursor-pointer accent-primary-500"
                />
              </div>
            </div>

            <span className="sm:hidden text-xs text-neutral-300 font-medium">
              {formatTime(currentTime)}
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`
                  flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium
                  transition-all duration-200
                  ${showSettings ? 'bg-primary-500 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}
                `}
              >
                <Settings className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">{playbackRate}x</span>
                <FastForward className="w-4 h-4 sm:hidden" />
              </button>

              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-neutral-800/95 backdrop-blur-sm rounded-xl p-2 shadow-2xl border border-neutral-700 min-w-[120px] animate-slide-up">
                  <p className="text-xs text-neutral-400 px-2 py-1 mb-1 font-bangla">প্লেব্যাক স্পিড</p>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`
                        block w-full px-3 py-2 text-sm rounded-lg text-left transition-all duration-200
                        ${playbackRate === rate 
                          ? 'bg-primary-500 text-white font-medium' 
                          : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
                        }
                      `}
                    >
                      {rate === 1 ? 'স্বাভাবিক (1x)' : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="sm:hidden flex justify-between text-xs text-neutral-400 mt-2">
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;