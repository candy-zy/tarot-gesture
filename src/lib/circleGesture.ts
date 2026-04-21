export interface PointSample {
  x: number;
  y: number;
  t: number;
}

export interface CircleGestureResult {
  isCircle: boolean;
  centerX: number;
  centerY: number;
  radius: number;
  score: number;
}

export function analyzeCircleGesture(
  points: PointSample[]
): CircleGestureResult {
  if (points.length < 12) {
    return {
      isCircle: false,
      centerX: 0,
      centerY: 0,
      radius: 0,
      score: 0,
    };
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  const centerX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const centerY = ys.reduce((a, b) => a + b, 0) / ys.length;

  const radii = points.map((p) => Math.hypot(p.x - centerX, p.y - centerY));
  const radius = radii.reduce((a, b) => a + b, 0) / radii.length;

  if (radius < 0.03 || radius > 0.38) {
    return {
      isCircle: false,
      centerX,
      centerY,
      radius,
      score: 0,
    };
  }

  const variance =
    radii.reduce((sum, r) => sum + Math.pow(r - radius, 2), 0) / radii.length;
  const std = Math.sqrt(variance);

  const start = points[0];
  const end = points[points.length - 1];
  const closure = Math.hypot(end.x - start.x, end.y - start.y);

  let pathLength = 0;
  for (let i = 1; i < points.length; i++) {
    pathLength += Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y
    );
  }

  const circumference = 2 * Math.PI * radius;
  const pathRatio = circumference > 0 ? pathLength / circumference : 0;

  let totalTurn = 0;
  for (let i = 2; i < points.length; i++) {
    const a1 = Math.atan2(
      points[i - 1].y - points[i - 2].y,
      points[i - 1].x - points[i - 2].x
    );
    const a2 = Math.atan2(
      points[i].y - points[i - 1].y,
      points[i].x - points[i - 1].x
    );
    let d = a2 - a1;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    totalTurn += d;
  }

  const turnAbs = Math.abs(totalTurn);

  const roundnessScore = Math.max(0, 1 - std / Math.max(radius, 1e-6));
  const closureScore = Math.max(0, 1 - closure / Math.max(radius * 1.5, 1e-6));
  const pathScore =
    pathRatio >= 0.5 && pathRatio <= 2.5
      ? 1 - Math.abs(pathRatio - 1) * 0.4
      : 0;
  const turnScore =
    turnAbs >= Math.PI * 1.0 && turnAbs <= Math.PI * 4.0
      ? 1
      : turnAbs / (Math.PI * 1.0);

  const score =
    roundnessScore * 0.35 +
    closureScore * 0.25 +
    pathScore * 0.2 +
    Math.min(1, turnScore) * 0.2;

  const isCircle =
    std < radius * 1.0 &&        // 极宽松：允许很不圆
    closure < radius * 3.0 &&    // 首尾可以差很远
    pathRatio > 0.30 &&          // 只要画了108度弧
    turnAbs > Math.PI * 0.6 &&   // 只需转过108度
    score > 0.18;                // 极低综合分

  return {
    isCircle,
    centerX,
    centerY,
    radius,
    score,
  };
}
