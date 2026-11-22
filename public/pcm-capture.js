class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = [];
    this.port.onmessage = event => {
      if (event.data === "flush") { this.flush(); this.port.postMessage("flushed"); }
    };
  }
  flush() {
    if (this.samples.length) {
      const buffer = new Float32Array(this.samples);
      this.port.postMessage(buffer, [buffer.buffer]);
      this.samples = [];
    }
  }
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel) {
      for (const sample of channel) this.samples.push(sample);
      if (this.samples.length >= 4096) this.flush();
    }
    return true;
  }
}
registerProcessor("pcm-capture", PcmCapture);
