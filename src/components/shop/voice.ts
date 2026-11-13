"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Voice mode for Nora.
 * Listening: the browser's own speech recognition (Chrome, Edge, Safari). Free, no key.
 * Speaking: /api/nora/tts, which streams a neural voice (en-IE Emily by default) from the agent.
 * Replies are spoken one sentence at a time, with the next sentence loading while the current
 * one plays, so Nora starts talking before she has finished writing.
 */

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type VoiceState = "idle" | "listening" | "speaking";

type Clip = { text: string; audio?: Promise<Blob | null>; abort?: AbortController };

export function useVoice({ onInterim, onFinal }: { onInterim: (text: string) => void; onFinal: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<VoiceState>("idle");
  const rec = useRef<Recognition | null>(null);
  const queue = useRef<Clip[]>([]);
  const running = useRef(false);
  const release = useRef<(() => void) | null>(null); // ends the clip that is playing now
  const waiters = useRef<(() => void)[]>([]);
  const cb = useRef({ onInterim, onFinal });
  cb.current = { onInterim, onFinal };
  const player = useRef<HTMLAudioElement | null>(null); // one element plays every sentence

  useEffect(() => setSupported(!!recognitionCtor()), []);

  // Each sentence is fetched whole (well under a second) as soon as it is queued next.
  const prep = (c: Clip | undefined) => {
    if (!c || c.audio) return;
    c.abort = new AbortController();
    c.audio = fetch(`/api/nora/tts?text=${encodeURIComponent(c.text)}`, { signal: c.abort.signal })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => (b && b.size > 0 ? b : null))
      .catch(() => null);
  };

  const getPlayer = () => {
    if (!player.current) player.current = new Audio();
    return player.current;
  };

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    while (queue.current.length) {
      const c = queue.current[0];
      prep(c);
      prep(queue.current[1]); // stay one sentence ahead
      setState("speaking");
      const blob = await c.audio;
      if (blob && queue.current[0] === c) {
        const url = URL.createObjectURL(blob);
        const el = getPlayer();
        el.src = url;
        await new Promise<void>((done) => {
          release.current = done;
          el.onended = el.onerror = () => done();
          el.play().catch(() => done());
        });
        URL.revokeObjectURL(url);
      }
      release.current = null;
      if (queue.current[0] === c) queue.current.shift();
    }
    running.current = false;
    setState((s) => (s === "speaking" ? "idle" : s));
    waiters.current.splice(0).forEach((f) => f());
  }, []);

  const stopListening = useCallback(() => {
    rec.current?.abort();
    rec.current = null;
    setState((s) => (s === "listening" ? "idle" : s));
  }, []);

  const stopSpeaking = useCallback(() => {
    for (const c of queue.current) c.abort?.abort();
    queue.current = [];
    player.current?.pause();
    release.current?.();
  }, []);

  const listen = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    stopSpeaking();
    rec.current?.abort();
    const r = new Ctor();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
    let final = "";
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) final += res[0].transcript;
        else interim += res[0].transcript;
      }
      cb.current.onInterim((final + interim).trim());
    };
    r.onerror = () => {};
    r.onend = () => {
      if (rec.current !== r) return;
      rec.current = null;
      setState("idle");
      if (final.trim()) cb.current.onFinal(final.trim());
    };
    rec.current = r;
    setState("listening");
    try {
      r.start();
    } catch {
      setState("idle");
    }
  }, [stopSpeaking]);

  /** Queue one sentence; it plays after the ones before it. */
  const say = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      queue.current.push({ text: t });
      if (queue.current.length <= 2) prep(queue.current[queue.current.length - 1]);
      run();
    },
    [run],
  );

  /** Resolves once everything queued has been spoken (or cut off). */
  const finished = useCallback(
    () => (running.current || queue.current.length ? new Promise<void>((r) => waiters.current.push(r)) : Promise.resolve()),
    [],
  );

  const stopAll = useCallback(() => {
    stopListening();
    stopSpeaking();
  }, [stopListening, stopSpeaking]);

  useEffect(() => stopAll, [stopAll]);

  return { supported, state, listen, stopListening, say, stopSpeaking, finished, stopAll };
}

/**
 * Cuts streamed text into speakable sentences. Feed it deltas with push(); it hands back
 * each sentence as soon as it ends (". ", "! ", "? "), and flush() returns the remainder.
 */
export function sentenceSplitter() {
  let buf = "";
  return {
    push(delta: string): string[] {
      buf += delta;
      const out: string[] = [];
      // a sentence ends at . ! ? (optionally followed by a quote) and then whitespace; "3.5 g" never matches
      let m: RegExpMatchArray | null;
      while ((m = buf.match(/^([\s\S]*?[.!?…]["”’)]?)\s+/))) {
        out.push(m[1]);
        buf = buf.slice(m[0].length);
      }
      return out;
    },
    flush(): string {
      const rest = buf;
      buf = "";
      return rest;
    },
  };
}
