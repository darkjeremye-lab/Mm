import { WakeAlarmSound } from '../types';
import {
  getCustomAudio,
  getCachedDecodedBuffer,
  setCachedDecodedBuffer,
} from './customAudioStorage';

// Web Audio API chime synthesizer for notifications (no external audio assets required)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playReminderChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // First tone (pleasant high chime)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.45);

    // Second tone (harmonious chord finish)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6
    
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch (e) {
    console.warn('Audio playback not allowed or failed', e);
  }
}

export function playStudyCompleteChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Harmonic progression: C5 -> E5 -> G5 -> C6 (Joyful resolution)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const startTime = now + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i === 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  } catch (e) {
    console.warn('Audio playback failed', e);
  }
}

export function playToggleSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    // ignore
  }
}

// Alarm Audio Engine - Master Bus, Gain, and Node Tracking
let alarmMasterGain: GainNode | null = null;
let alarmCompressor: DynamicsCompressorNode | null = null;
let activeAlarmOscillators: (OscillatorNode | AudioScheduledSourceNode)[] = [];
let currentAlarmLoopInterval: ReturnType<typeof setInterval> | null = null;

// Bundled Motivational Alarm Audio Asset
export const MOTIVATIONAL_ALARM_FILE_URL = '/motivational_alarm_to_get_up_in_the_morning(256k)(1).mp3';
let motivationalAudioBuffer: AudioBuffer | null = null;

async function getMotivationalAudioBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (motivationalAudioBuffer) {
    return motivationalAudioBuffer;
  }
  try {
    const res = await fetch(MOTIVATIONAL_ALARM_FILE_URL);
    if (!res.ok) {
      console.warn('Failed to load motivational alarm audio file:', res.status, res.statusText);
      return null;
    }
    const arrayBuf = await res.arrayBuffer();
    motivationalAudioBuffer = await ctx.decodeAudioData(arrayBuf);
    return motivationalAudioBuffer;
  } catch (err) {
    console.warn('Error decoding motivational alarm MP3:', err);
    return null;
  }
}

function getAlarmMasterBus(ctx: AudioContext): GainNode {
  if (!alarmCompressor) {
    alarmCompressor = ctx.createDynamicsCompressor();
    alarmCompressor.threshold.setValueAtTime(-10, ctx.currentTime);
    alarmCompressor.knee.setValueAtTime(12, ctx.currentTime);
    alarmCompressor.ratio.setValueAtTime(4.5, ctx.currentTime);
    alarmCompressor.attack.setValueAtTime(0.003, ctx.currentTime);
    alarmCompressor.release.setValueAtTime(0.25, ctx.currentTime);
    alarmCompressor.connect(ctx.destination);
  }

  if (!alarmMasterGain) {
    alarmMasterGain = ctx.createGain();
    alarmMasterGain.gain.setValueAtTime(0.65, ctx.currentTime);
    alarmMasterGain.connect(alarmCompressor);
  } else {
    // Ensure gain is open
    alarmMasterGain.gain.cancelScheduledValues(ctx.currentTime);
    alarmMasterGain.gain.setValueAtTime(0.65, ctx.currentTime);
  }

  return alarmMasterGain;
}

export function stopAlarmAudio(): void {
  // Clear any repeating loop interval
  if (currentAlarmLoopInterval !== null) {
    clearInterval(currentAlarmLoopInterval);
    currentAlarmLoopInterval = null;
  }

  // Instantly ramp down master gain to avoid clicks
  if (audioCtx && alarmMasterGain) {
    const now = audioCtx.currentTime;
    try {
      alarmMasterGain.gain.cancelScheduledValues(now);
      alarmMasterGain.gain.setTargetAtTime(0, now, 0.015);
    } catch {
      // ignore
    }
  }

  // Stop and disconnect all active alarm oscillators
  activeAlarmOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // ignore already stopped
    }
  });
  activeAlarmOscillators = [];
}

