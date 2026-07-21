import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { getSocket, connectSocket } from "../services/socket";
import { useAuthStore } from "../store/auth";
import type { Conversation, Message } from "../services/api";

export default function Messages() {
  const { conversationId: paramConvoId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(paramConvoId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(!!paramConvoId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  // Fetch conversations list
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingConvos(true);
        const data = await api.getConversations();
        setConversations(data);
        // If we have a param conversation ID, auto-select it
        if (paramConvoId && data.some((c) => c.id === paramConvoId)) {
          setActiveConvoId(paramConvoId);
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      } finally {
        setLoadingConvos(false);
      }
    };
    if (user) fetchConversations();
  }, [user, paramConvoId]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvoId) return;

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await api.getMessages(activeConvoId, { limit: 50 });
        // API returns newest first; reverse for display
        setMessages(res.data.reverse());
        scrollToBottom();
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConvoId, scrollToBottom]);

  // Socket.io: join conversation room & listen for new messages
  useEffect(() => {
    if (!activeConvoId || !user) return;

    connectSocket();
    const socket = getSocket();

    socket.emit("join:conversation", { conversationId: activeConvoId });

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === activeConvoId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();

        // Mark as read if the message is from the other person
        if (message.senderId !== user.id) {
          socket.emit("message:read", { conversationId: activeConvoId });
        }
      }

      // Update conversation list's last message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === message.conversationId
            ? {
                ...c,
                lastMessage: {
                  content: message.content,
                  createdAt: message.createdAt,
                  senderId: message.senderId,
                },
                unreadCount:
                  message.senderId !== user.id && message.conversationId !== activeConvoId
                    ? c.unreadCount + 1
                    : c.unreadCount,
              }
            : c
        )
      );
    };

    const handleReadAck = ({
      conversationId,
    }: {
      conversationId: string;
      readerId: string;
      readAt: string;
    }) => {
      if (conversationId === activeConvoId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === user.id && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m
          )
        );
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:read:ack", handleReadAck);

    // Mark messages as read when opening conversation
    socket.emit("message:read", { conversationId: activeConvoId });
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvoId ? { ...c, unreadCount: 0 } : c))
    );

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:read:ack", handleReadAck);
    };
  }, [activeConvoId, user, scrollToBottom]);

  // Send a message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvoId || sending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const socket = getSocket();
      socket.emit("message:send", { conversationId: activeConvoId, content });
    } catch (err) {
      console.error("Failed to send message:", err);
      setNewMessage(content); // Restore on failure
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Select a conversation
  const selectConversation = (convoId: string) => {
    setActiveConvoId(convoId);
    setMobileShowChat(true);
    navigate(`/messages/${convoId}`, { replace: true });
  };

  // Get the other participant's info
  const getOtherParticipant = (convo: Conversation) => {
    if (!user) return null;
    return convo.participantOne.id === user.id ? convo.participantTwo : convo.participantOne;
  };

  // Format timestamp
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const activeConvo = conversations.find((c) => c.id === activeConvoId);

  if (!user) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Login Required</h2>
          <p className="text-gray-500">Please log in to view your messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      {/* Conversation List */}
      <div className={`conversations-list ${mobileShowChat ? "mobile-hidden" : ""}`}>
        <div className="conversations-header">
          <h2>Messages</h2>
          <span className="convo-count">{conversations.length}</span>
        </div>

        {loadingConvos ? (
          <div className="conversations-empty">
            <div className="loading-spinner"></div>
            <p>Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="conversations-empty">
            <div className="empty-icon">💬</div>
            <p>No conversations yet</p>
            <span>Place an order to start chatting with a seller</span>
          </div>
        ) : (
          <div className="conversations-scroll">
            {conversations.map((convo) => {
              const other = getOtherParticipant(convo);
              const isActive = convo.id === activeConvoId;

              return (
                <div
                  key={convo.id}
                  className={`conversation-item ${isActive ? "active" : ""}`}
                  onClick={() => selectConversation(convo.id)}
                >
                  <div className="convo-avatar">
                    {other?.profile?.avatarUrl ? (
                      <img src={other.profile.avatarUrl} alt="" />
                    ) : (
                      <span>{other?.profile?.displayName?.[0]?.toUpperCase() || "?"}</span>
                    )}
                    {convo.unreadCount > 0 && (
                      <div className="unread-badge">{convo.unreadCount}</div>
                    )}
                  </div>
                  <div className="convo-info">
                    <div className="convo-name-row">
                      <h3>{other?.profile?.displayName || "Unknown"}</h3>
                      {convo.lastMessage && (
                        <span className="convo-time">
                          {formatTime(convo.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {convo.order && (
                      <p className="convo-order-title">{convo.order.listing.title}</p>
                    )}
                    {convo.lastMessage && (
                      <p className="convo-last-message">
                        {convo.lastMessage.senderId === user.id ? "You: " : ""}
                        {convo.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className={`chat-area ${!mobileShowChat ? "mobile-hidden" : ""}`}>
        {!activeConvoId ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the list to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <button
                className="back-btn mobile-only"
                onClick={() => {
                  setMobileShowChat(false);
                  navigate("/messages", { replace: true });
                }}
              >
                ← Back
              </button>
              {activeConvo && (() => {
                const other = getOtherParticipant(activeConvo);
                return (
                  <div className="chat-header-info">
                    <div className="chat-header-avatar">
                      {other?.profile?.avatarUrl ? (
                        <img src={other.profile.avatarUrl} alt="" />
                      ) : (
                        <span>{other?.profile?.displayName?.[0]?.toUpperCase() || "?"}</span>
                      )}
                    </div>
                    <div>
                      <h3>{other?.profile?.displayName || "Unknown"}</h3>
                      {activeConvo.order && (
                        <p className="chat-header-order">
                          Re: {activeConvo.order.listing.title} •{" "}
                          <span className={`status-${activeConvo.order.status.toLowerCase()}`}>
                            {activeConvo.order.status}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="chat-messages" ref={messagesContainerRef}>
              {loadingMessages ? (
                <div className="chat-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-no-messages">
                  <p>No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isMine = msg.senderId === user.id;
                    const showAvatar =
                      idx === 0 || messages[idx - 1].senderId !== msg.senderId;

                    return (
                      <div
                        key={msg.id}
                        className={`message-row ${isMine ? "mine" : "theirs"}`}
                      >
                        {!isMine && showAvatar && (
                          <div className="message-avatar">
                            {msg.sender?.profile?.avatarUrl ? (
                              <img src={msg.sender.profile.avatarUrl} alt="" />
                            ) : (
                              <span>
                                {msg.sender?.profile?.displayName?.[0]?.toUpperCase() || "?"}
                              </span>
                            )}
                          </div>
                        )}
                        {!isMine && !showAvatar && <div className="message-avatar-spacer" />}
                        <div className={`message-bubble ${isMine ? "mine" : "theirs"}`}>
                          <p>{msg.content}</p>
                          <div className="message-meta">
                            <span className="message-time">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMine && (
                              <span className="message-read-status">
                                {msg.readAt ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <form className="chat-input-form" onSubmit={handleSend}>
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                autoFocus
              />
              <button type="submit" disabled={!newMessage.trim() || sending}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
