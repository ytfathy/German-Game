/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SpeechRecognitionState =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'processing'
  | 'done'
  | 'error';

export interface SpeechRecognitionResultPayload {
  transcript: string;
  confidence: number;
  audioBlobUrl?: string;
  isFallbackOnly: boolean;
}

export class SpeechAssessmentService {
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private currentAudioUrl: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          this.recognition = new SpeechRecognitionClass();
          this.recognition.lang = 'de-DE';
          this.recognition.continuous = false;
          this.recognition.interimResults = true;
          this.recognition.maxAlternatives = 1;
        } catch {
          this.recognition = null;
        }
      }
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    return Boolean(this.recognition);
  }

  public isMicrophoneSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }

  /**
   * Start speech recording and German speech recognition
   */
  public async startListening(
    onInterim: (text: string) => void,
    onComplete: (res: SpeechRecognitionResultPayload) => void,
    onError: (err: string) => void
  ): Promise<void> {
    if (!this.isMicrophoneSupported()) {
      onError('Microphone access is not supported by your current browser.');
      return;
    }

    // Clean previous audio URL if any
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
    this.recordedChunks = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        onError('Microphone permission was denied. Please allow microphone access to practice speaking.');
      } else {
        onError('Could not access microphone: ' + (err.message || 'unknown error'));
      }
      return;
    }

    // Initialize MediaRecorder for audio replay
    try {
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };
      this.mediaRecorder.start();
    } catch {
      this.mediaRecorder = null;
    }

    let finalTranscript = '';
    let recognitionFinished = false;

    const finalize = () => {
      if (recognitionFinished) return;
      recognitionFinished = true;

      // Stop media stream tracks
      stream.getTracks().forEach((track) => track.stop());

      // Prepare audio replay blob
      let audioBlobUrl: string | undefined = undefined;
      if (this.recordedChunks.length > 0) {
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        audioBlobUrl = URL.createObjectURL(audioBlob);
        this.currentAudioUrl = audioBlobUrl;
      }

      onComplete({
        transcript: finalTranscript.trim(),
        confidence: finalTranscript ? 0.85 : 0,
        audioBlobUrl,
        isFallbackOnly: !this.recognition,
      });
    };

    if (this.recognition) {
      this.recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        onInterim(interim || finalTranscript);
      };

      this.recognition.onerror = (event: any) => {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          try {
            this.mediaRecorder.stop();
          } catch {}
        }
        // If no speech was detected, still finalize gracefully with recorded audio
        if (event.error === 'no-speech') {
          finalize();
        } else {
          onError(`Speech recognition notice: ${event.error}. You can still replay your audio.`);
          finalize();
        }
      };

      this.recognition.onend = () => {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          try {
            this.mediaRecorder.stop();
          } catch {}
        }
        finalize();
      };

      try {
        this.recognition.start();
      } catch (e: any) {
        onError('Could not start German speech recognizer: ' + e.message);
        finalize();
      }
    } else {
      // Fallback mode without Web Speech API transcription:
      // Record for 4 seconds then complete
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          try {
            this.mediaRecorder.stop();
          } catch {}
        }
        finalize();
      }, 4000);
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
  }
}

export const speechAssessmentService = new SpeechAssessmentService();
