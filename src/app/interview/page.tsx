// @ts-nocheck
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Send, Loader2, AlertTriangle, CheckCircle2, Video, VideoOff, StopCircle, WifiOff, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type InterviewState = 
  | "idle" 
  | "requesting_permissions" 
  | "permissions_denied"
  | "initializing_ws"
  | "ws_connected_waiting_initial_ai"
  | "ai_speaking" // Generic state for AI turn (text and audio)
  | "ready_to_listen" // AI finished, user can speak
  | "user_speaking"
  | "user_speech_processing"
  | "interview_ended_by_ai"
  | "interview_ended_by_user"
  | "fetching_summary"
  | "summary_displayed"
  | "error"
  | "ws_error";

type Message = {
  id: string;
  speaker: "user" | "ai" | "system" | "stt";
  text: string;
  timestamp: Date;
};

const MAX_AUDIO_QUEUE_LENGTH = 10; // Max chunks to buffer before forcing playback start.

export default function InterviewPage() {
  const [interviewState, setInterviewState] = useState<InterviewState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingAudioRef = useRef(false);
  const aiAudioSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const userAudioChunksRef = useRef<Blob[]>([]); // For potential local playback or resend

  const { toast } = useToast();

  const addMessage = useCallback((speaker: Message['speaker'], text: string) => {
    setMessages(prev => [...prev, { id: uuidv4(), speaker, text, timestamp: new Date() }]);
  }, []);

  // Initialize AudioContext
  useEffect(() => {
    if (hasCameraPermission && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return () => {
      audioContextRef.current?.close().catch(console.error);
    };
  }, [hasCameraPermission]);

  // Cleanup media and WebSocket on component unmount
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      webSocketRef.current?.close();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      aiAudioSourceNodeRef.current?.stop();
    };
  }, []);

  const requestCameraAndMicPermission = async () => {
    setInterviewState("requesting_permissions");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorDetails("Media access (camera/microphone) is not supported by your browser.");
      setHasCameraPermission(false);
      setInterviewState("permissions_denied");
      toast({
        variant: "destructive",
        title: "Media Not Supported",
        description: "Your browser does not support camera/microphone access.",
      });
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
      // Next step (WS connection) will be triggered by handleStartInterview after this
      return true;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setHasCameraPermission(false);
      setErrorDetails("Camera and microphone permission was denied. Please enable access in your browser settings to proceed.");
      setInterviewState("permissions_denied");
      toast({
        variant: 'destructive',
        title: 'Media Access Denied',
        description: 'Please enable camera and microphone permissions in your browser settings.',
      });
      return false;
    }
  };

  const playNextAudioChunk = useCallback(async () => {
    if (isPlayingAudioRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) {
      return;
    }
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    isPlayingAudioRef.current = true;
    setInterviewState("ai_speaking");

    const audioData = audioQueueRef.current.shift();
    if (audioData) {
      try {
        const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
        const source = audioContextRef.current.createBufferSource();
        aiAudioSourceNodeRef.current = source;
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
        source.onended = () => {
          isPlayingAudioRef.current = false;
          aiAudioSourceNodeRef.current = null;
          if (audioQueueRef.current.length > 0) {
            playNextAudioChunk();
          } else {
            // If queue is empty, AI might have finished speaking this turn
            // Check if the last AI message implies a question
             const lastAiMsg = messages.slice().reverse().find(m => m.speaker === 'ai');
             if (lastAiMsg && (lastAiMsg.text.includes("?") || lastAiMsg.text.toLowerCase().includes("tell me about") || lastAiMsg.text.toLowerCase().includes("what are") || lastAiMsg.text.toLowerCase().includes("can you"))) {
                setInterviewState("ready_to_listen");
             } else if (interviewState !== "interview_ended_by_ai" && interviewState !== "summary_displayed") {
                // If not clearly a question, might be part of ongoing AI speech or waiting for signal
                // This logic could be refined based on exact backend signals
                setInterviewState("ai_speaking"); // Or a more specific "waiting_for_ai_next_segment"
             }
          }
        };
      } catch (e) {
        console.error("Error decoding or playing audio data:", e);
        addMessage("system", `Error playing audio: ${(e as Error).message}`);
        isPlayingAudioRef.current = false;
        // Potentially skip this chunk and try next
        playNextAudioChunk(); 
      }
    } else {
        isPlayingAudioRef.current = false; // Should not happen if length > 0 check passed
    }
  }, [addMessage, messages, interviewState]);


  const connectWebSocket = useCallback((sId: string) => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket already open.");
      return;
    }
    setInterviewState("initializing_ws");
    addMessage("system", "Attempting to connect to interview server...");

    // Ensure NEXT_PUBLIC_BACKEND_WS_URL is defined or default to localhost
    const wsUrl = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:8000';
    const ws = new WebSocket(`${wsUrl}/ws/interview/${sId}`);
    webSocketRef.current = ws;

    ws.onopen = () => {
      console.log(`[WebSocket] Connected for session: ${sId}`);
      addMessage("system", "Successfully connected to the interview server. Waiting for AI to start.");
      setInterviewState("ws_connected_waiting_initial_ai");
      // Backend should send initial AI message/audio automatically
    };

    ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        // Assume audio data
        event.data.arrayBuffer().then(arrayBuffer => {
          audioQueueRef.current.push(arrayBuffer);
          if (!isPlayingAudioRef.current || audioQueueRef.current.length >= MAX_AUDIO_QUEUE_LENGTH) {
             playNextAudioChunk();
          }
        }).catch(e => console.error("Error converting blob to arraybuffer:", e));
      } else if (typeof event.data === 'string') {
        const messageText = event.data;
        console.log("[WebSocket] Received text message:", messageText);
        if (messageText.startsWith("AI_says:")) {
          const aiText = messageText.substring("AI_says:".length).trim();
          addMessage("ai", aiText);
          // AI text received, audio will follow. State might be "ai_speaking"
          // playNextAudioChunk will be called when audio arrives.
          // If AI is ending the interview, it should explicitly say so
           if (aiText.toLowerCase().includes("that concludes") || aiText.toLowerCase().includes("thank you for your time")) {
              // Handled by INTERVIEW_ENDED_BY_AI if backend sends it
           } else {
             // Assume AI is speaking or about to speak. Audio chunks will trigger actual playback.
             setInterviewState("ai_speaking"); 
           }

        } else if (messageText.startsWith("STT_part:")) {
          const sttText = messageText.substring("STT_part:".length).trim();
           // Check if there's an existing STT message to update
           setMessages(prev => {
            const lastMsg = prev[prev.length -1];
            if(lastMsg && lastMsg.speaker === 'stt' && !sttText.endsWith('(final)')) {
                // Append to last partial STT message
                return [...prev.slice(0, -1), {...lastMsg, text: sttText.replace(' (final)','')}];
            }
            // Add new STT message (could be partial or final)
            return [...prev, {id: uuidv4(), speaker: 'stt', text: sttText.replace(' (final)',''), timestamp: new Date()}];
           });
           if (sttText.endsWith("(final)")) {
             // Final STT received for user's turn. Backend will now process with LLM.
             setInterviewState("user_speech_processing"); // Or waiting_for_ai
           }
        } else if (messageText.startsWith("Candidate_says:")) {
            // This is feedback from backend about what it fully transcribed for candidate.
            // Could be used to finalize the user message bubble.
            const userText = messageText.substring("Candidate_says:".length).trim();
            // Remove any previous STT messages and add this as final user message
            setMessages(prev => {
                const filtered = prev.filter(m => m.speaker !== 'stt');
                return [...filtered, {id: uuidv4(), speaker: 'user', text: userText, timestamp: new Date()}];
            });
        } else if (messageText === "INTERVIEW_ENDED_BY_AI") {
          addMessage("system", "The AI has concluded the interview.");
          setInterviewState("interview_ended_by_ai");
          fetchInterviewSummary(sId);
        } else {
          addMessage("system", `Server: ${messageText}`);
        }
      }
    };

    ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
      setErrorDetails("Connection to the interview server failed. Please ensure the backend server is running and accessible at the configured URL. Then check your internet connection and try again.");
      setInterviewState("ws_error");
      addMessage("system", "WebSocket connection error. Ensure backend is running.");
    };

    ws.onclose = (event) => {
      console.log("[WebSocket] Closed.", event.code, event.reason);
      if (interviewState !== "interview_ended_by_ai" && interviewState !== "interview_ended_by_user" && interviewState !== "summary_displayed") {
         // If ws.onerror already set an error, don't override with a generic "connection closed"
         if (interviewState !== "ws_error") {
            setErrorDetails(`Connection closed: ${event.reason || 'Unknown reason'}. Code: ${event.code}. Please ensure the backend server is running.`);
            setInterviewState("ws_error");
         }
         addMessage("system", `WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason || 'N/A'}`);
      }
      webSocketRef.current = null;
    };
  }, [addMessage, playNextAudioChunk, interviewState]);


  const handleStartInterview = async () => {
    setErrorDetails(null);
    // Reset messages from previous session if any
    setMessages([]);
    audioQueueRef.current = [];
    if(isPlayingAudioRef.current && aiAudioSourceNodeRef.current) {
        aiAudioSourceNodeRef.current.stop();
        aiAudioSourceNodeRef.current = null;
        isPlayingAudioRef.current = false;
    }

    const permissionsGranted = await requestCameraAndMicPermission();
    if (permissionsGranted) {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      connectWebSocket(newSessionId);
    }
  };

  const startRecording = () => {
    if (!mediaStreamRef.current || !webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      addMessage("system", "Cannot start recording: Media stream or WebSocket not ready.");
      setInterviewState("error");
      setErrorDetails("Recording prerequisites not met. Try refreshing.");
      return;
    }
    if (aiAudioSourceNodeRef.current) { // Stop AI from speaking if it is
        aiAudioSourceNodeRef.current.stop();
        aiAudioSourceNodeRef.current = null;
        isPlayingAudioRef.current = false;
        audioQueueRef.current = []; // Clear any pending AI audio
    }


    try {
      // Try common MIME types
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/wav',
        'audio/mp4', // Some browsers might support this for audio-only
      ];
      let chosenMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          chosenMimeType = mimeType;
          break;
        }
      }
      if (!chosenMimeType) {
        // Fallback if specific ones not found. Browser might pick one.
        // Or throw error if strictness is required
        console.warn("No preferred MIME type supported, letting browser choose.");
        // throw new Error("No supported MIME type found for MediaRecorder");
      }
      console.log("Using MIME type for MediaRecorder:", chosenMimeType || "Browser default");

      mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, { mimeType: chosenMimeType || undefined });
      userAudioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          webSocketRef.current?.send(event.data);
          userAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
          webSocketRef.current.send("END_OF_STREAM");
        }
        console.log("MediaRecorder stopped, END_OF_STREAM sent.");
        setInterviewState("user_speech_processing");
        // No explicit "User says:" message here, backend will confirm with "Candidate_says:"
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", (event as any).error || event);
        addMessage("system", `Recording error: ${(event as any).error?.name || 'Unknown error'}`);
        setInterviewState("error");
        setErrorDetails(`Recording error: ${(event as any).error?.message || 'Try again.'}`);
      };

      mediaRecorderRef.current.start(1000); // Send chunks every 1 second
      setInterviewState("user_speaking");
      addMessage("system", "You are now recording...");
    } catch (e) {
      console.error("Error starting MediaRecorder:", e);
      addMessage("system", `Failed to start recording: ${(e as Error).message}`);
      setInterviewState("error");
      setErrorDetails(`Could not start audio recording: ${(e as Error).message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); // onstop handler will send END_OF_STREAM
      addMessage("system", "Recording stopped. Processing your response...");
    }
  };
  
  const handleMicClick = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(e => console.error("Error resuming AudioContext:", e));
    }

    if (interviewState === "ready_to_listen") {
      startRecording();
    } else if (interviewState === "user_speaking") {
      stopRecording();
    }
  };

  const handleEndInterviewByUser = () => {
    addMessage("system", "You have chosen to end the interview.");
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send("END_INTERVIEW");
    }
    // WS onclose might not fire immediately or if server closes first.
    // So, proceed to fetch summary if sessionId exists.
    if (sessionId) {
      fetchInterviewSummary(sessionId);
    }
    setInterviewState("interview_ended_by_user");
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
    }
  };

  const fetchInterviewSummary = async (sId: string) => {
    if (!sId) {
      addMessage("system", "Session ID missing, cannot fetch summary.");
      return;
    }
    setInterviewState("fetching_summary");
    addMessage("system", "Fetching interview summary...");
    try {
      const httpUrl = process.env.NEXT_PUBLIC_BACKEND_HTTP_URL || 'http://localhost:8000';
      const response = await fetch(`${httpUrl}/api/interview/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sId }),
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch summary: ${response.status} ${errorData}`);
      }
      const summaryData = await response.json();
      addMessage("system", `Summary Received: Overall Score ${summaryData.evaluation.overall_score}. Full details in console or dedicated summary page.`);
      console.log("Interview Summary:", summaryData);
      setInterviewState("summary_displayed");
      // For now, just log. Later, could display parts of it or link to a summary page.
      toast({
        title: "Interview Summary Ready",
        description: `Overall Score: ${summaryData.evaluation.overall_score}. Check console for full data.`,
        duration: 10000,
      });

    } catch (error) {
      console.error("Error fetching summary:", error);
      setErrorDetails(`Could not fetch summary: ${(error as Error).message}`);
      addMessage("system", `Error fetching summary: ${(error as Error).message}`);
      setInterviewState("error"); // Or a specific summary_error state
    } finally {
        // Ensure WebSocket is closed if it wasn't already
        if (webSocketRef.current && webSocketRef.current.readyState !== WebSocket.CLOSED) {
            webSocketRef.current.close();
        }
    }
  };


  const getButtonState = () => {
    // Initial state before permissions and connection
    if (interviewState === "idle" && !sessionId && hasCameraPermission === null) {
      return { text: "Begin Interview & Setup Camera", icon: <Video className="mr-2 h-5 w-5"/>, disabled: false, action: handleStartInterview, variant: "default" };
    }
    if (interviewState === "permissions_denied") {
      return { text: "Enable Camera & Mic to Start", icon: <VideoOff className="mr-2 h-5 w-5" />, disabled: false, action: handleStartInterview, variant: "destructive" };
    }
     if (interviewState === "requesting_permissions" ) {
      return { text: "Requesting Permissions...", icon: <Loader2 className="mr-2 h-5 w-5 animate-spin" />, disabled: true, variant: "outline" };
    }
    // This covers idle state after permissions are granted but WS not yet connected (e.g. refresh after permissions)
    if (interviewState === "idle" && hasCameraPermission === true && !sessionId) {
      return { text: "Start Interview Session", icon: <Video className="mr-2 h-5 w-5"/>, disabled: false, action: handleStartInterview, variant: "default" };
    }


    // WebSocket and AI interaction states
    switch (interviewState) {
      case "initializing_ws":
        return { text: "Connecting to Server...", icon: <Loader2 className="mr-2 h-5 w-5 animate-spin" />, disabled: true, variant: "outline" };
      case "ws_connected_waiting_initial_ai":
        return { text: "Waiting for AI...", icon: <Loader2 className="mr-2 h-5 w-5 animate-spin" />, disabled: true, variant: "outline" };
      case "ai_speaking":
        return { text: "AI is Speaking...", icon: <Mic className="mr-2 h-5 w-5 text-muted-foreground" />, disabled: true, variant: "outline" };
      case "ready_to_listen":
        return { text: "Record Answer", icon: <Mic className="mr-2 h-5 w-5" />, disabled: false, action: handleMicClick, variant: "default" };
      case "user_speaking":
        return { text: "Stop Recording", icon: <StopCircle className="mr-2 h-5 w-5" />, disabled: false, action: handleMicClick, variant: "destructive" };
      case "user_speech_processing":
        return { text: "Processing Your Answer...", icon: <Loader2 className="mr-2 h-5 w-5 animate-spin" />, disabled: true, variant: "outline" };
      
      // End states
      case "interview_ended_by_ai":
      case "interview_ended_by_user":
        // After ending, if summary not yet fetched, it will move to fetching_summary
        // This state might be brief or skipped if fetchSummary is called immediately
        return { text: "Interview Ended", icon: <CheckCircle2 className="mr-2 h-5 w-5" />, disabled: true, variant: "secondary" };
      case "fetching_summary":
        return { text: "Generating Your Report...", icon: <Loader2 className="mr-2 h-5 w-5 animate-spin" />, disabled: true, variant: "outline" };
      case "summary_displayed":
        return { text: "View Report (See Console)", icon: <FileText className="mr-2 h-5 w-5" />, disabled: true, variant: "secondary" }; // Or link to report page

      // Error states
      case "ws_error":
        return { text: "Connection Lost. Retry Interview?", icon: <WifiOff className="mr-2 h-5 w-5" />, disabled: false, action: handleStartInterview, variant: "destructive" };
      case "error":
         return { text: "Error Occurred. Retry Interview?", icon: <AlertTriangle className="mr-2 h-5 w-5" />, disabled: false, action: handleStartInterview, variant: "destructive" };
      
      default: 
        if (sessionId && (interviewState === "idle" || interviewState === "ws_connected_waiting_initial_ai")) { // Catch-all if WS connected but no specific AI/User state
          return { text: "AI is Preparing...", icon: <Loader2 className="mr-2 h-5 w-5 animate-spin" />, disabled: true, variant: "outline" }; 
        }
        // Default fallback if none of the above matched, similar to initial idle
        return { text: "Start Interview", icon: <Video className="mr-2 h-5 w-5"/>, disabled: false, action: handleStartInterview, variant: "default" };
    }
  };
  
  const buttonState = getButtonState();
  const showEndInterviewButton = sessionId && !["idle", "requesting_permissions", "permissions_denied", "interview_ended_by_ai", "interview_ended_by_user", "fetching_summary", "summary_displayed", "ws_error", "error"].includes(interviewState);


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-2">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">VocaHire Video Interview</CardTitle>
          <CardDescription>Your AI-powered video interview session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {errorDetails && (interviewState === "error" || interviewState === "permissions_denied" || interviewState === "ws_error") && (
             <Alert variant="destructive" className="my-4">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>
                    {interviewState === "permissions_denied" ? "Media Permission Required" : 
                     interviewState === "ws_error" ? "Connection Issue" : "An Error Occurred"}
                </AlertTitle>
                <AlertDescription>{errorDetails}</AlertDescription>
             </Alert>
          )}

          {/* Video Feeds: Show if permissions requested OR interview has started */}
          {(hasCameraPermission !== null || interviewState === "requesting_permissions" || sessionId ) && interviewState !== "summary_displayed" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* User Video */}
              <div className="relative aspect-video bg-muted rounded-lg shadow-md overflow-hidden border border-border">
                <video ref={userVideoRef} autoPlay muted className="w-full h-full object-cover transform scaleX-[-1]" />
                {hasCameraPermission === false && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
                    <VideoOff className="w-12 h-12 mb-2 text-destructive" />
                    <p className="text-center font-semibold">Camera & Mic Disabled</p>
                    <p className="text-xs text-center">Please grant permissions.</p>
                  </div>
                )}
                 <div className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-md text-sm backdrop-blur-sm">
                    You
                  </div>
              </div>

              {/* AI Video Placeholder */}
              <div className="relative aspect-video bg-muted rounded-lg shadow-md overflow-hidden border border-border">
                <Image 
                    src="https://picsum.photos/seed/ai-interviewer-professional/640/360" 
                    alt="AI Interviewer" 
                    fill 
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                    style={{objectFit: "cover"}} 
                    className="opacity-80"
                    data-ai-hint="professional person"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-md text-sm backdrop-blur-sm">
                    AI Interviewer
                </div>
                {interviewState === "ai_speaking" && isPlayingAudioRef.current && ( 
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                )}
              </div>
            </div>
          )}
          
          {/* Initial message when no session started and no errors */}
          {interviewState === "idle" && !sessionId && !errorDetails && hasCameraPermission === null && (
             <div className="text-center p-8">
              <p className="text-lg mb-6">Welcome! Click below to start your AI video interview and enable your camera & microphone.</p>
            </div>
          )}


          {messages.length > 0 && (
            <div className="space-y-4 h-64 overflow-y-auto p-4 border rounded-md bg-secondary/30 scroll-smooth">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.speaker === 'user' || msg.speaker === 'stt' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[75%] p-3 rounded-xl shadow ${
                        msg.speaker === 'user' ? 'bg-primary text-primary-foreground' : 
                        msg.speaker === 'ai' ? 'bg-card border' : 
                        msg.speaker === 'stt' ? 'bg-blue-100 text-blue-700 border border-blue-200 text-sm' : 
                        'bg-muted text-muted-foreground text-sm italic' 
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-xs mt-1 ${
                        msg.speaker === 'user' ? 'text-primary-foreground/70' : 
                        msg.speaker === 'ai' ? 'text-muted-foreground' : 
                        msg.speaker === 'stt' ? 'text-blue-500' :
                        'text-muted-foreground/70'
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.speaker === 'stt' && ' (Transcribing...)'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(interviewState === "user_speaking") && (
            <div className="space-y-2 mt-2">
              <Progress value={undefined} className="w-full h-2 [&>div]:animate-pulse bg-green-500" />
              <p className="text-sm text-center text-green-600 font-medium">
                Recording your answer...
              </p>
            </div>
          )}
          
          {/* Main action button - shown if not in summary display state */}
          {interviewState !== "summary_displayed" && (
             <Button 
                size="lg" 
                onClick={buttonState.action}
                disabled={buttonState.disabled} 
                className="w-full py-6 text-lg mt-4"
                variant={buttonState.variant as any}
              >
              {buttonState.icon}
              {buttonState.text}
            </Button>
          )}

           {showEndInterviewButton && (
                <Button 
                    size="lg" 
                    onClick={handleEndInterviewByUser} 
                    className="w-full py-6 text-lg mt-2"
                    variant="outline"
                >
                    <StopCircle className="mr-2 h-5 w-5 text-destructive"/> End Interview
                </Button>
            )}


           {interviewState === "summary_displayed" && (
             <div className="text-center p-6 bg-green-50 border border-green-200 rounded-md shadow-md">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-3"/>
                <p className="text-xl font-semibold text-green-700">Interview Completed!</p>
                <p className="text-md text-green-600 mt-1">Your interview report has been generated (details in console).</p>
                 <Button onClick={() => window.location.href = '/'} className="mt-6" variant="outline">Back to Home</Button>
             </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

