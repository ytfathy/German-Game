/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildTrack } from './three/TrackBuilder';
import { LEVELS } from '../data/levels';
import { audioService } from '../services/audioService';

describe('Tunnel Elevation and Audio Cutoff Verification', () => {
  test('Track spline creates dedicated downhill subterranean tunnel', () => {
    const track = buildTrack(LEVELS[0], 5);
    assert.ok(track.totalLength > 800, 'Track total length should be realistic circuit');

    // Sample points before, inside, and after tunnel
    const ptBeforeTunnel = track.curve.getPointAt(0.20);
    const ptEntrance = track.curve.getPointAt(0.30);
    const ptDeepTunnel = track.curve.getPointAt(0.42);
    const ptExit = track.curve.getPointAt(0.56);
    const ptAfterTunnel = track.curve.getPointAt(0.70);

    // Surface elevation should be above ground
    assert.ok(ptBeforeTunnel.y > 0.2, 'Surface track before tunnel should be above ground level');
    assert.ok(ptAfterTunnel.y > 0.2, 'Surface track after tunnel should be above ground level');

    // Deep tunnel elevation should be subterranean (downhill dip)
    assert.ok(ptDeepTunnel.y < -3.0, 'Deep tunnel should be subterranean (y < -3m)');

    // Elevation decreases downhill into tunnel
    assert.ok(ptDeepTunnel.y < ptEntrance.y, 'Tunnel must descend downhill from entrance to deep tunnel');

    // Tunnel range metadata
    assert.strictEqual(track.tunnelRange.start, 0.28);
    assert.strictEqual(track.tunnelRange.end, 0.58);
  });

  test('Audio service stopSpeaking immediately cancels ongoing speech session', () => {
    let cancelCalled = false;
    let spoken = false;
    (global as any).window = {
      speechSynthesis: {
        speak: () => { spoken = true; },
        cancel: () => { cancelCalled = true; },
        getVoices: () => [],
      },
    };
    (global as any).SpeechSynthesisUtterance = function (this: any, text: string) {
      this.text = text;
      this.lang = 'de-DE';
    };

    audioService.speakGerman('Guten Tag, wie geht es dir?');
    assert.strictEqual(spoken, true, 'SpeechSynthesis speak should be called');

    audioService.stopSpeaking();
    assert.strictEqual(cancelCalled, true, 'SpeechSynthesis cancel should be called on stopSpeaking');
  });
});
