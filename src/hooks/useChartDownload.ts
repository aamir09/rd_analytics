import { useCallback } from 'react';

const WATERMARK_TEXT = 'Red Devils Analytics';
const WATERMARK_SUB = 'reddevilsanalytics.github.io';

/**
 * Hook for downloading chart containers as PNG with a watermark.
 * Works with both <canvas> and <svg> elements inside the container ref.
 */
export function useChartDownload() {
  const download = useCallback((container: HTMLElement | null, filename = 'chart') => {
    if (!container) return;

    const canvas = document.createElement('canvas');
    const scale = 2; // retina

    // Try to find a canvas or SVG inside
    const existingCanvas = container.querySelector('canvas');
    const existingSvg = container.querySelector('svg');

    if (existingCanvas) {
      canvas.width = existingCanvas.width;
      canvas.height = existingCanvas.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(existingCanvas, 0, 0);
      addWatermark(ctx, canvas.width, canvas.height);
      triggerDownload(canvas, filename);
    } else if (existingSvg) {
      const bbox = existingSvg.getBoundingClientRect();
      canvas.width = bbox.width * scale;
      canvas.height = bbox.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);

      const svgData = new XMLSerializer().serializeToString(existingSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, bbox.width, bbox.height);
        ctx.drawImage(img, 0, 0, bbox.width, bbox.height);
        addWatermark(ctx, bbox.width, bbox.height);
        triggerDownload(canvas, filename);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }, []);

  return download;
}

function addWatermark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#1A1A1A';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(WATERMARK_TEXT, w - 12, h - 22);
  ctx.font = '9px Inter, system-ui, sans-serif';
  ctx.globalAlpha = 0.4;
  ctx.fillText(WATERMARK_SUB, w - 12, h - 10);
  ctx.restore();
}

function triggerDownload(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
