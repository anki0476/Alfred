declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OPENAI_API_KEY?: string;
    SARVAM_API_KEY?: string;
    OPENAI_MODEL?: string;
    DECISIONS_MODEL?: string;
    SARVAM_STT_MODEL?: string;
    SARVAM_TTS_MODEL?: string;
    SARVAM_SPEAKER?: string;
  }
}
