export type AudioSegment = { blob: Blob; transcript: string | null };

function wav(samples: number[], sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++)
      view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, buffer.byteLength - 8, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, index) =>
    view.setInt16(
      44 + index * 2,
      Math.round(Math.max(-1, Math.min(1, sample)) * 32767),
      true,
    ),
  );
  return new Blob([buffer], { type: "audio/wav" });
}

export async function recordVoice(
  onSegment: (segment: Blob) => void,
  onLevel: (level: number) => void = () => {},
  onDisconnect: () => void = () => {},
) {
  // Resume during the initiating keyboard/click gesture, before permission awaits.
  const context = new AudioContext({ sampleRate: 16000 });
  let stream: MediaStream | undefined;
  let meter: ReturnType<typeof setInterval> | undefined;
  try {
    const resumed = context.resume();
    // Attach a handler immediately while the permission prompt is pending.
    void resumed.catch(() => {});
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    await context.audioWorklet.addModule("/pcm-capture.js");
    let resumeTimeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([resumed, new Promise<never>((_, reject) => {
        resumeTimeout = setTimeout(() => reject(new Error("Microphone audio could not resume.")), 2000);
      })]);
    } finally {
      clearTimeout(resumeTimeout);
    }
    const captureStream = stream;
    const source = context.createMediaStreamSource(stream);
    const capture = new AudioWorkletNode(context, "pcm-capture");
    const silence = context.createGain();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    const waveform = new Float32Array(analyser.fftSize);
    source.connect(analyser);
    meter = setInterval(() => {
      analyser.getFloatTimeDomainData(waveform);
      const rms = Math.sqrt(
        waveform.reduce((sum, sample) => sum + sample * sample, 0) /
          waveform.length,
      );
      onLevel(Math.min(1, rms * 8));
    }, 60);
    stream
      .getAudioTracks()
      .forEach((track) =>
        track.addEventListener("ended", onDisconnect, { once: true }),
      );
    silence.gain.value = 0;
    source.connect(capture);
    capture.connect(silence);
    silence.connect(context.destination);
    const sampleRate = context.sampleRate;
    let samples: number[] = [];
    let stopped = false;
    let resolveFlush: (() => void) | null = null;
    capture.port.onmessage = (event) => {
      if (event.data === "flushed") {
        resolveFlush?.();
        return;
      }
      for (const sample of event.data as Float32Array) samples.push(sample);
      // Every segment is a complete WAV below Sarvam's 30-second REST limit.
      if (samples.length >= sampleRate * 20) {
        onSegment(wav(samples, sampleRate));
        samples = [];
      }
    };
    return async () => {
      if (stopped) return;
      stopped = true;
      clearInterval(meter);
      onLevel(0);
      analyser.disconnect();
      source.disconnect();
      captureStream.getTracks().forEach((track) => track.stop());
      await new Promise<void>((resolve) => {
        resolveFlush = resolve;
        capture.port.postMessage("flush");
        setTimeout(resolve, 1000);
      });
      capture.disconnect();
      silence.disconnect();
      if (samples.length) onSegment(wav(samples, sampleRate));
      await context?.close();
    };
  } catch (error) {
    clearInterval(meter);
    onLevel(0);
    stream?.getTracks().forEach((track) => track.stop());
    await context?.close();
    throw error;
  }
}
