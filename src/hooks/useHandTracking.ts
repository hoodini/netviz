import { useState, useRef, useCallback, useEffect } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface HandGesture {
  type: 'open_palm' | 'pinch' | 'fist' | 'pointing' | 'none';
  confidence: number;
  landmarks: { x: number; y: number; z: number }[];
  handedness: 'Left' | 'Right';
}

interface UseHandTrackingReturn {
  gesture: HandGesture | null;
  isReady: boolean;
  isActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  start: () => Promise<void>;
  stop: () => void;
}

function classifyGesture(landmarks: { x: number; y: number; z: number }[]): HandGesture['type'] {
  if (landmarks.length < 21) return 'none';

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  // Pinch: thumb tip close to index tip
  const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
  if (pinchDist < 0.06) return 'pinch';

  // Check finger extension (tip above MCP joint in y)
  const indexExtended = indexTip.y < landmarks[6].y;
  const middleExtended = middleTip.y < landmarks[10].y;
  const ringExtended = ringTip.y < landmarks[14].y;
  const pinkyExtended = pinkyTip.y < landmarks[18].y;
  const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

  // Fist: no fingers extended
  if (extendedCount === 0) return 'fist';

  // Pointing: only index extended
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) return 'pointing';

  // Open palm: all fingers extended
  if (extendedCount >= 3) return 'open_palm';

  return 'none';
}

export function useHandTracking(): UseHandTrackingReturn {
  const [gesture, setGesture] = useState<HandGesture | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const detect = useCallback(() => {
    const video = videoRef.current;
    const handLandmarker = handLandmarkerRef.current;
    if (!video || !handLandmarker || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    const results = handLandmarker.detectForVideo(video, performance.now());

    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0].map(l => ({ x: l.x, y: l.y, z: l.z }));
      const gestureType = classifyGesture(landmarks);
      const handedness = results.handednesses?.[0]?.[0]?.categoryName as 'Left' | 'Right' ?? 'Right';

      setGesture({
        type: gestureType,
        confidence: results.handednesses?.[0]?.[0]?.score ?? 0,
        landmarks,
        handedness,
      });
    } else {
      setGesture(null);
    }

    animFrameRef.current = requestAnimationFrame(detect);
  }, []);

  const start = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      handLandmarkerRef.current = handLandmarker;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsReady(true);
      setIsActive(true);
      animFrameRef.current = requestAnimationFrame(detect);
    } catch (err) {
      console.error('Hand tracking init failed:', err);
    }
  }, [detect]);

  const stop = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (handLandmarkerRef.current) {
      handLandmarkerRef.current.close();
      handLandmarkerRef.current = null;
    }
    setIsActive(false);
    setIsReady(false);
    setGesture(null);
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      handLandmarkerRef.current?.close();
    };
  }, []);

  return { gesture, isReady, isActive, videoRef, start, stop };
}
