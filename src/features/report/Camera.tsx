"use client";

import { useEffect, useRef, useState } from "react";
import { Camera as CameraIcon, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { content } from "./content";

export type Shot = { image: string; thumb: string; dataUrl: string; lat: number; lng: number; accuracy: number };

type Fix = { lat: number; lng: number; accuracy: number };

function draw(video: HTMLVideoElement, maxW: number, quality: number) {
  const scale = Math.min(1, maxW / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Live camera only: there is no file input, so a photo can't come from the gallery. Location is read as the shutter is pressed. */
export function Camera({ onShot, onClose }: { onShot: (s: Shot) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const fix = useRef<Fix | null>(null);
  const [fixAcc, setFixAcc] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let watch: number | undefined;
    let dead = false;

    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      // Syncing with a browser capability that only exists on the client.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(content.camera.unavailable);
    } else {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false })
        .then((s) => {
          if (dead) return s.getTracks().forEach((t) => t.stop());
          stream = s;
          if (video.current) {
            video.current.srcObject = s;
            video.current.play().catch(() => {});
          }
          setReady(true);
        })
        .catch((e: DOMException) => setError(e.name === "NotAllowedError" || e.name === "SecurityError" ? content.camera.denied : e.name === "NotFoundError" ? content.camera.unavailable : content.camera.busy));
    }

    // Keep a warm GPS fix while the viewfinder is open, so the shutter can use the freshest reading.
    if (navigator.geolocation) {
      watch = navigator.geolocation.watchPosition(
        (p) => {
          fix.current = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
          setFixAcc(p.coords.accuracy);
        },
        (e) => {
          if (e.code === e.PERMISSION_DENIED) setError(content.camera.locationDenied);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      );
    } else {
      setError(content.camera.locationFailed);
    }

    return () => {
      dead = true;
      stream?.getTracks().forEach((t) => t.stop());
      if (watch !== undefined) navigator.geolocation.clearWatch(watch);
    };
  }, []);

  async function shoot() {
    const v = video.current;
    if (!v || !v.videoWidth || busy) return;
    setBusy(true);
    // Prefer the freshest reading; if none has arrived yet, ask once.
    let at = fix.current;
    if (!at) {
      at = await new Promise<Fix | null>((resolve) =>
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000 },
        ),
      );
    }
    if (!at) {
      setBusy(false);
      setError(content.camera.locationFailed);
      return;
    }
    const dataUrl = draw(v, 1024, 0.7);
    onShot({ image: dataUrl.split(",")[1], dataUrl, thumb: draw(v, 160, 0.6), lat: at.lat, lng: at.lng, accuracy: at.accuracy });
  }

  if (error) {
    return (
      <div className="grid gap-4 rounded-3xl border border-hairline bg-ivory p-5 text-graphite shadow-float" role="alert">
        <p className="text-sm">{error}</p>
        <Button variant="outline" onClick={onClose}>
          {content.camera.close}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-graphite shadow-float">
      <video ref={video} playsInline muted className="aspect-[3/4] w-full object-cover sm:aspect-video" />
      {!ready && <p className="absolute inset-0 grid place-items-center text-sm text-ivory">{content.camera.starting}</p>}
      <button
        onClick={onClose}
        aria-label={content.camera.close}
        className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-ivory/90 text-graphite outline-none focus-visible:ring-2 focus-visible:ring-graphite/40"
      >
        <X className="size-4" />
      </button>
      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-ivory/90 px-3 py-1.5 text-xs text-graphite">
        <MapPin className="size-3.5" />
        {fixAcc === null ? content.camera.locating : content.camera.located(fixAcc)}
      </div>
      <div className="absolute inset-x-0 bottom-0 grid place-items-center bg-gradient-to-t from-graphite/70 to-transparent p-4">
        <button
          onClick={shoot}
          disabled={!ready || busy}
          aria-label={content.camera.shutter}
          className="grid size-16 place-items-center rounded-full border-4 border-ivory bg-ivory/20 text-ivory outline-none focus-visible:ring-4 focus-visible:ring-ivory/60 disabled:opacity-40"
        >
          <CameraIcon className="size-6" />
        </button>
      </div>
    </div>
  );
}
