"use client";

import {
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";
import type { PointerEvent } from "react";

const logoUrl =
  "https://res.cloudinary.com/deayevwds/image/upload/v1791205176/Numayr_Arch_and_Droplet_Logo_dt4yg5.png";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/* Ripples that spread on the water surface under the logo */
const ripples = [0, 1, 2, 3].map((i) => ({
  delay: 1.2 + i * 1.1,
  max: 2.4 + i * 0.12,
}));

/* Bubbles: fixed values (no Math.random) so server and client render match */
const bubbles = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37 + 8) % 100,
  size: 5 + ((i * 7) % 14),
  duration: 9 + ((i * 5) % 9),
  delay: -((i * 1.7) % 12),
  drift: ((i % 2 === 0 ? 1 : -1) * (14 + ((i * 3) % 26))),
}));

/* Light rays falling from the surface */
const rays = [
  { left: "8%", w: 130, rot: 14, dur: 11, op: 0.5 },
  { left: "28%", w: 90, rot: 9, dur: 14, op: 0.35 },
  { left: "52%", w: 150, rot: 12, dur: 12, op: 0.45 },
  { left: "74%", w: 100, rot: 6, dur: 16, op: 0.3 },
  { left: "90%", w: 120, rot: 10, dur: 13, op: 0.4 },
];

const headline = ["عناية", "تستحقها", "برادتك"];

