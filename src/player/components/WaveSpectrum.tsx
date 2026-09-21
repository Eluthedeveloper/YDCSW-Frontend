import { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

export default function WaveSpectrum() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const { analyserNode, isPlaying } = usePlayer();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener('resize', resize);

    const drawIdle = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);
      const barCount = 64;
      const barWidth = width / barCount;
      for (let i = 0; i < barCount; i++) {
        const h = 3 + Math.sin(Date.now() / 800 + i * 0.3) * 3;
        ctx.fillStyle = 'rgba(55, 58, 64, 0.5)';
        const x = i * barWidth + barWidth * 0.15;
        const w = barWidth * 0.7;
        ctx.beginPath();
        ctx.roundRect(x, height / 2 - h / 2, w, h, 2);
        ctx.fill();
      }
    };

    const drawActive = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);

      if (analyserNode && isPlaying) {
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        const barCount = 64;
        const barWidth = width / barCount;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step];
          const barHeight = (value / 255) * height * 0.85;

          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, '#4263eb');
          gradient.addColorStop(0.5, '#748ffc');
          gradient.addColorStop(1, '#cc5de8');

          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          const radius = Math.min(w / 2, 3);

          ctx.beginPath();
          ctx.fillStyle = gradient;
          ctx.roundRect(x, height - barHeight, w, barHeight, [radius, radius, 0, 0]);
          ctx.fill();

          ctx.fillStyle = 'rgba(116, 143, 252, 0.15)';
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, w, barHeight, [radius, radius, 0, 0]);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(drawActive);
    };

    if (analyserNode && isPlaying) {
      drawActive();
    } else {
      drawIdle();
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [analyserNode, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
