import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

const CountdownTimer = ({ expiryDate, onExpire, showWarning = true }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryDate).getTime();
      const difference = expiry - now;

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
  }, [expiryDate, onExpire]);

  if (isExpired) {
    return (
      <div className="flex items-center text-red-500">
        <AlertCircle className="w-4 h-4 mr-1" />
        <span className="text-sm">Expired</span>
      </div>
    );
  }

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24;
  const isVeryUrgent = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes < 60;

  const getColorClass = () => {
    if (isVeryUrgent) return 'text-red-600 bg-red-50';
    if (isUrgent) return 'text-orange-600 bg-orange-50';
    return 'text-purple-600 bg-purple-50';
  };

  const TimeUnit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <span className="font-bold tabular-nums">{value.toString().padStart(2, '0')}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  );

  return (
    <div className={`inline-flex items-center px-3 py-2 rounded-lg ${getColorClass()}`}>
      <Clock className="w-4 h-4 mr-2" />
      <div className="flex items-center space-x-2 text-sm">
        {timeLeft.days > 0 && <TimeUnit value={timeLeft.days} label="d" />}
        <TimeUnit value={timeLeft.hours} label="h" />
        <span>:</span>
        <TimeUnit value={timeLeft.minutes} label="m" />
        <span>:</span>
        <TimeUnit value={timeLeft.seconds} label="s" />
      </div>
      {showWarning && isUrgent && (
        <span className="ml-2 text-xs font-medium">Hurry!</span>
      )}
    </div>
  );
};

export default CountdownTimer;
