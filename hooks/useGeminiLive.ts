"use client";

import { useEffect, useRef, useState } from "react";

export function useGeminiLive(onStop?: (durationSeconds: number) => void) {
    const [isActive, setIsActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);

    const startTimeRef = useRef<number | null>(null);

    const stop = async () => {
        if (socketRef.current) socketRef.current.close();
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (audioContextRef.current) audioContextRef.current.close();

        // Track duration
        if (startTimeRef.current) {
            const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
            if (duration > 0 && onStop) {
                onStop(duration);
            }
            startTimeRef.current = null;
        }

        setIsActive(false);
        setIsConnecting(false);
    };

    const start = async (apiKey: string) => {
        if (isActive) return;
        setIsConnecting(true);

        try {
            // 1. Initialize WebSocket
            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
            const socket = new WebSocket(url);
            socketRef.current = socket;

            socket.onopen = () => {
                // Track start time only when connection is established
                // This is an event handler, so it satisfies React 19 purity checks
                startTimeRef.current = Date.now();
                // Send Setup
                socket.send(JSON.stringify({
                    setup: { model: "models/gemini-2.0-flash-exp" }
                }));
            };

            socket.onmessage = async (event: MessageEvent) => {
                let text = "";
                if (typeof event.data === "string") {
                    text = event.data;
                } else if (event.data instanceof Blob) {
                    text = await event.data.text();
                } else {
                    console.error("Unknown message type:", typeof event.data);
                    return;
                }

                try {
                    const data = JSON.parse(text);
                    if (data.setupComplete) {
                        setIsConnecting(false);
                        setIsActive(true);
                        startRecording();
                    }
                    if (data.serverContent?.modelTurn?.parts?.[0]?.inlineData) {
                        playAudio(data.serverContent.modelTurn.parts[0].inlineData.data);
                    }
                } catch (e) {
                    console.error("Failed to parse message as JSON:", text, e);
                }
            };

            socket.onclose = () => stop();
            socket.onerror = (e) => {
                console.error("Gemini Live WebSocket Error:", e);
                stop();
            };

        } catch (err) {
            console.error("Failed to start Gemini Live:", err);
            setIsConnecting(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmData = floatTo16BitPCM(inputData);
                    const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));

                    socketRef.current.send(JSON.stringify({
                        realtimeInput: { mediaChunks: [{ data: base64, mimeType: "audio/pcm;rate=16000" }] }
                    }));
                }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
        } catch (err) {
            console.error("Recording error:", err);
            stop();
        }
    };

    const playAudio = (base64Data: string) => {
        if (!audioContextRef.current) return;

        const binary = atob(base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        audioContextRef.current.decodeAudioData(bytes.buffer).then(buffer => {
            if (!audioContextRef.current) return;
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.start();
        });
    };

    const floatTo16BitPCM = (input: Float32Array) => {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output;
    };

    return { start, stop, isActive, isConnecting };
}