export default function SplashScreen() {
  /* ---------- pointer parallax ---------- */
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 45, damping: 22, mass: 0.9 });
  const sy = useSpring(py, { stiffness: 45, damping: 22, mass: 0.9 });

  const sceneX = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const sceneY = useTransform(sy, [-0.5, 0.5], [-8, 8]);
  const bgX = useTransform(sx, [-0.5, 0.5], [30, -30]);
  const bgY = useTransform(sy, [-0.5, 0.5], [20, -20]);
  const tiltY = useTransform(sx, [-0.5, 0.5], [-16, 16]);
  const tiltX = useTransform(sy, [-0.5, 0.5], [12, -12]);

  function onMove(e: PointerEvent<HTMLElement>) {
    px.set(e.clientX / window.innerWidth - 0.5);
    py.set(e.clientY / window.innerHeight - 0.5);
  }
  function onLeave() {
    px.set(0);
    py.set(0);
  }

  /* ---------- loading percentage ---------- */
  const progress = useMotionValue(0);
  const percent = useTransform(progress, (v) =>
    Math.round(v).toLocaleString("ar-EG")
  );
  const barWidth = useTransform(progress, (v) => `${v}%`);

  useEffect(() => {
    const controls = animate(progress, 100, {
      delay: 2,
      duration: 3.4,
      ease: [0.45, 0.05, 0.25, 1],
      repeat: Infinity,
      repeatDelay: 0.7,
    });
    return () => controls.stop();
  }, [progress]);

  return (
    <MotionConfig reducedMotion="user">
      <main
        dir="rtl"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, #0f5f7f 0%, #0a3b5c 38%, #072743 68%, #04152b 100%)",
        }}
      >
        {/* ===== BACKGROUND ===== */}

        {/* big breathing glow behind the logo */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-[40%] h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] sm:h-[980px] sm:w-[980px]"
          style={{
            x: bgX,
            y: bgY,
            background:
              "radial-gradient(circle, rgba(91,217,241,.55) 0%, rgba(22,166,201,.22) 38%, transparent 68%)",
          }}
          animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* light rays from the surface */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[85%] overflow-hidden">
          {rays.map((r, i) => (
            <motion.div
              key={i}
              className="absolute -top-[10%] h-[120%] origin-top blur-[22px]"
              style={{
                left: r.left,
                width: r.w,
                rotate: r.rot,
                background:
                  "linear-gradient(180deg, rgba(190,243,255,.55) 0%, rgba(91,217,241,.14) 45%, transparent 85%)",
              }}
              animate={{
                opacity: [r.op * 0.35, r.op, r.op * 0.35],
                rotate: [r.rot - 4, r.rot + 4, r.rot - 4],
              }}
              transition={{
                duration: r.dur,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.8,
              }}
            />
          ))}
        </div>

        {/* drifting caustic light */}
        <motion.div
          className="pointer-events-none absolute -left-[20%] bottom-[8%] h-[40%] w-[80%] rounded-full blur-[70px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(22,166,201,.34), transparent 70%)",
          }}
          animate={{ x: ["0%", "35%", "0%"], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -right-[25%] top-[30%] h-[36%] w-[70%] rounded-full blur-[80px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(120,225,245,.22), transparent 70%)",
          }}
          animate={{ x: ["0%", "-30%", "0%"], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* rising bubbles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {bubbles.map((b, i) => (
            <motion.span
              key={i}
              className="absolute -bottom-6 rounded-full"
              style={{
                left: `${b.left}%`,
                width: b.size,
                height: b.size,
                background:
                  "radial-gradient(circle at 30% 30%, rgba(255,255,255,.95), rgba(160,235,250,.35) 45%, rgba(255,255,255,.06) 70%)",
                boxShadow: "inset 0 0 4px rgba(255,255,255,.5)",
              }}
              animate={{
                y: ["0vh", "-110vh"],
                x: [0, b.drift, -b.drift / 2, 0],
                opacity: [0, 0.9, 0.9, 0],
              }}
              transition={{
                duration: b.duration,
                delay: b.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>

        {/* vignette keeps focus on the center */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, transparent 40%, rgba(2,10,24,.55) 100%)",
          }}
        />

        {/* ===== MAIN COMPOSITION ===== */}
        <motion.section
          className="relative z-10 flex w-full flex-col items-center px-6"
          style={{ x: sceneX, y: sceneY }}
        >
          <div
            className="relative flex h-[380px] w-[380px] items-center justify-center sm:h-[470px] sm:w-[470px]"
            style={{ perspective: 1200 }}
          >
            {/* water plane */}
            <div
              className="absolute bottom-[6%] left-1/2 h-[170px] w-[360px] -translate-x-1/2 sm:w-[470px]"
              style={{ perspective: 800 }}
            >
              <motion.div
                className="absolute inset-0 rounded-[50%]"
                style={{
                  rotateX: 72,
                  background:
                    "radial-gradient(ellipse at center, rgba(120,225,245,.38), rgba(22,166,201,.12) 55%, transparent 74%)",
                  boxShadow: "0 0 70px rgba(22,166,201,.25)",
                }}
                animate={{ scaleX: [0.95, 1.04, 0.95], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              />
              {ripples.map((r, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-[50%]"
                  style={{
                    rotateX: 72,
                    border: "1.5px solid rgba(160,238,252,.8)",
                    boxShadow:
                      "0 0 22px rgba(91,217,241,.45), inset 0 0 14px rgba(255,255,255,.2)",
                  }}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{
                    scale: [0.3, 0.8, r.max],
                    opacity: [0, 0.75, 0],
                  }}
                  transition={{
                    duration: 4.4,
                    delay: r.delay,
                    repeat: Infinity,
                    ease: [0.18, 0.7, 0.22, 1],
                  }}
                />
              ))}
            </div>

            {/* orbit rings with glowing droplets */}
            <motion.div
              className="absolute h-[78%] w-[78%] rounded-full border border-white/15"
              style={{ rotateX: 68, rotateY: 14, transformStyle: "preserve-3d" }}
              animate={{ rotateZ: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            >
              <span
                className="absolute left-1/2 top-0 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7be4f7]"
                style={{ boxShadow: "0 0 20px 4px rgba(123,228,247,.7)" }}
              />
            </motion.div>
            <motion.div
              className="absolute h-[92%] w-[92%] rounded-full border border-[#5bd9f1]/20"
              style={{ rotateX: 76, rotateY: -42, transformStyle: "preserve-3d" }}
              animate={{ rotateZ: -360 }}
              transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
            >
              <span
                className="absolute bottom-0 left-1/2 h-[7px] w-[7px] -translate-x-1/2 translate-y-1/2 rounded-full bg-white"
                style={{ boxShadow: "0 0 16px 3px rgba(255,255,255,.65)" }}
              />
            </motion.div>

            {/* logo entrance: rises from below and settles */}
            <motion.div
              className="relative z-20 w-[52%] sm:w-[48%]"
              initial={{ opacity: 0, y: 230, scale: 0.6, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: -26, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.7, ease: EASE_OUT }}
            >
              {/* floating + pointer 3D tilt */}
              <motion.div
                style={{
                  rotateX: tiltX,
                  rotateY: tiltY,
                  transformStyle: "preserve-3d",
                }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    delay: 1.7,
                    duration: 5.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative aspect-square w-full"
                >
                  {/* frosted glass orb so the dark logo stays readable */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at 32% 26%, rgba(255,255,255,.98) 0%, rgba(232,248,252,.92) 45%, rgba(176,228,242,.85) 100%)",
                      boxShadow:
                        "0 30px 70px rgba(2,12,30,.55), 0 0 90px rgba(91,217,241,.45), inset 0 -14px 30px rgba(22,166,201,.25)",
                      transform: "translateZ(0)",
                    }}
                  />
                  {/* rotating specular sweep */}
                  <motion.div
                    className="absolute inset-0 overflow-hidden rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                    style={{
                      background:
                        "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,.75) 28deg, transparent 70deg, transparent 360deg)",
                      mixBlendMode: "soft-light",
                    }}
                  />
                  <div className="absolute inset-[16%]" style={{ transform: "translateZ(40px)" }}>
                    <Image
                      src={logoUrl}
                      alt="شعار نمير"
                      width={700}
                      height={700}
                      priority
                      className="h-auto w-full object-contain"
                      style={{ filter: "drop-shadow(0 10px 10px rgba(13,43,78,.25))" }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* splash where the logo meets the water */}
            <motion.div
              className="absolute bottom-[19%] left-1/2 h-[8px] -translate-x-1/2 rounded-full bg-[#9cefff]"
              style={{ filter: "blur(6px)" }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: ["0px", "130px", "60px"], opacity: [0, 0.8, 0.25] }}
              transition={{ delay: 1.3, duration: 1.4, ease: "easeOut" }}
            />
          </div>

          {/* ===== HEADLINE ===== */}
          <h1 className="-mt-10 flex flex-wrap justify-center gap-x-3 text-center text-[28px] font-black leading-tight sm:-mt-14 sm:text-[42px]">
            {headline.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 1.4 + i * 0.22, duration: 0.9, ease: EASE_OUT }}
                className="inline-block"
              >
                <motion.span
                  className="inline-block bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      i === 2
                        ? "linear-gradient(100deg, #5bd9f1 0%, #e8fbff 40%, #5bd9f1 80%)"
                        : "linear-gradient(100deg, #ffffff 0%, #cdeff7 50%, #ffffff 100%)",
                    backgroundSize: "250% 100%",
                  }}
                  animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 2.4,
                  }}
                >
                  {word}
                </motion.span>
              </motion.span>
            ))}
          </h1>

          <motion.div
            className="mx-auto mt-4 h-px w-28 origin-center bg-gradient-to-r from-transparent via-[#7be4f7] to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 2.1, duration: 0.9 }}
          />

          <motion.p
            className="mt-3 text-sm font-medium text-[#bfeaf4]/80 sm:text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.3, duration: 0.8 }}
          >
            لحظات ونكون معاك
          </motion.p>

          {/* ===== LOADER ===== */}
          <motion.div
            className="mt-8 flex flex-col items-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 0.8 }}
          >
            <div className="relative h-[6px] w-[220px] overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10 sm:w-[270px]">
              <motion.div
                className="absolute inset-y-0 right-0 rounded-full"
                style={{
                  width: barWidth,
                  background:
                    "linear-gradient(270deg, #9cefff 0%, #16a6c9 55%, #0f7fa3 100%)",
                  boxShadow: "0 0 14px rgba(91,217,241,.8)",
                }}
              />
              {/* moving shine */}
              <motion.div
                className="absolute inset-y-0 w-14"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,.85), transparent)",
                }}
                animate={{ right: ["-30%", "120%"] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  repeatDelay: 0.8,
                  ease: "easeInOut",
                }}
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex gap-[6px]">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-[6px] w-[6px] rounded-full bg-[#7be4f7]"
                    animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.35, 0.8] }}
                    transition={{
                      duration: 1.2,
                      delay: i * 0.18,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              <span className="min-w-[3.2ch] text-sm font-bold tabular-nums text-[#d6f4fb]">
                <motion.span>{percent}</motion.span>٪
              </span>
            </div>
          </motion.div>
        </motion.section>
      </main>
    </MotionConfig>
  );
}