import { useRef, useEffect, useState, useCallback } from 'react';
import { analyzeCircleGesture, PointSample } from '../lib/circleGesture';

export interface GestureState {
  normalizedX: number;
  normalizedY: number;
  isPinching: boolean;
  isFist: boolean;
  isTracking: boolean;
  permissionDenied: boolean;
  loading: boolean;
  debugMsg: string;
  didCircleSummon: boolean;
  summonProgress: number;
}

const SMOOTHING = 0.06;
const PINCH_THRESHOLD = 0.032;
const SUMMON_COOLDOWN_MS = 1200;
const TRACK_WINDOW_MS = 3500;

export function useHandTracking(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const smoothX = useRef(0.5);
  const smoothY = useRef(0.5);

  const pointTrailRef = useRef<PointSample[]>([]);
  const lastSummonAtRef = useRef(0);
  const summonFlashUntilRef = useRef(0);

  const [gesture, setGesture] = useState<GestureState>({
    normalizedX: 0.5,
    normalizedY: 0.5,
    isPinching: false,
    isFist: false,
    isTracking: false,
    permissionDenied: false,
    loading: false,
    debugMsg: '等待启动...',
    didCircleSummon: false,
    summonProgress: 0,
  });

  const cleanup = useCallback(() => {
    try {
      cameraRef.current?.stop?.();
    } catch {}

    try {
      handsRef.current?.close?.();
    } catch {}

    if (videoRef.current) {
      try {
        if (videoRef.current.srcObject) {
          (videoRef.current.srcObject as MediaStream)
            .getTracks()
            .forEach((t) => t.stop());
        }
      } catch {}

      if (document.body.contains(videoRef.current)) {
        document.body.removeChild(videoRef.current);
      }
      videoRef.current = null;
    }

    pointTrailRef.current = [];
    cameraRef.current = null;
    handsRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    let cancelled = false;

    async function init() {
      setGesture((g) => ({
        ...g,
        loading: true,
        permissionDenied: false,
        debugMsg: '加载手势识别模块...',
      }));

      try {
        const [handsModule, cameraModule] = await Promise.all([
          import('@mediapipe/hands'),
          import('@mediapipe/camera_utils'),
        ]);

        // Handle both named export and default export (varies by bundler/environment)
        const Hands: any = handsModule.Hands ?? (handsModule as any).default?.Hands ?? (handsModule as any).default;
        const Camera: any = cameraModule.Camera ?? (cameraModule as any).default?.Camera ?? (cameraModule as any).default;

        if (typeof Hands !== 'function') {
          throw new Error('MediaPipe Hands 模块加载失败，请刷新重试');
        }

        if (cancelled) return;

        const video = document.createElement('video');
        video.style.cssText =
          'position:fixed;top:0;left:0;width:320px;height:240px;opacity:0;pointer-events:none;z-index:-1;';
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        document.body.appendChild(video);
        videoRef.current = video;

        const hands = new Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
          selfieMode: true,
        });

        hands.onResults((results: any) => {
          if (cancelled) return;

          const now = Date.now();
          const didCircleSummon = now < summonFlashUntilRef.current;

          if (
            !results.multiHandLandmarks ||
            results.multiHandLandmarks.length === 0
          ) {
            pointTrailRef.current = [];
            setGesture((g) => ({
              ...g,
              isTracking: false,
              isPinching: false,
              loading: false,
              didCircleSummon: false,
              summonProgress: 0,
              debugMsg: '📷 摄像头运行中，未检测到手',
            }));
            return;
          }

          const landmarks = results.multiHandLandmarks[0];
          const pointer = landmarks[8];
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];

          const rawX = pointer.x;
          const rawY = pointer.y;

          smoothX.current += (rawX - smoothX.current) * SMOOTHING;
          smoothY.current += (rawY - smoothY.current) * SMOOTHING;

          const dx = thumbTip.x - indexTip.x;
          const dy = thumbTip.y - indexTip.y;
          const pinchDist = Math.sqrt(dx * dx + dy * dy);
          const isPinching = pinchDist < PINCH_THRESHOLD;

          // 握拳检测：用手指弯曲度（指尖到手腕距离 vs 掌根到手腕距离）
          // 更可靠：不依赖 y 轴方向（摄像头角度影响 y 轴）
          const fistTips = [8, 12, 16, 20];
          const fistMcps = [5, 9, 13, 17];
          const fistWrist = landmarks[0];
          const fistBentCount = fistTips.filter((tip, i) => {
            const mcp = fistMcps[i];
            // 指尖到手腕的距离
            const tipDist = Math.hypot(
              landmarks[tip].x - fistWrist.x,
              landmarks[tip].y - fistWrist.y,
              (landmarks[tip].z ?? 0) - (fistWrist.z ?? 0)
            );
            // 掌根到手腕的距离
            const mcpDist = Math.hypot(
              landmarks[mcp].x - fistWrist.x,
              landmarks[mcp].y - fistWrist.y,
              (landmarks[mcp].z ?? 0) - (fistWrist.z ?? 0)
            );
            // 握拳时指尖比掌根更靠近手腕
            return tipDist < mcpDist * 1.2;
          }).length;
          // 4根手指弯曲才算握拳
          const isFist = fistBentCount >= 4;

          // 恢复画圈轨迹缓存
          pointTrailRef.current.push({
            x: Math.max(0, Math.min(1, smoothX.current)),
            y: Math.max(0, Math.min(1, smoothY.current)),
            t: now,
          });

          pointTrailRef.current = pointTrailRef.current.filter(
            (p) => now - p.t <= TRACK_WINDOW_MS
          );

          let summonTriggered = didCircleSummon;
          let summonProgress = 0;

          if (pointTrailRef.current.length >= 10) {
            const circle = analyzeCircleGesture(pointTrailRef.current);

            summonProgress = Math.max(
              0,
              Math.min(1, (circle.score - 0.02) / 0.26)
            );

            if (
              now - lastSummonAtRef.current > SUMMON_COOLDOWN_MS &&
              circle.isCircle
            ) {
              lastSummonAtRef.current = now;
              summonFlashUntilRef.current = now + 900;
              pointTrailRef.current = [];
              summonTriggered = true;
              summonProgress = 1;
            }
          }

          setGesture((g) => ({
            ...g,
            normalizedX: Math.max(0, Math.min(1, smoothX.current)),
            normalizedY: Math.max(0, Math.min(1, smoothY.current)),
            isPinching,
            isFist,
            isTracking: true,
            loading: false,
            didCircleSummon: summonTriggered,
            summonProgress,
            debugMsg: summonTriggered
              ? '✨ 法阵已唤醒'
              : `🖐 手势已识别 x:${rawX.toFixed(2)} y:${rawY.toFixed(
                  2
                )} dist:${pinchDist.toFixed(3)}${isPinching ? ' 👌' : ''}${isFist ? ' ✊' : ''}`,
          }));
        });

        handsRef.current = hands;

        const camera = new Camera(video, {
          onFrame: async () => {
            try {
              if (
                cancelled ||
                !handsRef.current ||
                !videoRef.current ||
                video.readyState < 2 ||
                video.videoWidth === 0 ||
                video.videoHeight === 0
              ) {
                return;
              }

              await handsRef.current.send({ image: video });
            } catch (err: any) {
              if (cancelled) return;
              setGesture((g) => ({
                ...g,
                loading: false,
                debugMsg: `❌ 帧处理失败: ${err?.message || 'unknown error'}`,
              }));
            }
          },
          width: 640,
          height: 480,
        });

        cameraRef.current = camera;

        setGesture((g) => ({
          ...g,
          loading: true,
          debugMsg: '📸 启动摄像头中...',
        }));

        await camera.start();

        await new Promise<void>((resolve, reject) => {
          let attempts = 0;

          const checkReady = () => {
            if (cancelled) {
              reject(new Error('cancelled'));
              return;
            }

            if (
              video.readyState >= 2 &&
              video.videoWidth > 0 &&
              video.videoHeight > 0
            ) {
              resolve();
              return;
            }

            attempts += 1;
            if (attempts > 100) {
              reject(new Error('video not ready'));
              return;
            }

            setTimeout(checkReady, 100);
          };

          checkReady();
        });

        if (cancelled) {
          cleanup();
          return;
        }

        setGesture((g) => ({
          ...g,
          loading: false,
          debugMsg: '✅ 摄像头已启动，请画圆唤醒法阵',
        }));
      } catch (err: any) {
        if (cancelled) return;

        const message =
          err?.name === 'NotAllowedError'
            ? '摄像头权限被拒绝'
            : err?.message || err?.name || 'unknown error';

        setGesture((g) => ({
          ...g,
          loading: false,
          permissionDenied: err?.name === 'NotAllowedError',
          isTracking: false,
          isPinching: false,
          didCircleSummon: false,
          summonProgress: 0,
          debugMsg: `❌ ${message}`,
        }));
      }
    }

    init();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, cleanup]);

  return gesture;
}