/**
 * Plays one full layered motif for the requested alarm sound.
 * Used for both individual preview and each repetition of the alarm loop.
 */
export function playAlarmTone(
  sound: WakeAlarmSound = 'gentle_chime',
  customSoundId?: string,
  directAudioData?: ArrayBuffer
): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Silence any previous active preview or ringing notes
    activeAlarmOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    activeAlarmOscillators = [];

    const masterBus = getAlarmMasterBus(ctx);
    const now = ctx.currentTime;

    const trackOsc = (osc: OscillatorNode | AudioScheduledSourceNode) => {
      activeAlarmOscillators.push(osc);
      osc.onended = () => {
        const idx = activeAlarmOscillators.indexOf(osc);
        if (idx !== -1) activeAlarmOscillators.splice(idx, 1);
      };
    };

    // 1. GENTLE CHIME: Brisk, bright, ascending 6-bell arpeggio motif
    if (sound === 'gentle_chime') {
      const bellFilter = ctx.createBiquadFilter();
      bellFilter.type = 'lowpass';
      bellFilter.frequency.setValueAtTime(2800, now);
      bellFilter.connect(masterBus);

      // E5 -> G#5 -> B5 -> E6 arpeggio with high double-tap finish
      const bells = [
        { freq: 659.25, time: 0.0, vol: 0.22, decay: 0.9 },   // E5
        { freq: 830.61, time: 0.16, vol: 0.2, decay: 0.85 },  // G#5
        { freq: 987.77, time: 0.32, vol: 0.22, decay: 0.85 },  // B5
        { freq: 1318.51, time: 0.48, vol: 0.24, decay: 1.1 }, // E6 (crest)
        { freq: 987.77, time: 0.72, vol: 0.18, decay: 0.7 },   // B5
        { freq: 1318.51, time: 0.88, vol: 0.22, decay: 1.1 }, // E6 resolution
      ];

      bells.forEach(({ freq, time, vol, decay }) => {
        const start = now + time;

        // Fundamental tone with immediate strike
        const oscFund = ctx.createOscillator();
        const gainFund = ctx.createGain();
        oscFund.type = 'sine';
        oscFund.frequency.setValueAtTime(freq, start);

        gainFund.gain.setValueAtTime(0, start);
        gainFund.gain.linearRampToValueAtTime(vol, start + 0.005);
        gainFund.gain.exponentialRampToValueAtTime(0.0001, start + decay);

        oscFund.connect(gainFund);
        gainFund.connect(bellFilter);

        // Physical chime overtone (2.756x ratio - metallic chime strike)
        const oscOvertone = ctx.createOscillator();
        const gainOvertone = ctx.createGain();
        oscOvertone.type = 'sine';
        oscOvertone.frequency.setValueAtTime(freq * 2.756, start);

        gainOvertone.gain.setValueAtTime(0, start);
        gainOvertone.gain.linearRampToValueAtTime(vol * 0.35, start + 0.004);
        gainOvertone.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

        oscOvertone.connect(gainOvertone);
        gainOvertone.connect(bellFilter);

        // Lower body octave for solid presence
        const oscBody = ctx.createOscillator();
        const gainBody = ctx.createGain();
        oscBody.type = 'triangle';
        oscBody.frequency.setValueAtTime(freq * 0.5, start);

        gainBody.gain.setValueAtTime(0, start);
        gainBody.gain.linearRampToValueAtTime(vol * 0.4, start + 0.008);
        gainBody.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);

        oscBody.connect(gainBody);
        gainBody.connect(bellFilter);

        trackOsc(oscFund);
        trackOsc(oscOvertone);
        trackOsc(oscBody);

        oscFund.start(start);
        oscFund.stop(start + decay + 0.05);
        oscOvertone.start(start);
        oscOvertone.stop(start + 0.35);
        oscBody.start(start);
        oscBody.stop(start + 0.55);
      });
    }

    // 2. LUXURY CHORDS: Rhythmic, punchy cinematic progression with sub-bass
    else if (sound === 'luxury_chords') {
      const chordFilter = ctx.createBiquadFilter();
      chordFilter.type = 'lowpass';
      chordFilter.Q.setValueAtTime(1.5, now);
      chordFilter.frequency.setValueAtTime(700, now);
      chordFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
      chordFilter.frequency.exponentialRampToValueAtTime(800, now + 0.6);
      chordFilter.frequency.exponentialRampToValueAtTime(1500, now + 0.9);
      chordFilter.frequency.exponentialRampToValueAtTime(600, now + 2.2);
      chordFilter.connect(masterBus);

      // 4-step rhythmic chord progression: D Maj9 -> D Maj9 echo -> B min11 -> G Maj9
      const chordSteps = [
        {
          time: 0.0,
          decay: 0.55,
          notes: [
            { freq: 146.83, type: 'triangle' as OscillatorType, vol: 0.22 }, // D3
            { freq: 220.0, type: 'triangle' as OscillatorType, vol: 0.16 },  // A3
            { freq: 369.99, type: 'sine' as OscillatorType, vol: 0.18 },      // F#4
            { freq: 554.37, type: 'sine' as OscillatorType, vol: 0.16 },      // C#5
            { freq: 659.25, type: 'sine' as OscillatorType, vol: 0.15 },      // E5
          ],
        },
        {
          time: 0.26,
          decay: 0.45,
          notes: [
            { freq: 220.0, type: 'triangle' as OscillatorType, vol: 0.14 },
            { freq: 369.99, type: 'sine' as OscillatorType, vol: 0.16 },
            { freq: 659.25, type: 'sine' as OscillatorType, vol: 0.16 },
          ],
        },
        {
          time: 0.65,
          decay: 0.6,
          notes: [
            { freq: 123.47, type: 'triangle' as OscillatorType, vol: 0.22 }, // B2
            { freq: 185.0, type: 'triangle' as OscillatorType, vol: 0.15 },  // F#3
            { freq: 293.66, type: 'sine' as OscillatorType, vol: 0.17 },     // D4
            { freq: 440.0, type: 'sine' as OscillatorType, vol: 0.16 },      // A4
            { freq: 587.33, type: 'sine' as OscillatorType, vol: 0.15 },     // D5
          ],
        },
        {
          time: 1.05,
          decay: 1.2,
          notes: [
            { freq: 98.0, type: 'triangle' as OscillatorType, vol: 0.25 },   // G2 (deep root)
            { freq: 196.0, type: 'triangle' as OscillatorType, vol: 0.16 },  // G3
            { freq: 246.94, type: 'sine' as OscillatorType, vol: 0.16 },     // B3
            { freq: 369.99, type: 'sine' as OscillatorType, vol: 0.15 },     // F#4
            { freq: 440.0, type: 'sine' as OscillatorType, vol: 0.15 },      // A4
          ],
        },
      ];

      chordSteps.forEach(({ time, decay, notes }) => {
        const start = now + time;

        notes.forEach(({ freq, type, vol }) => {
          // Detuned chorus pair
          [-3, 3].forEach((detune) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, start);
            osc.detune.setValueAtTime(detune, start);

            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(vol * 0.5, start + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);

            osc.connect(gain);
            gain.connect(chordFilter);
            trackOsc(osc);

            osc.start(start);
            osc.stop(start + decay + 0.05);
          });
        });
      });
    }

    // 3. ENERGETIC PULSE: High-energy, syncopated, punchy rhythmic wake sequence
    else if (sound === 'energetic_pulse') {
      const pulseFilter = ctx.createBiquadFilter();
      pulseFilter.type = 'lowpass';
      pulseFilter.frequency.setValueAtTime(2400, now);
      pulseFilter.connect(masterBus);

      // Driving 6-pulse syncopated sequence
      const pulses = [
        { time: 0.0, freq: 880.0, sub: 220.0, weight: 1.15, hasKick: true },  // A5 + A3 kick
        { time: 0.14, freq: 554.37, sub: 277.18, weight: 0.9, hasKick: false }, // C#5
        { time: 0.28, freq: 659.25, sub: 329.63, weight: 1.0, hasKick: false }, // E5
        { time: 0.42, freq: 1108.73, sub: 554.37, weight: 1.1, hasKick: true }, // C#6
        { time: 0.6, freq: 1318.51, sub: 659.25, weight: 1.2, hasKick: false }, // E6 peak
        { time: 0.74, freq: 880.0, sub: 440.0, weight: 1.05, hasKick: false }, // A5 resolution
      ];

      pulses.forEach(({ time, freq, sub, weight, hasKick }) => {
        const start = now + time;

        // Snappy mallet transient (frequency drop for physical impact)
        const oscTransient = ctx.createOscillator();
        const gainTransient = ctx.createGain();
        oscTransient.type = 'sine';
        oscTransient.frequency.setValueAtTime(freq + 110, start);
        oscTransient.frequency.exponentialRampToValueAtTime(freq, start + 0.02);

        gainTransient.gain.setValueAtTime(0, start);
        gainTransient.gain.linearRampToValueAtTime(0.24 * weight, start + 0.005);
        gainTransient.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

        oscTransient.connect(gainTransient);
        gainTransient.connect(pulseFilter);

        // Upper melodic harmonic
        const oscHarm = ctx.createOscillator();
        const gainHarm = ctx.createGain();
        oscHarm.type = 'triangle';
        oscHarm.frequency.setValueAtTime(sub, start);

        gainHarm.gain.setValueAtTime(0, start);
        gainHarm.gain.linearRampToValueAtTime(0.16 * weight, start + 0.006);
        gainHarm.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

        oscHarm.connect(gainHarm);
        gainHarm.connect(pulseFilter);

        trackOsc(oscTransient);
        trackOsc(oscHarm);

        oscTransient.start(start);
        oscTransient.stop(start + 0.18);
        oscHarm.start(start);
        oscHarm.stop(start + 0.2);

        // Sub kick downbeat on key pulses for mobile speaker punch
        if (hasKick) {
          const oscKick = ctx.createOscillator();
          const gainKick = ctx.createGain();
          oscKick.type = 'sine';
          oscKick.frequency.setValueAtTime(140, start);
          oscKick.frequency.exponentialRampToValueAtTime(55, start + 0.06);

          gainKick.gain.setValueAtTime(0, start);
          gainKick.gain.linearRampToValueAtTime(0.25, start + 0.005);
          gainKick.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);

          oscKick.connect(gainKick);
          gainKick.connect(masterBus);
          trackOsc(oscKick);

          oscKick.start(start);
          oscKick.stop(start + 0.14);
        }
      });
    }

    // 4. CLASSIC ALARM: Iconic 3-burst repeating brass alarm cadence
    else if (sound === 'classic_bell') {
      const alarmFilter = ctx.createBiquadFilter();
      alarmFilter.type = 'lowpass';
      alarmFilter.frequency.setValueAtTime(2100, now);
      alarmFilter.connect(masterBus);

      // 3 rapid double-burst rings: (0.00, 0.13), (0.35, 0.48), (0.70, 0.83)
      const bursts = [0.0, 0.13, 0.35, 0.48, 0.7, 0.83];

      bursts.forEach((time) => {
        const start = now + time;

        // Dual brass bells: G5 (784Hz) + A5 (882Hz) creating acoustic alarm beating
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(784.0, start);

        gain1.gain.setValueAtTime(0, start);
        gain1.gain.linearRampToValueAtTime(0.2, start + 0.004);
        gain1.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

        osc1.connect(gain1);
        gain1.connect(alarmFilter);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(882.0, start);

        gain2.gain.setValueAtTime(0, start);
        gain2.gain.linearRampToValueAtTime(0.18, start + 0.004);
        gain2.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

        osc2.connect(gain2);
        gain2.connect(alarmFilter);

        // Lower body resonance: G4 (392Hz) triangle wave for solid substance
        const oscBody = ctx.createOscillator();
        const gainBody = ctx.createGain();
        oscBody.type = 'triangle';
        oscBody.frequency.setValueAtTime(392.0, start);

        gainBody.gain.setValueAtTime(0, start);
        gainBody.gain.linearRampToValueAtTime(0.14, start + 0.006);
        gainBody.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

        oscBody.connect(gainBody);
        gainBody.connect(alarmFilter);

        // Brass strike click (1568Hz)
        const oscClick = ctx.createOscillator();
        const gainClick = ctx.createGain();
        oscClick.type = 'sine';
        oscClick.frequency.setValueAtTime(1568.0, start);

        gainClick.gain.setValueAtTime(0, start);
        gainClick.gain.linearRampToValueAtTime(0.06, start + 0.002);
        gainClick.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);

        oscClick.connect(gainClick);
        gainClick.connect(alarmFilter);

        trackOsc(osc1);
        trackOsc(osc2);
        trackOsc(oscBody);
        trackOsc(oscClick);

        osc1.start(start);
        osc1.stop(start + 0.2);
        osc2.start(start);
        osc2.stop(start + 0.2);
        oscBody.start(start);
        oscBody.stop(start + 0.18);
        oscClick.start(start);
        oscClick.stop(start + 0.06);
      });
    }

    // 5. ZEN GONG: Deep resonant Tibetan temple gong with secondary rhythmic wave
    else if (sound === 'zen_gong') {
      const gongFilter = ctx.createBiquadFilter();
      gongFilter.type = 'lowpass';
      gongFilter.frequency.setValueAtTime(1200, now);
      gongFilter.Q.setValueAtTime(2.0, now);
      gongFilter.connect(masterBus);

      // Primary strike at t = 0.0
      // 1. Mallet impact thud
      const malletOsc = ctx.createOscillator();
      const malletGain = ctx.createGain();
      malletOsc.type = 'triangle';
      malletOsc.frequency.setValueAtTime(85, now);
      malletOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      malletGain.gain.setValueAtTime(0, now);
      malletGain.gain.linearRampToValueAtTime(0.24, now + 0.008);
      malletGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      malletOsc.connect(malletGain);
      malletGain.connect(gongFilter);

      // 2. Dual fundamental bronze drone: A2 (110Hz) & A2 (110.85Hz) with natural 0.85Hz acoustic beating
      const fundOsc1 = ctx.createOscillator();
      const fundGain1 = ctx.createGain();
      fundOsc1.type = 'sine';
      fundOsc1.frequency.setValueAtTime(110.0, now);

      fundGain1.gain.setValueAtTime(0, now);
      fundGain1.gain.linearRampToValueAtTime(0.28, now + 0.02);
      fundGain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.7);

      fundOsc1.connect(fundGain1);
      fundGain1.connect(gongFilter);

      const fundOsc2 = ctx.createOscillator();
      const fundGain2 = ctx.createGain();
      fundOsc2.type = 'sine';
      fundOsc2.frequency.setValueAtTime(110.85, now);

      fundGain2.gain.setValueAtTime(0, now);
      fundGain2.gain.linearRampToValueAtTime(0.22, now + 0.02);
      fundGain2.gain.exponentialRampToValueAtTime(0.0001, now + 2.7);

      fundOsc2.connect(fundGain2);
      fundGain2.connect(gongFilter);

      // 3. Singing bowl harmonics: E3, D4, A4, and crystalline shimmer
      const harmonics = [
        { freq: 164.81, vol: 0.16, decay: 2.5 }, // E3 (fifth)
        { freq: 293.66, vol: 0.14, decay: 2.2 }, // D4 (fourth)
        { freq: 440.0, vol: 0.11, decay: 1.9 },  // A4 (octave)
        { freq: 659.25, vol: 0.07, decay: 1.5 }, // E5
        { freq: 880.0, vol: 0.045, decay: 1.2 }, // A5 shimmer
      ];

      harmonics.forEach(({ freq, vol, decay }) => {
        const hOsc = ctx.createOscillator();
        const hGain = ctx.createGain();
        hOsc.type = 'sine';
        hOsc.frequency.setValueAtTime(freq, now);

        hGain.gain.setValueAtTime(0, now);
        hGain.gain.linearRampToValueAtTime(vol, now + 0.015);
        hGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        hOsc.connect(hGain);
        hGain.connect(gongFilter);

        trackOsc(hOsc);
        hOsc.start(now);
        hOsc.stop(now + decay + 0.05);
      });

      // 4. Secondary singing bowl chime strike at t = 0.70s for waking rhythmic presence
      const strike2Time = now + 0.7;
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(329.63, strike2Time); // E4

      chimeGain.gain.setValueAtTime(0, strike2Time);
      chimeGain.gain.linearRampToValueAtTime(0.18, strike2Time + 0.01);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, strike2Time + 1.8);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(gongFilter);

      trackOsc(malletOsc);
      trackOsc(fundOsc1);
      trackOsc(fundOsc2);
      trackOsc(chimeOsc);

      malletOsc.start(now);
      malletOsc.stop(now + 0.14);
      fundOsc1.start(now);
      fundOsc1.stop(now + 2.8);
      fundOsc2.start(now);
      fundOsc2.stop(now + 2.8);
      chimeOsc.start(strike2Time);
      chimeOsc.stop(strike2Time + 1.9);
    }

    // 6. CUSTOM SOUND: Custom audio chosen from user's device
    else if (sound === 'custom') {
      (async () => {
        try {
          let audioBuffer: AudioBuffer | undefined;
          if (customSoundId) {
            audioBuffer = getCachedDecodedBuffer(customSoundId);
          }

          if (!audioBuffer) {
            let rawData = directAudioData || null;
            if (!rawData && customSoundId) {
              rawData = await getCustomAudio(customSoundId);
            }
            if (rawData) {
              audioBuffer = await ctx.decodeAudioData(rawData.slice(0));
              if (customSoundId) {
                setCachedDecodedBuffer(customSoundId, audioBuffer);
              }
            }
          }

          if (audioBuffer) {
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(masterBus);

            trackOsc(source);
            source.start(now);
          } else {
            console.warn('Custom audio buffer unavailable, falling back to gentle chime.');
            playAlarmTone('gentle_chime');
          }
        } catch (err) {
          console.warn('Failed to play custom audio, falling back to gentle chime:', err);
          playAlarmTone('gentle_chime');
        }
      })();
    }

    // 7. WAKE UP — MOTIVATION: Bundled motivational wake-up alarm MP3
    else if (sound === 'wake_up_motivation') {
      (async () => {
        try {
          const buffer = await getMotivationalAudioBuffer(ctx);
          if (buffer) {
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(masterBus);

            trackOsc(source);
            source.start(now);
          } else {
            console.warn('Motivational audio buffer unavailable, falling back to energetic pulse.');
            playAlarmTone('energetic_pulse');
          }
        } catch (err) {
          console.warn('Failed to play motivational audio, falling back to energetic pulse:', err);
          playAlarmTone('energetic_pulse');
        }
      })();
    }
  } catch (e) {
    console.warn('Alarm tone failed:', e);
  }
}

