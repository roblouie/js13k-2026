import {audioContext, envelopeMe, softBuffer} from "@/engine/audio/audio-helpers";

export function jumpSound() {
  const noise = audioContext.createBufferSource();
  noise.buffer = softBuffer;
  noise.loop = true;

  const noiseFilter = audioContext.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 450;
  noiseFilter.gain.value = 0;

  noise.connect(noiseFilter);


  const gain = audioContext.createGain();
  const stopTime = envelopeMe(0.05, 0.01, 0.07, 0.03, 1, audioContext.currentTime, 0.07, gain.gain)

  noiseFilter.connect(gain);
  gain.connect(audioContext.destination);

  noise.start();
  noise.stop(stopTime);
}
