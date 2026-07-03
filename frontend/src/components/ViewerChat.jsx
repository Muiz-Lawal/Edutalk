import { useState, useEffect, useRef } from 'react';
import '../styles/ViewerChat.css';

export default function ViewerChat({
  streamId,
  messages,
  onSendMessage,
  isModerated,
  isBlocked,
  blockReason
}) {
  const [newMessage, setNewMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const MAX_MESSAGE_LENGTH = 200;

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await onSendMessage(newMessage);
      setNewMessage('');
      setCharCount(0);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_MESSAGE_LENGTH) {
      setNewMessage(text);
      setCharCount(text.length);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getMessageStatusClass = (status) => {
    switch (status) {
      case 'approved':
        return 'message-approved';
      case 'blocked':
        return 'message-blocked';
      case 'pending':
        return 'message-pending';
      default:
        return '';
    }
  };

  return (
    <div className="viewer-chat-container">
      <div className="chat-header">
        <h3>Live Chat</h3>
        {isModerated && <span className="moderation-badge">✓ Moderated</span>}
      </div>

      <div className="chat-messages" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg._id || index}
              className={`chat-message ${getMessageStatusClass(msg.status)}`}
            >
              <div className="message-header">
                <div className="message-author">
                  {msg.avatar && (
                    <img src={msg.avatar} alt={msg.userName} className="avatar" />
                  )}
                  <span className="author-name">{msg.userName}</span>
                </div>
                <span className="message-time">{formatTimestamp(msg.timestamp)}</span>
              </div>

              <div className="message-content">
                {msg.status === 'blocked' ? (
                  <span className="blocked-label">Message blocked by moderators</span>
                ) : msg.status === 'pending' ? (
                  <span className="pending-label">Awaiting moderation...</span>
                ) : (
                  <p className="message-text">{msg.text}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-section">
        {isBlocked ? (
          <div className="chat-blocked-notice">
            <p className="blocked-title">🚫 You're temporarily muted</p>
            <p className="blocked-reason">{blockReason}</p>
            <small>You can send messages again in a few minutes</small>
          </div>
        ) : (
          <>
            <textarea
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message... (0/200)"
              disabled={sending}
              className="chat-input"
              rows={3}
              maxLength={MAX_MESSAGE_LENGTH}
            />

            <div className="chat-footer">
              <span className="char-count">
                {charCount}/{MAX_MESSAGE_LENGTH}
              </span>

              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="send-button"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>

            {isModerated && (
              <small className="moderation-notice">
                ✓ Messages are reviewed by moderators before appearing
              </small>
            )}
          </>
        )}
      </div>
    </div>
  );
}
