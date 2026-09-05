import {
    audioContext,
    createDistortionCurve,
    createReverbBuffer,
    envelopeMe, frequencyFromMidiNote,
    softBuffer
} from "@/engine/audio/audio-helpers";
import {decodeSong} from "@/engine/audio/sequence-decoder";
import {EncodedSong, EncodedTrack} from "@/engine/audio/song-converter.types";

const tracks: EncodedSong = {
    bpm: 140,
    tracks: [
        { baseMidi: 60, velocity: 0.2, instrumentPlayer: playElectricGuitar, data: "!y'L)[~{5B9N=ZAxEdGy~{aygLi[~{%B)N-B1O7g=xAt~{" },
        { baseMidi: 60, velocity: 0.2, instrumentPlayer: playViolin, data: "!\\~{!|D~{!2~{1}P~{1|>~{1&~{A2~{Ah~{AP~{Q}D~{Qz~{Qb~{a\\~{a|D~{a2~{!}P~{!|>~{!&~{12~{1h~{1P~{A>~{At~{A\\~{" },
        { baseMidi: 60, velocity: 0.15, instrumentPlayer: playBassGuitar, data: "!}.#W$u%.'W(u).+W,u-./W0u1\"3K4i5\"7K8i9\";K<i=\"?K@iALCuD|KE}LGuH|KI}LKuL|KM}LOuP|KQ}}^S|?T]U}^W|?X]Y}^[|?\\]]}^_|?`]a.cWdue.gWhui.kWlum.oWpu!\"#K$i%\"'K(i)\"+K,i-\"/K0i1L3u4|K5}L7u8|K9}L;u<|K=}L?u@|KA}XC|9DWE}XG|9HWI}XK|9LWM}XO|9PW" },
        { baseMidi: 60, velocity: 0.3, instrumentPlayer: playHighTom, data: "'}}?7?G?W?g?'?7?G?" },
        { baseMidi: 60, velocity: 0.3, instrumentPlayer: playLowTom, data: "%}}959E9U9e9%959E9" },
        { baseMidi: 60, velocity: 0.4, instrumentPlayer: playKickDrum, data: "!}}3)3-393=3A3I3M3Y3]3a3i3m3)3-31393=3I3M3" },
    ],
};


const decodedTracks = decodeSong(tracks);

const stepSeconds = 60 / tracks.bpm / 4;
const songSteps = 128; // whatever your actual loop length is
const songSeconds = songSteps * stepSeconds;

const musicStart = audioContext.currentTime + 0.1;

const states = decodedTracks.map(() => ({
    note: 0,
    loop: 0,
    enabled: true,
}));

function scheduleMusic() {
    const horizon = audioContext.currentTime + 0.2;

    decodedTracks.forEach((track, trackIndex) => {
        if (!track.notes.length) {
            return;
        }

        const state = states[trackIndex];

        while (true) {
            const note = track.notes[state.note];

            const startTime =
                musicStart +
                state.loop * songSeconds +
                note.startSixteenth * stepSeconds;

            if (startTime >= horizon) {
                break;
            }

            if (state.enabled && startTime >= audioContext.currentTime) {
                const original = tracks.tracks[trackIndex];

                original.instrumentPlayer(
                    startTime,
                    original.velocity,
                    note.durationSixteenths * stepSeconds,
                    note.midi,
                );
            }

            if (++state.note === track.notes.length) {
                state.note = 0;
                ++state.loop;
            }
        }
    });
}

export function playSong() {
    scheduleMusic();
    setInterval(scheduleMusic, 50);
}

const shaper5Curve = createDistortionCurve(500, 'distort');console.log(shaper5Curve);

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

