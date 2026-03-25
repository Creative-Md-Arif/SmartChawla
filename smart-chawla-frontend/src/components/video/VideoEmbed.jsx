import React from 'react';

const VideoEmbed = ({ videoUrl, title = "Lesson Video" }) => {
  if (!videoUrl) return null;

  // Helper: YouTube ID extraction
  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Helper: Vimeo ID extraction
  const getVimeoId = (url) => {
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Helper: ScreenPal ID extraction
  const getScreenPalId = (url) => {
    // go.screenpal.com/watch/cOeI1BnZCbA
    const regExp = /screenpal\.com\/watch\/([a-zA-Z0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Determine video type
  const youtubeId = getYouTubeId(videoUrl);
  const vimeoId = getVimeoId(videoUrl);
  const screenPalId = getScreenPalId(videoUrl);
  const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(videoUrl);

  // YouTube Embed
  if (youtubeId) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&enablejsapi=1`}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Vimeo Embed
  if (vimeoId) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // ScreenPal Embed
  if (screenPalId) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={`https://go.screenpal.com/player/${screenPalId}`}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          scrolling="no"
          frameBorder="0"
        />
      </div>
    );
  }

  // Direct Video File (MP4, WebM, etc.)
  if (isDirectVideo) {
    return (
      <div className="relative w-full bg-black rounded-lg overflow-hidden">
        <video
          src={videoUrl}
          controls
          className="w-full aspect-video"
          playsInline
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Unknown URL - Try to render as iframe or show error
  return (
    <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
      <div className="text-center p-6">
        <p className="text-gray-400 mb-2">Unsupported video URL</p>
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-purple-400 hover:underline text-sm"
        >
          Open video in new tab →
        </a>
      </div>
    </div>
  );
};

export default VideoEmbed;