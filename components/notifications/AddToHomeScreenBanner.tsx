"use client";
import { useEffect, useState } from "react";

const isiOSSafari = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  /safari/i.test(navigator.userAgent);

export default function AddToHomeScreenBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (
      isiOSSafari() &&
      (window.navigator as any).standalone !== true &&
      !localStorage.getItem("a2hs-dismissed")
    ) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 rounded-xl bg-white/90 p-4 shadow-lg backdrop-blur">
      <p className="text-sm font-medium">
        Installe Helpr sur votre écran d’accueil
      </p>
      <p className="mt-1 text-xs text-gray-700">
        Touchez <span className="font-semibold">Partager</span>{" "}
        <span className="inline-block rotate-90">⇪</span> puis « Sur l’écran
        d’accueil ».
      </p>
      <button
        onClick={() => {
          localStorage.setItem("a2hs-dismissed", "1");
          setShow(false);
        }}
        className="mt-2 rounded bg-amber-600 px-3 py-1 text-xs text-white"
      >
        OK
      </button>
    </div>
  );
}