function playHighTom(startTime, volume) {
    const buffer0 = new AudioBufferSourceNode(audioContext, { buffer: softBuffer });
    buffer0.loop = true;
    buffer0.playbackRate.setValueAtTime(1, startTime + 0);
    const filter2 = new BiquadFilterNode(audioContext);
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(2000, startTime + 0);
    const convolver3 = new ConvolverNode(audioContext);
    convolver3.buffer = convolv4Buffer;
    const gain4 = new GainNode(audioContext);
    gain4.gain.setValueAtTime(volume * 0.8, startTime + 0);
    gain4.gain.linearRampToValueAtTime(volume * 0, startTime + 0.2);
    const gain5 = new GainNode(audioContext);
    gain5.gain.setValueAtTime(volume * 0.5, startTime + 0);
    gain5.gain.linearRampToValueAtTime(volume * 0, startTime + 0.05);
    const oscillator6 = new OscillatorNode(audioContext);
    oscillator6.type = 'sine';
    oscillator6.frequency.setValueAtTime(320, startTime + 0);
    oscillator6.frequency.linearRampToValueAtTime(160, startTime + 0.05);
    oscillator6.connect(gain4);
    buffer0.connect(gain5);
    gain4.connect(audioContext.destination);
    gain5.connect(filter2);
    filter2.connect(audioContext.destination);
    filter2.connect(convolver3);
    gain4.connect(convolver3);
    convolver3.connect(audioContext.destination);
    buffer0.start(startTime);
    oscillator6.start(startTime);
    buffer0.stop(startTime + 0.2);
    oscillator6.stop(startTime + 0.2);
}

const convolv5Buffer = createReverbBuffer(0.3, 0.1);

function playLowTom(startTime, volume) {
    const buffer0 = new AudioBufferSourceNode(audioContext, { buffer: softBuffer });
    buffer0.loop = true;
    buffer0.playbackRate.setValueAtTime(1, startTime + 0);
    const filter2 = new BiquadFilterNode(audioContext);
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(800, startTime + 0);
    const convolver3 = new ConvolverNode(audioContext);
    convolver3.buffer = convolv5Buffer;
    const gain4 = new GainNode(audioContext);
    gain4.gain.setValueAtTime(volume * 0.8, startTime + 0);
    gain4.gain.linearRampToValueAtTime(volume * 0, startTime + 0.2);
    const gain5 = new GainNode(audioContext);
    gain5.gain.setValueAtTime(volume * 3, startTime + 0);
    gain5.gain.linearRampToValueAtTime(volume * 0, startTime + 0.05);
    const oscillator6 = new OscillatorNode(audioContext);
    oscillator6.type = 'sine';
    oscillator6.frequency.setValueAtTime(150, startTime + 0);
    oscillator6.frequency.linearRampToValueAtTime(90, startTime + 0.05);
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
    buffer0.stop(startTime + 0.2);
    oscillator6.stop(startTime + 0.2);
}

const convolv6Buffer = createReverbBuffer(0.4, 0.9);

function playKickDrum(startTime, volume) {
    const buffer0 = new AudioBufferSourceNode(audioContext, { buffer: softBuffer });
    buffer0.loop = true;
    const filter2 = new BiquadFilterNode(audioContext);
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(180, startTime + 0);
    const convolver3 = new ConvolverNode(audioContext);
    convolver3.buffer = convolv6Buffer;
    const gain4 = new GainNode(audioContext);
    gain4.gain.setValueAtTime(volume * 0.5, startTime + 0);
    gain4.gain.linearRampToValueAtTime(volume * 0, startTime + 0.1);
    const gain5 = new GainNode(audioContext);
    gain5.gain.setValueAtTime(volume * 5, startTime + 0);
    gain5.gain.linearRampToValueAtTime(volume * 0, startTime + 0.1);
    const oscillator6 = new OscillatorNode(audioContext);
    oscillator6.type = 'triangle';
    oscillator6.frequency.setValueAtTime(120, startTime + 0);
    oscillator6.frequency.linearRampToValueAtTime(50, startTime + 0.05);
    oscillator6.connect(gain4);
    convolver3.connect(audioContext.destination);
    gain5.connect(audioContext.destination);
    gain5.connect(convolver3);
    buffer0.connect(filter2);
    filter2.connect(gain5);
    gain4.connect(convolver3);
    gain4.connect(audioContext.destination);
    buffer0.start(startTime);
    oscillator6.start(startTime);
    buffer0.stop(startTime + 0.1);
    oscillator6.stop(startTime + 0.1);
}
