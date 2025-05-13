// @ts-nocheck
'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Send, Loader2, AlertTriangle, CheckCircle2, Video, VideoOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type InterviewState = "idle" | "requesting_permissions" | "connecting" | "listening" | "processing" | "speaking" | "ended" | "error" | "permissions_denied";
type Message = {
  speaker: "user" | "ai" | "system";
  text: string;
  timestamp: Date;
};

export default function InterviewPage() {
  const [interviewState, setInterviewState] = useState<InterviewState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [progress, setProgress] = useState(0);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Cleanup media stream on component unmount
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    setInterviewState("requesting_permissions");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorDetails("Camera access is not supported by your browser.");
      setHasCameraPermission(false);
      setInterviewState("permissions_denied");
      toast({
        variant: "destructive",
        title: "Camera Not Supported",
        description: "Your browser does not support camera access. Please try a different browser.",
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
      setInterviewState("connecting"); // Move to connecting state after permission granted
      return true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      setErrorDetails("Camera permission was denied. Please enable camera access in your browser settings to proceed.");
      setInterviewState("permissions_denied");
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
      return false;
    }
  };


  useEffect(() => {
    // Simulate connection attempt after permissions are handled
    if (interviewState === "connecting" && hasCameraPermission) {
      setMessages([{ speaker: "system", text: "Connecting to interview server...", timestamp: new Date() }]);
      const timer = setTimeout(() => {
        setMessages([{ speaker: "ai", text: "Hello! Welcome to your VocaHire video interview. When you're ready, click the microphone button to answer the first question: Can you tell me a bit about yourself?", timestamp: new Date() }]);
        setInterviewState("idle"); // Ready to listen once user clicks mic
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [interviewState, hasCameraPermission]);

  const handleStartInterview = async () => {
    setErrorDetails(null); // Clear previous errors
    await requestCameraPermission();
    // The useEffect for "connecting" will take over if permission is granted
  };

  const handleMicClick = () => {
    if (interviewState === "idle" || interviewState === "speaking") {
      setInterviewState("listening");
      // Add logic to start recording audio
      setMessages(prev => [...prev, { speaker: "system", text: "Listening...", timestamp: new Date() }]);
      // Simulate listening progress
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        setProgress(currentProgress);
        if (currentProgress >= 100) {
          clearInterval(interval);
          // Simulate end of listening and start processing
          setInterviewState("processing");
          setMessages(prev => [...prev, { speaker: "user", text: "This is my simulated answer to the question.", timestamp: new Date() }]);
          setProgress(0);
        }
      }, 500);
    } else if (interviewState === "listening") {
      // User clicked mic to stop recording
      setInterviewState("processing");
      setMessages(prev => [...prev, { speaker: "user", text: "This is my simulated answer (stopped early).", timestamp: new Date() }]);
      setProgress(0); // Reset progress
    }
  };
  
  useEffect(() => {
    if (interviewState === "processing") {
       // Simulate AI processing the response and generating next question
      const timer = setTimeout(() => {
        setInterviewState("speaking");
        const aiResponses = [
          "Thank you for sharing. What are your main strengths?",
          "Interesting. Could you describe a challenging situation you've overcome?",
          "That's good to know. Why are you interested in this role?"
        ];
        const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
        setMessages(prev => [...prev, { speaker: "ai", text: randomResponse, timestamp: new Date() }]);
        if (messages.filter(m => m.speaker === 'user').length >= 2) { // Simulate end of interview
            setTimeout(() => {
                setMessages(prev => [...prev, { speaker: "ai", text: "Thank you. That concludes the interview.", timestamp: new Date() }]);
                setInterviewState("ended");
            }, 2000);
        } else {
            setInterviewState("idle"); // Ready for next user input
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [interviewState, messages]);


  const getButtonState = () => {
    switch (interviewState) {
      case "idle":
        return { text: "Start Recording", icon: <Mic className="mr-2 h-5 w-5" />, disabled: messages.length === 0 && !errorDetails && !hasCameraPermission };
      case "requesting_permissions":
        return { text: "Requesting Permissions...", icon: <Loader2 className="mr-2 h-5 w-5 animate-spin" />, disabled: true };
      case "connecting":
        return { text: "Connecting...", icon: <Loader2 className="mr-2 h-5 w-5 animate-spin" />, disabled: true };
      case "listening":
        return { text: "Stop Recording", icon: <Send className="mr-2 h-5 w-5" />, disabled: false };
      case "processing":
        return { text: "Processing...", icon: <Loader2 className="mr-2 h-5 w-5 animate-spin" />, disabled: true };
      case "speaking":
         return { text: "AI Speaking...", icon: <Mic className="mr-2 h-5 w-5 text-muted-foreground" />, disabled: true };
      case "ended":
        return { text: "Interview Ended", icon: <CheckCircle2 className="mr-2 h-5 w-5" />, disabled: true };
      case "error":
         return { text: "Retry Connection", icon: <AlertTriangle className="mr-2 h-5 w-5" />, disabled: false };
      case "permissions_denied":
        return { text: "Enable Camera to Start", icon: <VideoOff className="mr-2 h-5 w-5" />, disabled: false, action: handleStartInterview };
      default:
        return { text: "Start Recording", icon: <Mic className="mr-2 h-5 w-5" />, disabled: true };
    }
  };
  
  const buttonState = getButtonState();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">VocaHire Video Interview</CardTitle>
          <CardDescription>Your AI-powered video interview will begin shortly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {interviewState === "idle" && messages.length === 0 && !errorDetails && hasCameraPermission === null &&(
            <div className="text-center p-8">
              <p className="text-lg mb-6">Welcome to your VocaHire video interview. Click below to start and enable your camera.</p>
              <Button size="lg" onClick={handleStartInterview} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Video className="mr-2 h-5 w-5"/> Begin Interview & Setup Camera
              </Button>
            </div>
          )}
          
          {errorDetails && (interviewState === "error" || interviewState === "permissions_denied") && (
             <Alert variant="destructive" className="my-4">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>{interviewState === "permissions_denied" ? "Camera Permission Required" : "Connection Error"}</AlertTitle>
                <AlertDescription>{errorDetails}</AlertDescription>
             </Alert>
          )}

          {(hasCameraPermission !== null || interviewState === "requesting_permissions" || interviewState === "connecting") && messages.length === 0 && interviewState !== "ended" && interviewState !== "idle" && interviewState !== "error" && interviewState !== "permissions_denied" && (
             <div className="text-center p-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-lg">
                    {interviewState === "requesting_permissions" ? "Waiting for camera permission..." :
                     interviewState === "connecting" ? "Initializing interview session..." :
                     "Setting up..."}
                </p>
             </div>
          )}


          {/* Video Feeds */}
          {(hasCameraPermission || messages.length > 0 || interviewState === "connecting" || interviewState === "requesting_permissions") && interviewState !== "ended" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* User Video */}
              <div className="relative aspect-video bg-muted rounded-lg shadow-md overflow-hidden border border-border">
                <video ref={userVideoRef} autoPlay muted className="w-full h-full object-cover transform scaleX-[-1]" />
                {hasCameraPermission === false && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
                    <VideoOff className="w-12 h-12 mb-2 text-destructive" />
                    <p className="text-center font-semibold">Camera Disabled</p>
                    <p className="text-xs text-center">Please grant camera access.</p>
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
                    layout="fill" 
                    objectFit="cover" 
                    className="opacity-80"
                    data-ai-hint="professional person"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-md text-sm backdrop-blur-sm">
                    AI Interviewer
                </div>
                {interviewState === "speaking" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                )}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="space-y-4 h-64 overflow-y-auto p-4 border rounded-md bg-secondary/30 scroll-smooth">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-xl shadow ${msg.speaker === 'user' ? 'bg-primary text-primary-foreground' : msg.speaker === 'ai' ? 'bg-card border' : 'bg-muted text-muted-foreground text-sm italic'}`}>
                    <p>{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.speaker === 'user' ? 'text-primary-foreground/70' : msg.speaker === 'ai' ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(interviewState === "listening" || interviewState === "processing") && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full h-3" />
              <p className="text-sm text-center text-muted-foreground">
                {interviewState === "listening" ? `Recording... ${progress}%` : "Processing your response..."}
              </p>
            </div>
          )}
          
          {/* Main action button */}
          {interviewState !== "ended" && (messages.length > 0 || interviewState === "permissions_denied" || interviewState === "error") && (
             <Button 
                size="lg" 
                onClick={buttonState.action || (interviewState === "error" ? handleStartInterview : handleMicClick)}
                disabled={buttonState.disabled} 
                className="w-full py-6 text-lg mt-4"
                variant={interviewState === "listening" ? "destructive" : "default"}
              >
              {buttonState.icon}
              {buttonState.text}
            </Button>
          )}

           {interviewState === "ended" && (
             <div className="text-center p-6 bg-green-50 border border-green-200 rounded-md shadow-md">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-3"/>
                <p className="text-xl font-semibold text-green-700">Interview Completed!</p>
                <p className="text-md text-green-600 mt-1">Thank you for participating. You will receive your results shortly.</p>
                 <Button onClick={() => window.location.href = '/'} className="mt-6" variant="outline">Back to Home</Button>
             </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
