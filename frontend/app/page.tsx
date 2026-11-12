"use client";

import { useCallback, useState } from "react";
import PublicLanding from "@/components/PublicLanding";
import SplashScreen from "@/components/SplashScreen";

export default function Home() {
  const [splashVisible, setSplashVisible] = useState(true);
  const finishSplash = useCallback(() => setSplashVisible(false), []);

  return splashVisible ? <SplashScreen onComplete={finishSplash} /> : <PublicLanding />;
}
