import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

function QRScanner({ onScan, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara');
      if (onError) onError(err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        setScanning(false);
        stopCamera();
        if (onScan) onScan(code.data);
        return;
      }
    }

    requestAnimationFrame(tick);
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <video
        ref={videoRef}
        style={{ width: '100%', border: '2px solid #1976d2', borderRadius: '8px' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>
          {error}
        </div>
      )}
      
      {scanning && (
        <div style={{ textAlign: 'center', marginTop: '10px', color: '#1976d2' }}>
          📷 Escaneando código QR...
        </div>
      )}
    </div>
  );
}

export default QRScanner;