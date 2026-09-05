import {
    audioContext,
    createDistortionCurve,
    createReverbBuffer,
    envelopeMe, frequencyFromMidiNote,
    softBuffer
} from "@/engine/audio/audio-helpers";
import {EncodedSong, EncodedTrack} from "@/engine/audio/song-converter.types";

const bass = (a: number[]) =>
    a.flatMap((n, b) =>
        [0, 4, 8, 12].flatMap(i => [
            [n, b * 16 + i, 2],
            [n + 7, b * 16 + i + 2, 1],
            [n + 12, b * 16 + i + 3, 1],
        ])
    );

const tracks: EncodedSong = {
    bpm: 140,
    tracks: [{
        instrumentPlayer: playElectricGuitar,
        velocity: 0.2,
        notes: [[74, 0, 6], [67, 6, 2], [69, 8, 14], [65, 20, 4], [67, 24, 4], [69, 28, 4], [74, 32, 4], [71, 36, 2], [74, 38, 14], [74, 64, 6], [67, 70, 2], [69, 72, 14], [65, 84, 4], [67, 88, 4], [65, 92, 4], [67, 96, 6], [71, 102, 6], [74, 108, 4], [73, 112, 18]]
    }, {
        instrumentPlayer: playViolin,
        velocity: 0.2,
        notes: [
                [69, 0, 18], [77, 0, 18], [74, 0, 18],
                [67, 16, 18], [76, 16, 18], [72, 16, 18],
                [74, 32, 18], [83, 32, 18], [79, 32, 18],
                [65, 48, 18], [74, 48, 18], [70, 48, 18],

                [69, 64, 18], [77, 64, 18], [74, 64, 18],
                [67, 80, 18], [76, 80, 18], [72, 80, 18],
                [74, 96, 18], [83, 96, 18], [79, 96, 18],
                [76, 112, 18], [85, 112, 18], [81, 112, 18]]
    }, {
        instrumentPlayer: playBassGuitar,
        velocity: 0.15,
        notes: bass([50,48,55,46,50,48,55,57]),
    },{
        velocity: 0.3,
        instrumentPlayer: playLowTom,
        notes: [[43, 0, 1], [47, 4, 1], [52, 6, 1], [43, 8, 1], [43, 12, 1], [47, 20, 1], [52, 22, 1], [43, 24, 1], [43, 28, 1],
                [43, 32, 1], [47, 36, 1], [52, 38, 1], [43, 40, 1], [43, 44, 1], [47, 52, 1], [52, 54, 1], [43, 56, 1], [43, 60, 1],
                [43, 64, 1], [47, 68, 1], [52, 70, 1], [43, 72, 1], [43, 76, 1], [47, 84, 1], [52, 86, 1], [43, 88, 1], [43, 92, 1],
                [43, 96, 1], [47, 100, 1], [52, 102, 1], [43, 104, 1], [43, 108, 1], [47, 116, 1], [52, 118, 1], [43, 120, 1], [43, 124, 1]]
    }],
};




const stepSeconds = 60 / tracks.bpm / 4;
const songSteps = 128;
const songSeconds = songSteps * stepSeconds;

const musicStart = audioContext.currentTime + 0.1;

const states = tracks.tracks.map(() => ({
    note_: 0,
    loop_: 0,
    enabled_: true,
}));

function scheduleMusic() {
    const horizon = audioContext.currentTime + 0.2;

    tracks.tracks.forEach((track, trackIndex) => {
        const state = states[trackIndex];

        while (true) {
            const note = track.notes[state.note_];

            const startTime =
                musicStart +
                state.loop_ * songSeconds +
                note[1] * stepSeconds;

            if (startTime >= horizon) {
                break;
            }

            if (state.enabled_ && startTime >= audioContext.currentTime) {
                track.instrumentPlayer(
                    startTime,
                    track.velocity,
                    note[2] * stepSeconds,
                    frequencyFromMidiNote(note[0]),
                );
            }

            if (++state.note_ === track.notes.length) {
                state.note_ = 0;
                ++state.loop_;
            }
        }
    });
}

export function playSong() {
    scheduleMusic();
    setInterval(scheduleMusic, 50);
}

const shaper5Curve = createDistortionCurve(500, 'distort');

function playElectricGuitar(startTime, volume, duration, frequency) {
    const filter1 = new BiquadFilterNode(audioContext);
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(5000, startTime + 0);
    const gain2 = new GainNode(audioContext);
    envelopeMe(0.01, 0.01, 0.8, 0.5, volume, startTime, duration, gain2.gain);
    const oscillator3 = new OscillatorNode(audioContext);
    oscillator3.type = 'sawtooth';
    oscillator3.frequency.setValueAtTime(frequency * 1, startTime + 0);
    const oscillator4 = new OscillatorNode(audioContext);
    oscillator4.type = 'triangle';
    oscillator4.frequency.setValueAtTime(frequency * 1, startTime + 0);
    oscillator4.detune.setValueAtTime(3, startTime + 0);
    const shaper5 = new WaveShaperNode(audioContext);
    shaper5.curve = shaper5Curve;
    shaper5.oversample = '4x';
    oscillator3.connect(shaper5);
    oscillator4.connect(shaper5);
    gain2.connect(filter1);
    shaper5.connect(gain2);
    filter1.connect(audioContext.destination);
    oscillator3.connect(gain2);
    oscillator3.start(startTime);
    oscillator4.start(startTime);
    oscillator3.stop(startTime + duration + 0.5);
    oscillator4.stop(startTime + duration + 0.5);
}

