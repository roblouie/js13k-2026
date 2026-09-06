import {
    audioContext, compressor,
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
        velocity: 0.05,
        notes: [[74, 0, 6], [67, 6, 2], [69, 8, 14], [65, 20, 4], [67, 24, 4], [69, 28, 4], [74, 32, 4], [71, 36, 2], [74, 38, 14], [74, 64, 6], [67, 70, 2], [69, 72, 14], [65, 84, 4], [67, 88, 4], [65, 92, 4], [67, 96, 6], [71, 102, 6], [74, 108, 4], [73, 112, 18]]
    }, {
        instrumentPlayer: playViolin,
        velocity: 0.05,
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
        velocity: 0.0375,
        notes: bass([50,48,55,46,50,48,55,57]),
    }],
};




const stepSeconds = 60 / tracks.bpm / 4;
const songSteps = 128;
const songSeconds = songSteps * stepSeconds;

let musicStart = audioContext.currentTime;

export const musicTrackStates = tracks.tracks.map(() => ({
    note_: 0,
    loop_: 0,
    enabled_: false,
}));

function scheduleMusic() {
    const horizon = audioContext.currentTime + 0.2;

    tracks.tracks.forEach((track, trackIndex) => {
        const state = musicTrackStates[trackIndex];

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
    musicStart = audioContext.currentTime;
    scheduleMusic();
    setInterval(scheduleMusic, 50);
}

const shaper5Curve = createDistortionCurve(500);

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
    filter1.connect(compressor);
    oscillator3.connect(gain2);
    oscillator3.start(startTime);
    oscillator4.start(startTime);
    oscillator3.stop(startTime + duration + 0.5);
    oscillator4.stop(startTime + duration + 0.5);
}

const convolv2Buffer = createReverbBuffer(0.6, 0.1);

export function playViolin(startTime, volume, duration, frequency) {
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
    oscillator7.frequency.setValueAtTime(5, startTime + 0);
    const oscillator8 = new OscillatorNode(audioContext);
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
    gain5.connect(compressor);
    oscillator6.start(startTime);
    oscillator7.start(startTime);
    oscillator8.start(startTime);
    oscillator6.stop(startTime + duration + 0.1);
    oscillator7.stop(startTime + duration + 0.1);
    oscillator8.stop(startTime + duration + 0.1);
}

const convolv3Buffer = createReverbBuffer(0.2, 0.2);

export function playBassGuitar(startTime, volume, duration, frequency) {
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
    convolver2.connect(compressor);
    filter1.connect(compressor);
    oscillator5.start(startTime);
    oscillator6.start(startTime);
    oscillator5.stop(startTime + duration + 0.2);
    oscillator6.stop(startTime + duration + 0.2);
}

export function playGlassBreak(startTime, volume, isBasicPickup?: boolean) {
    if (!isBasicPickup) {
        // Initial crack
        const noise = new AudioBufferSourceNode(audioContext);
        noise.buffer = softBuffer;

        const filter = new BiquadFilterNode(audioContext, {
            type: "highpass",
            frequency: 1200,
        });

        const noiseGain = new GainNode(audioContext, {
            gain: 0,
        });

        noiseGain.gain.setValueAtTime(volume, startTime);
        noiseGain.gain.exponentialRampToValueAtTime(
            .0001,
            startTime + .08
        );

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(compressor);

        noise.start(startTime);
        noise.stop(startTime + .1);
    }

    // Ringing fragments
    const count = isBasicPickup ? 1 : 6;
    for (let i = 0; i < count; ++i) {
        const t =
            startTime + Math.random() * .07;

        const duration =.08 + Math.random() * .25;

        const osc = new OscillatorNode(audioContext, {
            type: "sine",
            frequency:
                3000 + Math.random() * 1500,
        });

        const gain = new GainNode(audioContext, {
            gain: 0,
        });

        gain.gain.setValueAtTime(
            volume * (.08 + Math.random() * .15),
            t
        );

        gain.gain.exponentialRampToValueAtTime(
            .0001,
            t + duration
        );

        osc.connect(gain);
        gain.connect(compressor);

        osc.start(t);
        osc.stop(t + duration);
    }
}

export function playHoof(
    startTime,
    volume
) {
    const gain = new GainNode(audioContext);

    // Dirt/ground impact
    const noise = new AudioBufferSourceNode(audioContext, {
        buffer: softBuffer
    });

    const filter = new BiquadFilterNode(audioContext, {
        type: "lowpass",
        frequency: 200,
        Q: 1
    });

    // Body of the hoof impact
    const thump = new OscillatorNode(audioContext, {
        type: "sine",
        frequency: 110
    });

    thump.frequency.setValueAtTime(140, startTime);
    thump.frequency.exponentialRampToValueAtTime(
        70,
        startTime + .06
    );

    const thumpGain = new GainNode(audioContext, {
        gain: .35
    });

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(
        .0001,
        startTime + .09
    );

    noise.connect(filter);
    filter.connect(gain);

    thump.connect(thumpGain);
    thumpGain.connect(gain);

    gain.connect(compressor);

    noise.start(startTime);
    thump.start(startTime);

    noise.stop(startTime + .1);
    thump.stop(startTime + .1);
}
