import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ChatWindow.css'; // Optional styling
import ReactMarkdown from 'react-markdown';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false); // State to manage loading status
  const [summary, setSummary] = useState('');//store initial summary to use as input context 


  useEffect(() =>{
    const getSummary = async () =>{
    try {
      const response = await axios.post(`${process.env.REACT_APP_LOCALHOST}/api/llm-summarize`);
      const botReply = response.data.reply;
      setMessages([...messages, { role: 'model', parts: [botReply] }]);
      setSummary(botReply)

    }catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
    }
  }
  setLoading(true);
  getSummary()
  setLoading(false);
  }, [])
  

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', parts: [input] }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_LOCALHOST}/api/llm-query`, {
        user_id: 'user123',
        message: input,
        context: summary,
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
          <div className={`message-container ${msg.role}`}>
            <div className="message-label">
              <strong>{msg.role === 'model' ? "AI Agent" : "User"}:</strong>
            </div>
            <div key={idx} className={`message ${msg.role}`}>
              {msg.role === 'model' ? (
                <ReactMarkdown>{msg.parts[0]}</ReactMarkdown> // ✅ Markdown rendering
              ) : (
                <div>{msg.parts[0]}</div>
              )}
            </div>
          </div>
        ))}
      </div>


      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask a question"
        />
        <button onClick={sendMessage} disabled={loading}>Send</button>
      </div>
      {loading && <div className="loading">Loading...</div>} {/* Display loading message */}
    </div>
  );
};

export default ChatWindow;
