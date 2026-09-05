export const DOUBLE_LENGTH = 90;
export const OCTAVE_UP = 91;
export const OCTAVE_DOWN = 92;
export const TIE = 93;

export interface SequenceSong {
    id: string;
    name: string;
    tracks: SequenceTrack[];
    bpm: number;
}

export interface SequenceTrack {
    id: string;
    trackName?: string;
    instrumentId: string;
    trackColor?: string;
    velocity: number; // should probably be removed in favor of a special note character that allows raising or lowering the volume
    notes: SequenceNote[];
    baseMidi: number;
}

export interface SequenceNote {
    id: string;
    midi: number;
    startSixteenth: number;
    durationSixteenths: number;
}

export type DecodedNote = Omit<SequenceNote, 'id'>;

export const durationUnits: readonly number[] = [
    1, // sixteenth
    2, // eighth
    3, // dotted eighth
    4, // quarter
    6, // dotted quarter
    8, // half
];

export interface EncodedTrack {
    baseMidi: number;
    data: string;
    velocity: number;
    instrumentPlayer: (startTime: number, volume: number, duration: number, frequency: number) => void;
}

export interface EncodedSong {
    bpm: number;
    tracks: EncodedTrack[];
}

