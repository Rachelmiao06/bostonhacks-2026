"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff, MapPin, MapPinOff, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { KnittedControl, KnittedIcon } from "./Knitted";
import { Disclosure, Panel, PrimaryButton, SecondaryButton } from "./ui";
import { content, OFFICIAL_311 } from "./content";
import { markPrimerSeen, primerSeen } from "./store";

export type Shot = { image: string; thumb: string; dataUrl: string; lat: number; lng: number; accuracy: number };

type Fix = { lat: number; lng: number; accuracy: number };
type Problem = { title: string; body: string; kind: "camera" | "location"; retry: boolean };

const PROBLEMS = {
  denied: { title: content.camera.deniedTitle, body: content.camera.denied, kind: "camera", retry: true },
  unavailable: { title: content.camera.unavailableTitle, body: content.camera.unavailable, kind: "camera", retry: false },
  busy: { title: content.camera.busyTitle, body: content.camera.busy, kind: "camera", retry: true },
  locationDenied: { title: content.camera.locationDeniedTitle, body: content.camera.locationDenied, kind: "location", retry: true },
  locationFailed: { title: content.camera.locationFailedTitle, body: content.camera.locationFailed, kind: "location", retry: true },
} satisfies Record<string, Problem>;

function draw(video: HTMLVideoElement, maxW: number, quality: number) {
  const scale = Math.min(1, maxW / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Live camera only: there is no file input, so a photo can't come from the gallery.
 * Camera and location are requested only after the user has read what they are for, and location is read as the shutter is pressed.
 */
export function Camera({ onShot, onClose }: { onShot: (s: Shot) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const shutter = useRef<HTMLButtonElement>(null);
  const fix = useRef<Fix | null>(null);
  const [armed, setArmed] = useState(primerSeen); // false = show the "before we ask" note first
  const [attempt, setAttempt] = useState(0);
  const [fixAcc, setFixAcc] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);

  // Escape closes the camera, so keyboard users are never trapped.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!armed) return;
    let stream: MediaStream | undefined;
    let watch: number | undefined;
    let dead = false;
    fix.current = null;

    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      // Syncing with a browser capability that only exists on the client.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProblem(PROBLEMS.unavailable);
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
        .catch((e: DOMException) =>
          setProblem(e.name === "NotAllowedError" || e.name === "SecurityError" ? PROBLEMS.denied : e.name === "NotFoundError" ? PROBLEMS.unavailable : PROBLEMS.busy),
        );
    }

    // Keep a warm GPS fix while the viewfinder is open, so the shutter can use the freshest reading.
    if (navigator.geolocation) {
      watch = navigator.geolocation.watchPosition(
        (p) => {
          fix.current = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
          setFixAcc(p.coords.accuracy);
        },
        (e) => {
          if (e.code === e.PERMISSION_DENIED) setProblem(PROBLEMS.locationDenied);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      );
    } else {
      setProblem(PROBLEMS.locationFailed);
    }

    return () => {
      dead = true;
      stream?.getTracks().forEach((t) => t.stop());
      if (watch !== undefined) navigator.geolocation.clearWatch(watch);
    };
  }, [armed, attempt]);

  // Put keyboard focus on the shutter as soon as it works.
  useEffect(() => {
    if (ready) shutter.current?.focus();
  }, [ready]);

  function retry() {
    setProblem(null);
    setReady(false);
    setFixAcc(null);
    setAttempt((n) => n + 1);
  }

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
      setProblem(PROBLEMS.locationFailed);
      return;
    }
    const dataUrl = draw(v, 1024, 0.7);
    onShot({ image: dataUrl.split(",")[1], dataUrl, thumb: draw(v, 160, 0.6), lat: at.lat, lng: at.lng, accuracy: at.accuracy });
  }

  if (!armed) {
    return (
      <Panel className="mx-auto grid w-full max-w-md gap-4" role="dialog" aria-labelledby="primer-title">
        <h2 id="primer-title" className="flex items-center gap-2 font-serif text-xl font-semibold">
          <ShieldCheck className="size-5 text-taupe" aria-hidden /> {content.camera.primerTitle}
        </h2>
        <ul className="grid gap-3 text-sm">
          {[content.camera.primerCamera, content.camera.primerLocation].map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <KnittedIcon name={i === 0 ? "camera" : "location"} className="size-11 shrink-0" />
              <span>
                <strong className="block">{title}</strong>
                <span className="text-taupe">{body}</span>
              </span>
            </li>
          ))}
        </ul>
        <Disclosure summary="What happens to them">
          <ul className="grid gap-1.5">
            {content.privacy.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Disclosure>
        <div className="grid gap-2 sm:grid-cols-2">
          <PrimaryButton
            autoFocus
            onClick={() => {
              markPrimerSeen();
              setArmed(true);
            }}
          >
            {content.camera.primerContinue}
          </PrimaryButton>
          <SecondaryButton onClick={onClose}>{content.camera.notNow}</SecondaryButton>
        </div>
      </Panel>
    );
  }

  if (problem) {
    const Icon = problem.kind === "camera" ? CameraOff : MapPinOff;
    return (
      <Panel className="mx-auto grid w-full max-w-md gap-4" role="alert">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-stone-deep/60" aria-hidden>
            <Icon className="size-5" />
          </span>
          <div>
            <h2 className="font-serif text-lg font-semibold">{problem.title}</h2>
            <p className="mt-1 text-sm text-taupe">{problem.body}</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {problem.retry ? <PrimaryButton onClick={retry}>{content.camera.tryAgain}</PrimaryButton> : <PrimaryButton onClick={onClose}>{content.camera.close}</PrimaryButton>}
          <SecondaryButton onClick={problem.retry ? onClose : () => window.open(OFFICIAL_311, "_blank", "noopener")}>
            {problem.retry ? content.camera.close : content.camera.official}
          </SecondaryButton>
        </div>
      </Panel>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="relative h-[min(70dvh,34rem)] overflow-hidden rounded-3xl border border-hairline bg-stone-deep shadow-float sm:h-auto sm:aspect-[4/3]">
        <video
          ref={video}
          playsInline
          muted
          aria-label="Camera viewfinder"
          className={cn("size-full object-cover transition-opacity duration-300 motion-reduce:transition-none", ready ? "opacity-100" : "opacity-0")}
        />
        {!ready && <p className="absolute inset-0 grid place-items-center text-sm text-taupe">{content.camera.starting}</p>}
        <button
          onClick={onClose}
          aria-label={content.camera.close}
          className="absolute top-3 right-3 size-11 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-graphite/50"
        >
          <KnittedControl name="close" className="size-full" />
        </button>
        <div role="status" className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-ivory/85 px-3 py-1.5 text-xs text-graphite backdrop-blur-md">
          <MapPin className="size-3.5" aria-hidden />
          {fixAcc === null ? content.camera.locating : content.camera.located(fixAcc)}
        </div>
        <div className="absolute inset-x-0 bottom-0 grid place-items-center pb-5">
          <button
            ref={shutter}
            onClick={shoot}
            disabled={!ready || busy}
            aria-label={content.camera.shutter}
            className="size-[4.75rem] rounded-full outline-none transition-transform focus-visible:ring-4 focus-visible:ring-graphite/60 enabled:active:scale-95 disabled:opacity-40 motion-reduce:transition-none"
          >
            <KnittedControl name="shutter" className="size-full" />
          </button>
        </div>
      </div>
    </div>
  );
}
