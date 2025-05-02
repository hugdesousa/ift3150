// ift3150/components/ChatWindow.tsx

"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

export default function ChatWindow({
  workerId,
  userId,
  initialMessages,
  workerName,
}: {
  workerId: string;
  userId: string;
  initialMessages: any[];
  workerName: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Envoyer le message
    setMessages([
      ...messages,
      {
        id: Date.now(),
        content: newMessage,
        senderId: userId,
        receiverId: workerId,
        createdAt: new Date(),
      },
    ]);

    setNewMessage("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-96 flex-col rounded-lg border">
      <div className="border-b p-4">
        <h3 className="font-medium">Conversation avec {workerName}</h3>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs rounded-lg px-4 py-2 md:max-w-md ${
                msg.senderId === userId
                  ? "bg-amber-100 text-amber-900"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 border-t p-4">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button onClick={sendMessage} size="icon">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
