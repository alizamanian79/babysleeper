import React, { useEffect, useRef, useState } from 'react';

const MicrophoneVolume: React.FC = () => {
    const [volume, setVolume] = useState<number>(0);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [listenTimer, setListenTimer] = useState(10); // 5 seconds
    const [isMicrophoneAccessed, setIsMicrophoneAccessed] = useState(false);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [babyVolume, setbabyVolume] = useState(50)

    const getMicrophoneAccess = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            setIsMicrophoneAccessed(true);

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();

            analyser.fftSize = 2048;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const total = dataArray.reduce((sum, value) => sum + value, 0);
                    const avg = total / dataArray.length;

                    setVolume(avg);

                    // Check volume and handle audio playback
                    if (avg > 80 && !isPlaying) {
                      startListenTimer()
                    }
                }
                requestAnimationFrame(checkVolume);
            };

            checkVolume();
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const playAudioForDuration = (duration: number) => {
        if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
            setTimeout(() => {
                pauseAudio();
            }, duration * 1000);
        }
    };

    const pauseAudio = () => {
        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
        }

        // Set up listen timer interval
        intervalRef.current = setInterval(() => {
            if (remainingTime > 0) {
                setRemainingTime(prev => prev - 1);
            } else {
                pauseAudio(); // Pause audio when timer runs out
            }
        }, 1000);

        return () => {
            clearInterval(intervalRef.current!);
            if (audioRef.current) {
                audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
            }
        };
    }, [remainingTime]); // Depend on remainingTime

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAudioFile(file);
            if (audioRef.current) {
                audioRef.current.src = URL.createObjectURL(file);
                audioRef.current.load();
            }
        }
    };

    const handleEnded = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Number(event.target.value);
        }
    };

    const requestMicrophoneAccess = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone access granted');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Microphone access denied. Please check your browser settings.');
        }
    };

    const startListenTimer = () => {
        setRemainingTime(listenTimer); // Set the remaining time to the listen timer
        playAudioForDuration(listenTimer); // Start playing audio for the listen timer duration
    };

    return (
        <div dir='rtl'>

          
{!isMicrophoneAccessed && (
                <button onClick={getMicrophoneAccess} className='w-100 flex'>
                  دسترسی به میکروفن
                </button>
            )}
           
           <div className='w-[100%] h-auto flex'>
           <p> میزان بلندی صدا  :</p><span>{volume}</span>
           </div>
          
            <label className='text-[black]'>صدا بعد از چند دقیقه استاپ شود
                <input type="number" value={listenTimer} onChange={(e) => setListenTimer(Number(e.target.value))} placeholder='time' />
            </label>

{/* 
            <button onClick={startListenTimer} style={{ padding: '10px 20px', marginBottom: '20px' }}>
                Start Listening Timer
            </button> */}

            <div className='w-[100%] flex flex-col justify-center items-center bg-red-400'>
                <h1>Upload and Play Music</h1>
                <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    style={{ marginBottom: '20px' }}
                />
                <br />
                <button onClick={() => {
                    if (isPlaying) {
                        pauseAudio();
                    } else {
                      startListenTimer();
                    }
                }} style={{ padding: '10px 20px' }}>
                    {isPlaying ? 'Pause' : 'Start'}
                </button>
                <audio 
                    ref={audioRef} 
                    onEnded={handleEnded} 
                />
                <div>
                    <p>
                        Current Time: {Math.floor(currentTime / 60)}:{('0' + Math.floor(currentTime % 60)).slice(-2)} / 
                        Duration: {Math.floor(duration / 60)}:{('0' + Math.floor(duration % 60)).slice(-2)}
                    </p>
                    <input
                        type="range"
                        min={0}
                        max={duration}
                        value={currentTime}
                        onChange={handleSeek}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
{/* 
            <button onClick={requestMicrophoneAccess} style={{ padding: '10px 20px', marginBottom: '20px' }}>
                Request Microphone Access
            </button> */}
        </div>
    );
};

export default MicrophoneVolume;
