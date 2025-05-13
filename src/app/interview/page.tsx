'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Send, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type InterviewState = "idle" | "connecting" | "listening" | "processing" | "speaking" | "ended" | "error";
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

  // Placeholder for WebSocket connection and audio handling logic
  // In a real app, these would be initialized in useEffect

  useEffect(() => {
    // Simulate connection attempt
    if (interviewState === "connecting") {
      const timer = setTimeout(() => {
        // Simulate successful connection and AI starting the interview
        setMessages([{ speaker: "ai", text: "Hello! Welcome to your VocaHire interview. When you're ready, click the microphone button to answer the first question: Can you tell me a bit about yourself?", timestamp: new Date() }]);
        setInterviewState("idle"); // Ready to listen once user clicks mic
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [interviewState]);

  const handleStartInterview = () => {
    setInterviewState("connecting");
    setMessages([{ speaker: "system", text: "Connecting to interview server...", timestamp: new Date() }]);
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
        return { text: "Start Recording", icon: <Mic className="mr-2 h-5 w-5" />, disabled: messages.length === 0 && !errorDetails };
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
      default:
        return { text: "Start Recording", icon: <Mic className="mr-2 h-5 w-5" />, disabled: true };
    }
  };
  
  const buttonState = getButtonState();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">VocaHire Interview</CardTitle>
          <CardDescription>Your AI-powered voice interview will begin shortly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {messages.length === 0 && interviewState === "idle" && !errorDetails && (
            <div className="text-center p-8">
              <p className="text-lg mb-6">Welcome to your VocaHire interview. Click below to start.</p>
              <Button size="lg" onClick={handleStartInterview} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Begin Interview
              </Button>
            </div>
          )}

          {errorDetails && (
             <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
                <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <h3 className="font-semibold">Connection Error</h3>
                </div>
                <p className="text-sm mt-1">{errorDetails}</p>
             </div>
          )}

          {messages.length > 0 && (
            <div className="space-y-4 h-96 overflow-y-auto p-4 border rounded-md bg-secondary/30">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-xl ${msg.speaker === 'user' ? 'bg-primary text-primary-foreground' : msg.speaker === 'ai' ? 'bg-card border' : 'bg-muted text-muted-foreground text-sm italic'}`}>
                    <p>{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.speaker === 'user' ? 'text-primary-foreground/70' : msg.speaker === 'ai' ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                      {msg.timestamp.toLocaleTimeString()}
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

          {interviewState !== "ended" && messages.length > 0 && (
             <Button 
                size="lg" 
                onClick={interviewState === "error" ? handleStartInterview : handleMicClick}
                disabled={buttonState.disabled} 
                className="w-full py-6 text-lg"
                variant={interviewState === "listening" ? "destructive" : "default"}
              >
              {buttonState.icon}
              {buttonState.text}
            </Button>
          )}
           {interviewState === "ended" && (
             <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2"/>
                <p className="font-semibold text-green-700">Interview Completed!</p>
                <p className="text-sm text-green-600 mt-1">You will receive your results shortly.</p>
                 <Button onClick={() => window.location.href = '/'} className="mt-4">Back to Home</Button>
             </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
