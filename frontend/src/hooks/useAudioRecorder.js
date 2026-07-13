'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for audio recording via MediaRecorder API.
 * Returns base64-encoded audio data for sending to the STT service.
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const stream = useRef(null);

  const startRecording = useCallback(async () => {
    setError(null);
    audioChunks.current = [];

    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      mediaRecorder.current = new MediaRecorder(stream.current, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.start(250); // collect chunks every 250ms
      setIsRecording(true);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.');
      } else {
        setError(`Microphone error: ${err.message}`);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setIsRecording(false);

        // Stop all tracks
        if (stream.current) {
          stream.current.getTracks().forEach((t) => t.stop());
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.current.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    if (stream.current) {
      stream.current.getTracks().forEach((t) => t.stop());
    }
    setIsRecording(false);
    audioChunks.current = [];
  }, []);

  return { isRecording, error, startRecording, stopRecording, cancelRecording };
}
