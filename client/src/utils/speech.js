// Web Speech API helper for high-quality native text-to-speech

class SpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.preferredVoice = null;
    this.rate = 1.0;
    this.accent = 'US'; // 'US' or 'UK'

    if (this.synth) {
      this.loadVoices();
      if (typeof this.synth.onvoiceschanged !== 'undefined') {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return [];
    try {
      const rawVoices = this.synth.getVoices() || [];
      this.voices = rawVoices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
      this.updatePreferredVoice();
    } catch {
      this.voices = [];
    }
    return this.voices;
  }

  setAccent(accent) {
    if (this.accent === accent) return;
    this.accent = accent;
    this.updatePreferredVoice();
  }

  setRate(rate) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  updatePreferredVoice() {
    if (!this.voices || !this.voices.length) {
      // Retry loading if voices weren't ready on initial sync constructor
      if (this.synth) {
        const raw = this.synth.getVoices() || [];
        this.voices = raw.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
      }
    }

    if (!this.voices.length) return;

    const targetLang = this.accent === 'UK' ? 'en-gb' : 'en-us';
    const match = this.voices.find(v => {
      const lang = v.lang.replace('_', '-').toLowerCase();
      const name = v.name.toLowerCase();
      return lang === targetLang && (
        name.includes('samantha') ||
        name.includes('daniel') ||
        name.includes('natural') ||
        name.includes('google') ||
        name.includes('siri')
      );
    }) || this.voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.slice(0, 5)))
      || this.voices.find(v => v.lang.toLowerCase().startsWith('en'))
      || this.voices[0];

    this.preferredVoice = match;
  }

  speak(text, onEnd, onBoundary) {
    if (!this.synth || !text) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.synth.cancel();
    } catch {
      // ignore
    }

    // Lazy load preferred voice if null
    if (!this.preferredVoice && this.voices.length === 0) {
      this.loadVoices();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    utterance.rate = this.rate;
    utterance.pitch = 1.0;

    let ended = false;
    const safeEnd = () => {
      if (!ended) {
        ended = true;
        if (onEnd) onEnd();
      }
    };

    utterance.onend = safeEnd;
    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        console.warn('SpeechSynthesis error:', e);
      }
      safeEnd();
    };

    if (onBoundary) {
      utterance.onboundary = onBoundary;
    }

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis speak failed:', err);
      safeEnd();
    }
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
    }
  }

  getAvailableVoices() {
    return this.voices;
  }
}

export const speechService = new SpeechService();