/**
 * Starts a continuous seamless alarm audio loop.
 * For custom sounds, loops the decoded audio buffer directly.
 * For built-in sounds, repeats each sound using its musically optimal loop cadence.
 * Returns a cleanup function that immediately stops all sound and clears timers.
 */
export function startAlarmAudioLoop(
  sound: WakeAlarmSound = 'gentle_chime',
  customSoundId?: string
): () => void {
  // Clear any existing active alarm audio first
  stopAlarmAudio();

  // Bundled Motivational Alarm MP3 loop
  if (sound === 'wake_up_motivation') {
    const ctx = getAudioContext();
    if (!ctx) {
      return () => stopAlarmAudio();
    }

    let isCancelled = false;

    (async () => {
      try {
        const audioBuffer = await getMotivationalAudioBuffer(ctx);
        if (isCancelled) return;

        if (audioBuffer) {
          const masterBus = getAlarmMasterBus(ctx);
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.loop = true; // Seamless loop while alarm is active
          source.connect(masterBus);

          activeAlarmOscillators.push(source);
          source.onended = () => {
            const idx = activeAlarmOscillators.indexOf(source);
            if (idx !== -1) activeAlarmOscillators.splice(idx, 1);
          };

          source.start(ctx.currentTime);
        } else {
          console.warn('Motivational audio unavailable for loop, falling back to energetic pulse.');
          startAlarmAudioLoop('energetic_pulse');
        }
      } catch (err) {
        console.warn('Failed to loop motivational audio, falling back to energetic pulse:', err);
        if (!isCancelled) {
          startAlarmAudioLoop('energetic_pulse');
        }
      }
    })();

    return () => {
      isCancelled = true;
      stopAlarmAudio();
    };
  }

  if (sound === 'custom') {
    const ctx = getAudioContext();
    if (!ctx) {
      return () => stopAlarmAudio();
    }

    let isCancelled = false;

    (async () => {
      try {
        let audioBuffer: AudioBuffer | undefined;
        if (customSoundId) {
          audioBuffer = getCachedDecodedBuffer(customSoundId);
        }

        if (!audioBuffer && customSoundId) {
          const rawData = await getCustomAudio(customSoundId);
          if (rawData) {
            audioBuffer = await ctx.decodeAudioData(rawData.slice(0));
            setCachedDecodedBuffer(customSoundId, audioBuffer);
          }
        }

        if (isCancelled) return;

        if (audioBuffer) {
          const masterBus = getAlarmMasterBus(ctx);
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.loop = true; // Seamless continuous loop
          source.connect(masterBus);

          activeAlarmOscillators.push(source);
          source.onended = () => {
            const idx = activeAlarmOscillators.indexOf(source);
            if (idx !== -1) activeAlarmOscillators.splice(idx, 1);
          };

          source.start(ctx.currentTime);
        } else {
          console.warn('Custom audio unavailable for loop, falling back to gentle chime.');
          startAlarmAudioLoop('gentle_chime');
        }
      } catch (err) {
        console.warn('Failed to loop custom audio, falling back to gentle chime:', err);
        if (!isCancelled) {
          startAlarmAudioLoop('gentle_chime');
        }
      }
    })();

    return () => {
      isCancelled = true;
      stopAlarmAudio();
    };
  }

  // Built-in sounds optimal loop period for each layered motif
  const LOOP_INTERVAL_MAP: Record<Exclude<WakeAlarmSound, 'custom' | 'wake_up_motivation'>, number> = {
    gentle_chime: 2000,   // ~1.0s 6-bell arpeggio motif + 1.0s graceful pause
    luxury_chords: 2400,  // ~1.4s 4-chord progression + 1.0s breathing room
    energetic_pulse: 1400,// ~0.8s 6-pulse syncopated rhythm + 0.6s pause
    classic_bell: 1500,   // ~0.9s 3-burst double-ring pattern + 0.6s pause
    zen_gong: 2800,       // ~2.2s primary & secondary gong strikes + decay
  };

  const intervalTime = LOOP_INTERVAL_MAP[sound as keyof typeof LOOP_INTERVAL_MAP] || 2200;

  // Play immediately
  playAlarmTone(sound);

  // Set repeating interval
  currentAlarmLoopInterval = setInterval(() => {
    playAlarmTone(sound);
  }, intervalTime);

  return () => {
    stopAlarmAudio();
  };
}

export function playChallengeSuccessSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, i) => {
      const start = now + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch (e) {
    console.warn('Challenge success sound failed:', e);
  }
}

export function playChallengeErrorSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.15);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {
    console.warn('Challenge error sound failed:', e);
  }
}
