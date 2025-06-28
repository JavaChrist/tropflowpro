import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, RotateCcw, Check, Trash2 } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      // Configuration pour mobile (caméra arrière par défaut)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setStream(mediaStream);
      setIsStreaming(true);
    } catch (err) {
      console.error('Erreur caméra:', err);
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Définir la taille du canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dessiner l'image de la vidéo sur le canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir en blob puis en URL
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
      }
    }, 'image/jpeg', 0.9);
  }, []);

  const confirmCapture = useCallback(async () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const fileName = `facture_${new Date().toISOString().split('T')[0]}_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        onCapture(file);
        stopCamera();
        onClose();
      }
    }, 'image/jpeg', 0.9);
  }, [onCapture, onClose, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
  }, [capturedImage]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    stopCamera();
  }, [stopCamera]);

  // Démarrer la caméra au montage
  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [startCamera, stopCamera, capturedImage]);

  // Redémarrer quand le mode change
  React.useEffect(() => {
    if (isStreaming) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  }, [facingMode, isStreaming, startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-lg font-semibold">Capturer une facture</h3>
        <button
          onClick={switchCamera}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          title="Changer de caméra"
        >
          <RotateCcw className="h-6 w-6" />
        </button>
      </div>

      {/* Zone de capture */}
      <div className="flex-1 relative flex items-center justify-center">
        {error ? (
          <div className="text-center text-white p-6">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Réessayer
            </button>
          </div>
        ) : capturedImage ? (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={capturedImage}
              alt="Photo capturée"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {/* Overlay de guidage */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full flex items-center justify-center">
                <div className="border-2 border-white border-dashed rounded-lg w-80 h-48 opacity-70"></div>
              </div>
              <div className="absolute bottom-20 left-0 right-0 text-center">
                <p className="text-white text-sm bg-black bg-opacity-50 rounded-lg p-2 mx-4">
                  Positionnez votre facture dans le cadre
                </p>
              </div>
            </div>
          </>
        )}

        {/* Canvas caché pour la capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Actions */}
      <div className="p-6 bg-black">
        {capturedImage ? (
          <div className="flex justify-center space-x-4">
            <button
              onClick={retakePhoto}
              className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Reprendre
            </button>
            <button
              onClick={confirmCapture}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check className="h-5 w-5 mr-2" />
              Utiliser cette photo
            </button>
          </div>
        ) : (
          <button
            onClick={capturePhoto}
            disabled={!isStreaming}
            className="w-full h-16 bg-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-gray-100 transition-colors"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraCapture; 