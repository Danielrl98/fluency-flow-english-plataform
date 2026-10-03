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
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return [];
    this.voices = this.synth.getVoices().filter(v => v.lang.startsWith('en'));
    this.updatePreferredVoice();
    return this.voices;
  }

  setAccent(accent) {
    this.accent = accent;
    this.updatePreferredVoice();
  }

  setRate(rate) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  updatePreferredVoice() {
    if (!this.voices.length) return;

    const targetLang = this.accent === 'UK' ? 'en-GB' : 'en-US';
    // Priority voices: Natural / Siri / Samantha / Daniel / Google
    const match = this.voices.find(v => 
      v.lang.replace('_', '-') === targetLang && 
      (v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Siri'))
    ) || this.voices.find(v => v.lang.replace('_', '-').startsWith(targetLang.slice(0, 5)))
      || this.voices.find(v => v.lang.startsWith('en'))
      || this.voices[0];

    this.preferredVoice = match;
  }

  speak(text, onEnd, onBoundary) {
    if (!this.synth || !text) return;

    this.synth.cancel(); // Stop any currently playing audio

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    utterance.rate = this.rate;
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = (e) => {
        // Ignore canceled errors
        if (e.error !== 'canceled') {
          console.warn('SpeechSynthesis error:', e);
        }
        onEnd();
      };
    }

    if (onBoundary) {
      utterance.onboundary = onBoundary;
    }

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  getAvailableVoices() {
    return this.voices;
  }
}

export const speechService = new SpeechService();
