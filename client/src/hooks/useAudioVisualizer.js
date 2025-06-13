import { useState, useEffect, useRef } from 'react';

export const useAudioVisualizer = (stream) => {
    const [volume, setVolume] = useState(0);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationFrameRef = useRef(null);

    useEffect(() => {
        if (stream && stream.getAudioTracks().length > 0) {
            // Set up the Web Audio API context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;
            
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512; // More data points for analysis
            analyserRef.current = analyser;
            
            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;
            source.connect(analyser); // Connect the stream to the analyser

            // This array will hold the frequency data
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            // This function runs on every animation frame to get the volume
            const draw = () => {
                animationFrameRef.current = requestAnimationFrame(draw);
                analyser.getByteFrequencyData(dataArray);
                
                // A simple calculation to get an average volume level
                let sum = 0;
                for (const amplitude of dataArray) {
                    sum += amplitude * amplitude;
                }
                const avg = Math.sqrt(sum / dataArray.length);
                
                // Normalize to a value between 0 and 1
                setVolume(avg / 128); 
            };

            draw();
        }

        // Cleanup function to close the audio context and stop the animation frame
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect();
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, [stream]); // Re-run if the stream object changes

    return volume;
};