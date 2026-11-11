let sharedAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
	if (typeof window === "undefined") {
		return null;
	}
	const AudioContextConstructor =
		window.AudioContext ||
		(window as unknown as { webkitAudioContext?: typeof AudioContext })
			.webkitAudioContext;
	if (!AudioContextConstructor) {
		return null;
	}
	if (!sharedAudioContext) {
		sharedAudioContext = new AudioContextConstructor();
	}
	if (sharedAudioContext.state === "suspended") {
		void sharedAudioContext.resume();
	}
	return sharedAudioContext;
};

export const playCorrectSound = (streakCount: number, enabled: boolean): void => {
	if (!enabled) {
		return;
	}
	try {
		const context = getAudioContext();
		if (!context) {
			return;
		}
		const now = context.currentTime;
		const oscillator = context.createOscillator();
		const gainNode = context.createGain();

		const semitoneShift = Math.min(streakCount, 12);
		const baseFrequency = 523.25 * Math.pow(2, semitoneShift / 24);

		oscillator.type = "triangle";
		oscillator.frequency.setValueAtTime(baseFrequency, now);
		oscillator.frequency.exponentialRampToValueAtTime(
			baseFrequency * 1.25,
			now + 0.09
		);

		gainNode.gain.setValueAtTime(0.14, now);
		gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

		oscillator.connect(gainNode);
		gainNode.connect(context.destination);

		oscillator.start(now);
		oscillator.stop(now + 0.18);
	} catch {
		// Ignore audio context restrictions
	}
};

export const playWrongSound = (enabled: boolean): void => {
	if (!enabled) {
		return;
	}
	try {
		const context = getAudioContext();
		if (!context) {
			return;
		}
		const now = context.currentTime;
		const oscillator = context.createOscillator();
		const gainNode = context.createGain();

		oscillator.type = "sawtooth";
		oscillator.frequency.setValueAtTime(190, now);
		oscillator.frequency.linearRampToValueAtTime(135, now + 0.18);

		gainNode.gain.setValueAtTime(0.12, now);
		gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

		oscillator.connect(gainNode);
		gainNode.connect(context.destination);

		oscillator.start(now);
		oscillator.stop(now + 0.22);
	} catch {
		// Ignore audio context restrictions
	}
};

export const playVictorySound = (enabled: boolean): void => {
	if (!enabled) {
		return;
	}
	try {
		const context = getAudioContext();
		if (!context) {
			return;
		}
		const notes = [523.25, 659.25, 783.99, 1046.5];
		notes.forEach((frequency, index) => {
			const startTime = context.currentTime + index * 0.08;
			const oscillator = context.createOscillator();
			const gainNode = context.createGain();

			oscillator.type = "triangle";
			oscillator.frequency.setValueAtTime(frequency, startTime);

			gainNode.gain.setValueAtTime(0.14, startTime);
			gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

			oscillator.connect(gainNode);
			gainNode.connect(context.destination);

			oscillator.start(startTime);
			oscillator.stop(startTime + 0.28);
		});
	} catch {
		// Ignore audio context restrictions
	}
};

export const speakKanaCharacter = (
	character: string,
	enabled: boolean
): void => {
	if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
		return;
	}
	try {
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(character);
		utterance.lang = "ja-JP";
		utterance.rate = 0.95;
		const voices = window.speechSynthesis.getVoices();
		const japaneseVoice = voices.find((voice) =>
			voice.lang.toLowerCase().startsWith("ja")
		);
		if (japaneseVoice) {
			utterance.voice = japaneseVoice;
		}
		window.speechSynthesis.speak(utterance);
	} catch {
		// Ignore speech synthesis errors on unsupported browsers
	}
};
