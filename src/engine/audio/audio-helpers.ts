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
  audioParam.linearRampToValueAtTime(volume, startTime + attack);
  audioParam.linearRampToValueAtTime(sustainLevel, startTime + attack + decay);
  audioParam.setValueAtTime(sustainLevel, startTime + duration);
  audioParam.linearRampToValueAtTime(0, startTime + duration + release);
  return startTime + duration + release;
}

export function frequencyFromMidiNote(midiNote: number) {
  return 440*2**((midiNote-69)/12);
}

function createReverbImpulse(duration = 2, decay = 2) {
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

export const reverb = audioContext.createConvolver();
reverb.buffer = createReverbImpulse(2, 0.5);

export const musicDryGain = audioContext.createGain();
export const musicWetGain = audioContext.createGain();
musicDryGain.gain.value = 0.15;
musicWetGain.gain.value = 0.15;

musicDryGain.connect(audioContext.destination);
musicWetGain.connect(reverb).connect(audioContext.destination);

