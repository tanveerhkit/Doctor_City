import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { addChatMessage, getChatMessages } from "../utils/prototypeStorage";

export default function DoctorCityChatRoom() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers] = useState(127);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMessages(getChatMessages());
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (event) => {
    event.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    const displayName = user?.name || "You";
    const initials = displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const nextMessages = addChatMessage({
      user: displayName,
      avatar: initials || "YU",
      message: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isCurrentUser: true,
    });

    setMessages(nextMessages);
    setNewMessage("");
    setIsTyping(false);
  };

  const handleTyping = (event) => {
    setNewMessage(event.target.value);
    setIsTyping(event.target.value.length > 0);
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-green-50/30 via-white to-emerald-50/40">
      <div className="sticky top-0 z-10 border-b border-green-100/50 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-3 shadow-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-xl font-bold text-transparent">
                Doctor City Community
              </h1>
              <p className="text-sm text-gray-500">
                Community services and local initiatives
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 rounded-full border border-green-200/50 bg-green-100/70 px-4 py-2 backdrop-blur-sm">
            <div className="relative">
              <Users className="h-4 w-4 text-green-600" />
              <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-green-500" />
            </div>
            <span className="text-sm font-semibold text-green-700">
              {onlineUsers}
            </span>
            <span className="text-xs text-green-600">online</span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`group flex items-start space-x-3 ${
              message.isCurrentUser ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            <div
              className={`relative flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-lg transition-transform duration-200 group-hover:scale-110 ${
                message.isCurrentUser
                  ? "bg-gradient-to-br from-green-500 to-green-600"
                  : "bg-gradient-to-br from-emerald-400 to-green-500"
              }`}
            >
              {message.avatar}
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-400" />
            </div>

            <div
              className={`flex-1 max-w-xs sm:max-w-md lg:max-w-lg ${
                message.isCurrentUser ? "text-right" : ""
              }`}
            >
              <div
                className={`relative rounded-2xl p-4 shadow-sm transition-all duration-200 group-hover:shadow-md ${
                  message.isCurrentUser
                    ? "ml-auto bg-gradient-to-br from-green-500 to-green-600 text-white"
                    : "border border-green-100/50 bg-white/90 text-gray-800"
                }`}
              >
                {!message.isCurrentUser && (
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-700">
                    {message.user}
                    <Sparkles className="h-3 w-3 text-green-500" />
                  </p>
                )}
                <p
                  className={`text-sm leading-relaxed ${
                    message.isCurrentUser ? "text-white" : "text-gray-700"
                  }`}
                >
                  {message.message}
                </p>
                <div
                  className={`absolute top-4 h-3 w-3 rotate-45 ${
                    message.isCurrentUser
                      ? "right-[-6px] bg-green-500"
                      : "left-[-6px] border-l border-t border-green-100/50 bg-white"
                  }`}
                />
              </div>

              <p
                className={`mt-2 px-1 text-xs text-gray-400 ${
                  message.isCurrentUser ? "text-right" : "text-left"
                }`}
              >
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 border-t border-green-100/50 bg-white/80 p-4 backdrop-blur-xl">
        {isTyping && (
          <div className="mb-3 flex items-center space-x-2 text-sm text-green-600">
            <div className="flex space-x-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-bounce" />
              <div
                className="h-2 w-2 rounded-full bg-green-500 animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="h-2 w-2 rounded-full bg-green-500 animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
            <span>You&apos;re typing...</span>
          </div>
        )}

        <div className="flex items-end space-x-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSendMessage(event);
                }
              }}
              placeholder="Share your community initiative or ask for help..."
              className="w-full rounded-2xl border-2 border-green-200/50 bg-white/70 p-4 pr-12 text-gray-700 shadow-sm transition-all duration-300 placeholder-gray-400 hover:shadow-md focus:border-green-400 focus:bg-white focus:outline-none focus:shadow-lg"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {newMessage.trim() && (
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="group rounded-2xl bg-gradient-to-r from-green-500 to-green-600 p-4 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-green-600 hover:to-green-700 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-sm"
          >
            <Send className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>

        <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-gray-500">
          <Sparkles className="h-3 w-3 text-green-500" />
          Connect with your community • Share resources • Make a difference together
        </p>
      </div>
    </div>
  );
}