const convolv2Buffer = createReverbBuffer(0.6, 0.1);

function playViolin(startTime, volume, duration, frequency) {
    const filter1 = new BiquadFilterNode(audioContext);
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(6000, startTime + 0);
    filter1.frequency.linearRampToValueAtTime(4000, startTime + 0);
    const convolver2 = new ConvolverNode(audioContext);
    convolver2.buffer = convolv2Buffer;
    const gain3 = new GainNode(audioContext);
    envelopeMe(0.1, 0.05, 1, 0.01, volume, startTime, duration, gain3.gain);
    const gain4 = new GainNode(audioContext);
    envelopeMe(0.1, 0.05, 20, 0.1, volume, startTime, duration, gain4.gain);
    const gain5 = new GainNode(audioContext);
    gain5.gain.setValueAtTime(3, startTime + 0);
    const oscillator6 = new OscillatorNode(audioContext);
    oscillator6.type = 'sawtooth';
    oscillator6.frequency.setValueAtTime(frequency + 0, startTime + 0);
    oscillator6.detune.setValueAtTime(-7, startTime + 0);
    const oscillator7 = new OscillatorNode(audioContext);
    oscillator7.type = 'sine';
    oscillator7.frequency.setValueAtTime(5, startTime + 0);
    const oscillator8 = new OscillatorNode(audioContext);
    oscillator8.type = 'sine';
    oscillator8.frequency.setValueAtTime(frequency + 0, startTime + 0);
    oscillator8.detune.setValueAtTime(7, startTime + 0);
    convolver2.connect(gain5);
    filter1.connect(gain3);
    oscillator6.connect(filter1);
    oscillator7.connect(gain4);
    gain4.connect(oscillator6.detune);
    oscillator8.connect(filter1);
    gain3.connect(convolver2);
    gain4.connect(oscillator8.detune);
    gain5.connect(audioContext.destination);
    oscillator6.start(startTime);
    oscillator7.start(startTime);
    oscillator8.start(startTime);
    oscillator6.stop(startTime + duration + 0.1);
    oscillator7.stop(startTime + duration + 0.1);
    oscillator8.stop(startTime + duration + 0.1);
}

const convolv3Buffer = createReverbBuffer(0.2, 0.2);

function playBassGuitar(startTime, volume, duration, frequency) {
    const filter1 = new BiquadFilterNode(audioContext);
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(2000, startTime + 0);
    filter1.Q.setValueAtTime(5, startTime + 0);
    const convolver2 = new ConvolverNode(audioContext);
    convolver2.buffer = convolv3Buffer;
    const gain3 = new GainNode(audioContext);
    envelopeMe(0, 0.8, 0.7, 0.2, volume, startTime, duration, gain3.gain);
    const gain4 = new GainNode(audioContext);
    gain4.gain.setValueAtTime(0.5, startTime + 0);
    const oscillator5 = new OscillatorNode(audioContext);
    oscillator5.type = 'triangle';
    oscillator5.frequency.setValueAtTime(frequency + 0, startTime + 0);
    const oscillator6 = new OscillatorNode(audioContext);
    oscillator6.type = 'triangle';
    oscillator6.frequency.setValueAtTime(frequency * 2, startTime + 0);
    oscillator6.detune.setValueAtTime(2, startTime + 0);
    oscillator5.connect(gain3);
    oscillator6.connect(gain4);
    gain4.connect(gain3);
    filter1.connect(convolver2);
    gain3.connect(filter1);
    convolver2.connect(audioContext.destination);
    filter1.connect(audioContext.destination);
    oscillator5.start(startTime);
    oscillator6.start(startTime);
    oscillator5.stop(startTime + duration + 0.2);
    oscillator6.stop(startTime + duration + 0.2);
}

const convolv4Buffer = createReverbBuffer(0.3, 0.1);

function playLowTom(startTime, volume, duration, frequency) {
    const buffer0 = new AudioBufferSourceNode(audioContext, { buffer: softBuffer });
    buffer0.loop = true;
    buffer0.playbackRate.setValueAtTime(1, startTime + 0);
    const filter2 = new BiquadFilterNode(audioContext);
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(frequency + 800, startTime + 0);
    const convolver3 = new ConvolverNode(audioContext);
    convolver3.buffer = convolv4Buffer;
    const gain4 = new GainNode(audioContext);
    envelopeMe(0, 0, 0.8, 0.1, volume, startTime, duration, gain4.gain);
    const gain5 = new GainNode(audioContext);
    gain5.gain.setValueAtTime(volume * 0.3, startTime + 0);
    gain5.gain.linearRampToValueAtTime(volume * 0, startTime + 0.05);
    const oscillator6 = new OscillatorNode(audioContext);
    oscillator6.type = 'sine';
    oscillator6.frequency.setValueAtTime(frequency * 1, startTime + 0);
    oscillator6.frequency.linearRampToValueAtTime(frequency * 0.6, startTime + 0.05);
    oscillator6.connect(gain4);
    gain4.connect(audioContext.destination);
    gain5.connect(audioContext.destination);
    gain5.connect(convolver3);
    gain4.connect(convolver3);
    convolver3.connect(audioContext.destination);
    buffer0.connect(filter2);
    filter2.connect(gain5);
    buffer0.start(startTime);
    oscillator6.start(startTime);
    buffer0.stop(startTime + duration + 0.1);
    oscillator6.stop(startTime + duration + 0.1);
}
