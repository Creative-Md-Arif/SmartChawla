import { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';

const CountdownBanner = ({ endDate, title, subtitle, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isVisible, setIsVisible] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        onExpire?.();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate, onExpire]);

  if (!isVisible || isExpired) return null;

  const TimeUnit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
        <span className="text-xl font-bold text-purple-600">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-white/80 mt-1">{label}</span>
    </div>
  );

  return (
    <div className="relative bg-gradient-to-r from-red-500 to-pink-600 py-6 px-4 rounded-lg overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between">
        {/* Text Content */}
        <div className="text-center md:text-left mb-4 md:mb-0">
          <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
            <Clock className="w-5 h-5 text-white" />
            <span className="text-white/80 text-sm uppercase tracking-wider">Limited Time Offer</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white">{title}</h3>
          {subtitle && <p className="text-white/80 mt-1">{subtitle}</p>}
        </div>

        {/* Countdown */}
        <div className="flex items-center space-x-3">
          <TimeUnit value={timeLeft.days} label="Days" />
          <span className="text-2xl font-bold text-white">:</span>
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <span className="text-2xl font-bold text-white">:</span>
          <TimeUnit value={timeLeft.minutes} label="Mins" />
          <span className="text-2xl font-bold text-white">:</span>
          <TimeUnit value={timeLeft.seconds} label="Secs" />
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 p-1 text-white/50 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default CountdownBanner;
