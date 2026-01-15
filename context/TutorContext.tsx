"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Message {
    role: "user" | "ai";
    content: string;
    timestamp: number;
}

interface TutorContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    messages: Message[];
    addMessage: (role: "user" | "ai", content: string) => void;
    currentContext: string;
    setCurrentContext: (context: string) => void;
}

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export function TutorProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);

    // Initial welcome message
    React.useEffect(() => {
        setMessages([
            {
                role: "ai",
                content: "Cześć! Jestem Twoim osobistym nauczycielem matematyki. W czym możemy dzisiaj namieszać?",
                timestamp: Date.now(),
            },
        ]);
    }, []);
    const [currentContext, setCurrentContext] = useState("");

    const addMessage = (role: "user" | "ai", content: string) => {
        setMessages((prev) => [...prev, { role, content, timestamp: Date.now() }]);
    };

    return (
        <TutorContext.Provider
            value={{
                isOpen,
                setIsOpen,
                messages,
                addMessage,
                currentContext,
                setCurrentContext,
            }}
        >
            {children}
        </TutorContext.Provider>
    );
}

export function useTutor() {
    const context = useContext(TutorContext);
    if (context === undefined) {
        throw new Error("useTutor must be used within a TutorProvider");
    }
    return context;
}
