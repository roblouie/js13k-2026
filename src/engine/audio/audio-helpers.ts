export const audioContext = new AudioContext();

export const softBuffer = audioContext.createBuffer(1,audioContext.sampleRate,audioContext.sampleRate);
for(let i=0;i<audioContext.sampleRate;++i){
  softBuffer.getChannelData(0)[i]=Math.random()*2-1;
}

export const hardBuffer = audioContext.createBuffer(1,audioContext.sampleRate,audioContext.sampleRate);
for(let jj=0;jj<64;++jj){
  const r1=Math.random()*10+1;
  const r2=Math.random()*10+1;
  for(let i=0;i<audioContext.sampleRate;++i){
    const dd=Math.sin((i/audioContext.sampleRate)*2*Math.PI*440*r1)*Math.sin((i/audioContext.sampleRate)*2*Math.PI*440*r2);
    hardBuffer.getChannelData(0)[i]+=dd/8;
  }
}

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

export function createDistortionCurve(amount = 20, type: 'distort' | 'clip'): Float32Array<ArrayBuffer> {
  const sampleCount = 256;
  const curve = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; ++i) {
    const x = (i * 2) / (sampleCount - 1) - 1;

    curve[i] = type === 'distort' ? (Math.tanh(x * amount)) : (Math.max(-amount, Math.min(amount, x)) / amount);
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

