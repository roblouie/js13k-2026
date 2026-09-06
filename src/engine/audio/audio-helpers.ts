export const audioContext = new AudioContext();

export const softBuffer = audioContext.createBuffer(1,audioContext.sampleRate,audioContext.sampleRate);
for(let i=0;i<audioContext.sampleRate;++i){
  softBuffer.getChannelData(0)[i]=Math.random()*2-1;
}

export const compressor = new DynamicsCompressorNode(audioContext, {
  threshold: -12,
  knee: 10,
  ratio: 4,
  attack: .003,
  release: .15,
});

compressor.connect(audioContext.destination);

export function envelopeMe(attack: number, decay: number, sustainLevel: number, release: number, volume: number, startTime: number, duration: number, audioParam: AudioParam) {
  audioParam.setValueAtTime(0, startTime);
  const sustainValue = volume * sustainLevel;

  if (duration <= attack) {
    const valueAtRelease = volume * (duration / attack);
    audioParam.linearRampToValueAtTime(valueAtRelease, startTime + duration);
  } else {
    audioParam.linearRampToValueAtTime(volume, startTime + attack);

    if (duration <= attack + decay) {
      const decayProgress = (duration - attack) / decay;
      const valueAtRelease = volume + (sustainValue - volume) * decayProgress;
      audioParam.linearRampToValueAtTime(valueAtRelease, startTime + duration);
    } else {
      audioParam.linearRampToValueAtTime(sustainValue, startTime + attack + decay);
      audioParam.setValueAtTime(sustainValue, startTime + duration);
    }
  }

  audioParam.linearRampToValueAtTime(0, startTime + duration + release);

  return startTime + duration + release;
}

export function frequencyFromMidiNote(midiNote: number) {
  return 440*2**((midiNote-69)/12);
}

export function createDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const sampleCount = 256;
  const curve = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; ++i) {
    const x = (i * 2) / (sampleCount - 1) - 1;

    curve[i] = Math.tanh(x * amount);
  }

  return curve;
}

export function createReverbBuffer(duration = 2, decay = 2) {
  const rate = audioContext.sampleRate;
  const length = rate * duration;
  const impulse = audioContext.createBuffer(2, length, rate);
  for (let c = 0; c < impulse.numberOfChannels; c++) {
    const channel = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }

  return impulse;
}

