import { motion, useSpring } from 'motion/react';
import { type FC, type JSX, useEffect, useRef, useState } from 'react';

type Position = { x: number; y: number };

export interface SmoothCursorProps {
  cursor?: JSX.Element;
  springConfig?: { damping: number; stiffness: number; mass: number; restDelta: number };
}

const DefaultCursorSVG: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={50} height={54} viewBox="0 0 50 54" fill="none" style={{ scale: 0.34 }}>
    <path d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z" fill="#550000" />
    <path d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z" stroke="white" strokeWidth={2.25825} />
  </svg>
);

export function SmoothCursor({ cursor = <DefaultCursorSVG />, springConfig = { damping: 45, stiffness: 400, mass: 1, restDelta: 0.001 } }: SmoothCursorProps) {
  const [isMoving, setIsMoving] = useState(false);
  const lastMousePos = useRef<Position>({ x: 0, y: 0 });
  const velocity = useRef<Position>({ x: 0, y: 0 });
  const lastUpdateTime = useRef(Date.now());
  const previousAngle = useRef(0);
  const accumulatedRotation = useRef(0);
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);
  const rotation = useSpring(0, { ...springConfig, damping: 60, stiffness: 300 });
  const scale = useSpring(1, { ...springConfig, stiffness: 500, damping: 35 });

  useEffect(() => {
    const smoothMouseMove = (event: MouseEvent) => {
      const currentPos = { x: event.clientX, y: event.clientY };
      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdateTime.current;
      if (deltaTime > 0) velocity.current = { x: (currentPos.x - lastMousePos.current.x) / deltaTime, y: (currentPos.y - lastMousePos.current.y) / deltaTime };
      lastUpdateTime.current = currentTime;
      lastMousePos.current = currentPos;
      const speed = Math.hypot(velocity.current.x, velocity.current.y);
      cursorX.set(currentPos.x);
      cursorY.set(currentPos.y);
      if (speed > 0.1) {
        const currentAngle = Math.atan2(velocity.current.y, velocity.current.x) * (180 / Math.PI) + 90;
        let angleDiff = currentAngle - previousAngle.current;
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;
        accumulatedRotation.current += angleDiff;
        rotation.set(accumulatedRotation.current);
        previousAngle.current = currentAngle;
        scale.set(0.95);
        setIsMoving(true);
        window.setTimeout(() => { scale.set(1); setIsMoving(false); }, 150);
      }
    };
    let rafId = 0;
    const throttledMouseMove = (event: MouseEvent) => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => { smoothMouseMove(event); rafId = 0; });
    };
    document.body.style.cursor = 'none';
    window.addEventListener('mousemove', throttledMouseMove);
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      document.body.style.cursor = '';
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [cursorX, cursorY, rotation, scale]);

  return <motion.div className={isMoving ? 'smooth-cursor moving' : 'smooth-cursor'} style={{ position: 'fixed', left: cursorX, top: cursorY, translateX: '-50%', translateY: '-50%', rotate: rotation, scale, zIndex: 100, pointerEvents: 'none', willChange: 'transform' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>{cursor}</motion.div>;
}
