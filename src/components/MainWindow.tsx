"use client";

import { useChat } from "@ai-sdk/react";
import { FormEvent, useState } from "react";

import { Intention } from "@/types";

function MainWindow() {
    const [intention, setIntention] = useState<Intention>(Intention.LOCAL);
    const { messages, input, handleInputChange, handleSubmit } = useChat({
        body: { intention },
    });

    const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        handleSubmit();
    };

    return (
        <div className="container">
            {Object.values(Intention).map((value) => (
                <button key={value} onClick={() => setIntention(value)}>
                    {value}
                </button>
            ))}
            {messages
                .filter((message) => ["user", "assistant"].includes(message.role))
                .map((message, i) => (
                    <div key={i}>
                        <div>{message.role == "user" ? "User" : "AI"}</div>
                        <div>{message.content}</div>
                    </div>
                ))}
            <form onSubmit={handleFormSubmit}>
                <textarea value={input} onChange={handleInputChange} />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}

export default MainWindow;
