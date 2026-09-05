import {
    DOUBLE_LENGTH,
    durationUnits,
    EncodedSong,
    EncodedTrack,
    OCTAVE_DOWN,
    OCTAVE_UP,
    TIE
} from "./song-converter.types";
import {audioContext, frequencyFromMidiNote} from "@/engine/audio/audio-helpers";

interface DecodedNote {
    midi: number;
    startSixteenth: number;
    durationSixteenths: number;
}

export interface DecodedTrack {
    notes: DecodedNote[];
}

// export function decodeSong(encodedSong: EncodedSong): DecodedTrack[] {
//     return encodedSong.tracks.map(track => {
//         const decodedTrack: DecodedTrack = {
//             notes: decodeTrack(track, encodedSong.bpm),
//         };
//
//
//         return decodedTrack;
//     });
// }

function decodeTrack(encodedTrack: EncodedTrack): DecodedNote[] {
    let index = 0;
    let octaveOffset = 0;
    let startTimeOffset = 0;
    let previousStartSixteenth = -1;

    const notes: DecodedNote[] = [];

    while (index < encodedTrack.data.length) {
        const startSixteenth = encodedTrack.data.charCodeAt(index++) - 33;

        if (startSixteenth < previousStartSixteenth) {
            startTimeOffset += 80;
        }

        previousStartSixteenth = startSixteenth;

        let value = encodedTrack.data.charCodeAt(index++) - 33;

        while (value === OCTAVE_UP || value === OCTAVE_DOWN) {
            octaveOffset += value === OCTAVE_UP ? 12 : -12;
            value = encodedTrack.data.charCodeAt(index++) - 33;
        }


        const pitchIndex = Math.floor(value / durationUnits.length);
        const durationIndex = value % durationUnits.length;
        let durationSixteenths = durationUnits[durationIndex];

        while (index < encodedTrack.data.length) {
            const modifier = encodedTrack.data.charCodeAt(index) - 33;

            if (modifier === TIE) {
                ++durationSixteenths;
                ++index;
            } else if (modifier === DOUBLE_LENGTH) {
                durationSixteenths *= 2;
                ++index;
            } else {
                // This character is the next event's start time.
                break;
            }
        }

        // probably should switch to just starting oscillators?


        notes.push({
            midi: encodedTrack.baseMidi + octaveOffset + pitchIndex,
            startSixteenth: startSixteenth + startTimeOffset,
            durationSixteenths
        });
    }

    return notes;
}
