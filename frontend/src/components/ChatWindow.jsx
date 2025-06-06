import React, { useState } from 'react';
import axios from 'axios';
import './ChatWindow.css'; // Optional styling

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false); // State to manage loading status

    const quickActions = [
    { label: "Summarize data", message: "Please summarize the data." },
    { label: "Key findings", message: "What are the key insights?" },
  ];

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', parts: [input] }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_LOCALHOST}/api/llm-summarize`, {
        user_id: 'user123',
        message: input,
      });

      const botReply = response.data.reply;
      setMessages([...newMessages, { role: 'model', parts: [botReply] }]);
      setInput('');
      setLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setInput('');
      setLoading(false);
    }
  };
  const handleQuickAction = (actionMessage) => {
    // setInput(actionMessage); // Set the input to the selected quick action
    // sendMessage(); // Send the message immediately
  };


  return (
    <div className="chat-container">
      <div className="chat-history">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.parts[0]}
          </div>
        ))}
      </div>

      <div className="quick-actions">
        {/* Render quick action buttons */}
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            className="quick-action-btn"
            onClick={() => handleQuickAction(action.message)}
            disabled={loading} // Disable buttons while loading
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask something about Gemini..."
        />
        <button onClick={sendMessage} disabled={loading}>Send</button>
      </div>
      {loading && <div className="loading">Loading...</div>} {/* Display loading message */}
    </div>
  );
};

export default ChatWindow;
