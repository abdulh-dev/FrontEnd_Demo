
import React, { useState, useRef, useEffect } from 'react';

const ChatApp = () => {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const messageRefs = useRef({});
  const dropdownRefs = useRef({});
  const apiUrl = 'http://localhost:8000'; // Adjust this to your backend URL

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown !== null && dropdownRefs.current[openDropdown] && 
          !dropdownRefs.current[openDropdown].contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const isSubstantialOutput = (data) => {
    if (!data) return false;
    
    // Consider substantial if it's a table, image, or long text
    if (data.type === 'table' || data.type === 'image') return true;
    if (data.content && data.content.length > 100) return true;
    
    return false;
  };

  const generateBookmarkTitle = (data, userMessage) => {
    if (data.type === 'table') {
      return `📊 Table Analysis`;
    } else if (data.type === 'image') {
      return `📈 ${data.caption || 'Chart/Visualization'}`;
    } else {
      // Extract meaningful keywords from user message or response
      const text = userMessage.toLowerCase();
      if (text.includes('correlation')) return '🔗 Correlation Analysis';
      if (text.includes('plot') || text.includes('chart')) return '📊 Data Visualization';
      if (text.includes('model') || text.includes('train')) return '🤖 Model Training';
      if (text.includes('describe') || text.includes('summary')) return '📋 Data Summary';
      if (text.includes('distribution')) return '📈 Distribution Analysis';
      
      // Fallback to first few words of user message
      const words = userMessage.split(' ').slice(0, 3).join(' ');
      return `💬 ${words}${words.length < userMessage.length ? '...' : ''}`;
    }
  };

  const scrollToMessage = (messageIndex) => {
    const messageElement = messageRefs.current[messageIndex];
    if (messageElement && chatMessagesRef.current) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center'
      });
      // Briefly highlight the message
      messageElement.style.backgroundColor = 'rgba(0, 212, 170, 0.1)';
      setTimeout(() => {
        messageElement.style.backgroundColor = '';
      }, 2000);
    }
    setSidebarOpen(false);
    setOpenDropdown(null);
  };

  const deleteBookmark = (bookmarkId, event) => {
    event.stopPropagation();
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
    setOpenDropdown(null);
  };

  const referenceBookmark = (bookmark, event) => {
    event.stopPropagation();
    const referenceText = `@reference-${bookmark.id} `;
    setInputValue(prev => prev + referenceText);
    setOpenDropdown(null);
    
    // Focus the input and move cursor to end
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
        messageInputRef.current.setSelectionRange(messageInputRef.current.value.length, messageInputRef.current.value.length);
      }
    }, 0);
  };

  const toggleDropdown = (bookmarkId, event) => {
    event.stopPropagation();
    setOpenDropdown(openDropdown === bookmarkId ? null : bookmarkId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      setUploadedFileName(file.name);
      setFileUploaded(true);
      // Clear initial status message by adding first message
      if (messages.length === 0) {
        setMessages([]);
      }
    } else {
      setMessages([{ type: 'error', content: 'Please upload a valid CSV file.' }]);
    }
  };

  const autoResize = () => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      messageInputRef.current.style.height = Math.min(messageInputRef.current.scrollHeight, 120) + 'px';
    }
  };

  const sendMessage = async () => {
    if (!fileUploaded || isTyping) return;

    const message = inputValue.trim();
    if (!message) return;

    // Add user message
    const newUserMessage = { type: 'user', content: message };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    
    // Reset textarea height
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
    }

    // Show typing indicator
    setIsTyping(true);

    try {
      // Random delay between 1-5 seconds
      const delay = Math.random() * 4000 + 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIsTyping(false);
      
      const assistantMessage = { type: 'assistant', data: data };
      
      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        
        // Check if this is a substantial output and add bookmark
        if (isSubstantialOutput(data)) {
          const bookmarkTitle = generateBookmarkTitle(data, message);
          const newBookmark = {
            id: Date.now(),
            title: bookmarkTitle,
            messageIndex: newMessages.length - 1,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          
          setBookmarks(prev => [...prev, newBookmark]);
        }
        
        return newMessages;
      });

    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: `Sorry, I encountered an error: ${error.message}` 
      }]);
      console.error('Error:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (message, index) => {
    if (message.type === 'error') {
      return (
        <div 
          key={index} 
          className="status-message error"
          ref={el => messageRefs.current[index] = el}
        >
          {message.content}
        </div>
      );
    }

    const isUser = message.type === 'user';
    
    return (
      <div 
        key={index} 
        className={`message ${message.type}`}
        ref={el => messageRefs.current[index] = el}
        style={{ transition: 'background-color 0.3s ease' }}
      >
        {!isUser && (
          <div className="avatar assistant">AI</div>
        )}
        <div className="message-content">
          {message.type === 'assistant' && message.data ? (
            <>
              {message.data.type === 'table' ? (
                <div className="content-table" dangerouslySetInnerHTML={{ __html: message.data.content }} />
              ) : message.data.type === 'image' ? (
                <>
                  <img 
                    className="content-image" 
                    src={`data:image/png;base64,${message.data.content}`}
                    alt={message.data.caption || 'Generated chart'} 
                  />
                  {message.data.caption && (
                    <div className="content-caption">{message.data.caption}</div>
                  )}
                </>
              ) : (
                <div>{message.data.content}</div>
              )}
            </>
          ) : (
            <div>{message.content}</div>
          )}
        </div>
        {isUser && (
          <div className="avatar user">U</div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <button 
            style={styles.sidebarToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            disabled={bookmarks.length === 0}
            className="sidebar-toggle"
          >
            ☰
          </button>
          <h1 style={styles.headerTitle}>🤖 AI Data Analyst</h1>
          <div style={{ width: '40px' }}></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        ...(sidebarOpen ? styles.sidebarOpen : {})
      }}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>📋 Outputs</h3>
          <button 
            style={styles.sidebarClose}
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close"
          >
            ✕
          </button>
        </div>
        <div style={styles.sidebarContent}>
          {bookmarks.length === 0 ? (
            <div style={styles.sidebarEmpty}>
              No substantial outputs yet. Start analyzing your data!
            </div>
          ) : (
            bookmarks.map((bookmark) => (
              <div key={bookmark.id} style={styles.bookmarkContainer}>
                <div
                  style={styles.bookmarkItem}
                  className="bookmark-item"
                  onClick={() => scrollToMessage(bookmark.messageIndex)}
                >
                  <div style={styles.bookmarkContent}>
                    <div style={styles.bookmarkTitle}>{bookmark.title}</div>
                    <div style={styles.bookmarkTime}>{bookmark.timestamp}</div>
                  </div>
                  <div style={styles.dropdownContainer}>
                    <button
                      style={styles.optionsButton}
                      className="options-button"
                      onClick={(e) => toggleDropdown(bookmark.id, e)}
                    >
                      ⋮
                    </button>
                    {openDropdown === bookmark.id && (
                      <div 
                        ref={el => dropdownRefs.current[bookmark.id] = el}
                        style={styles.dropdown}
                        className="dropdown-menu"
                      >
                        <button
                          style={styles.dropdownItem}
                          className="dropdown-item reference"
                          onClick={(e) => referenceBookmark(bookmark, e)}
                        >
                          <span style={styles.dropdownIcon}>🔗</span>
                          Reference
                        </button>
                        <button
                          style={styles.dropdownItem}
                          className="dropdown-item delete"
                          onClick={(e) => deleteBookmark(bookmark.id, e)}
                        >
                          <span style={styles.dropdownIcon}>🗑️</span>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          style={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div style={styles.uploadSection}>
        <div 
          style={{
            ...styles.uploadArea,
            ...(isDragOver ? styles.uploadAreaDragover : {}),
            ...(fileUploaded ? styles.uploadAreaUploaded : {})
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleFileDrop}
        >
          <div style={{
            ...styles.uploadText,
            ...(fileUploaded ? styles.uploadTextUploaded : {})
          }}>
            {fileUploaded ? `✅ ${uploadedFileName} uploaded successfully!` : '📊 Drag & drop your CSV file here or click to upload'}
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".csv" 
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      <div style={styles.chatContainer}>
        <div ref={chatMessagesRef} style={styles.chatMessages} className="chat-messages-scroll">
          {!fileUploaded && messages.length === 0 && (
            <div style={styles.statusMessage}>
              Welcome! Please upload a CSV file to begin analyzing your data.
            </div>
          )}
          
          {messages.map((message, index) => renderMessage(message, index))}
          
          {isTyping && (
            <div className="message assistant">
              <div className="avatar assistant">AI</div>
              <div className="message-content">
                <div style={styles.typingIndicator}>
                  <div style={{...styles.typingDot, animationDelay: '-0.32s'}}></div>
                  <div style={{...styles.typingDot, animationDelay: '-0.16s'}}></div>
                  <div style={styles.typingDot}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.inputArea}>
          <div style={styles.inputContainer}>
            <div style={styles.inputWrapper}>
              <textarea
                ref={messageInputRef}
                style={{
                  ...styles.messageInput,
                  ...(fileUploaded ? {} : styles.messageInputDisabled)
                }}
                placeholder="Ask me to describe dataset, show correlation matrix, plot close price, or train a model..."
                disabled={!fileUploaded}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  autoResize();
                }}
                onKeyDown={handleKeyDown}
              />
              <button
                style={{
                  ...styles.sendButton,
                  ...((!fileUploaded || isTyping) ? styles.sendButtonDisabled : {})
                }}
                disabled={!fileUploaded || isTyping}
                onClick={sendMessage}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={styles.sendIcon}>
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    background: '#0f0f0f',
    color: '#ffffff',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    background: '#1a1a1a',
    padding: '1rem 2rem',
    borderBottom: '1px solid #333',
    position: 'relative',
    zIndex: 20,
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: '800px',
    margin: '0 auto',
  },
  sidebarToggle: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#00d4aa',
    margin: 0,
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    left: '-320px',
    width: '320px',
    height: '100vh',
    background: '#1a1a1a',
    borderRight: '1px solid #333',
    transition: 'left 0.3s ease',
    zIndex: 30,
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarOpen: {
    left: 0,
  },
  sidebarHeader: {
    padding: '1rem',
    borderBottom: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarTitle: {
    color: '#00d4aa',
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: 0,
  },
  sidebarClose: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '4px',
    transition: 'color 0.2s ease',
  },
  sidebarContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.5rem',
  },
  sidebarEmpty: {
    color: '#888',
    textAlign: 'center',
    padding: '2rem 1rem',
    fontSize: '0.9rem',
    lineHeight: 1.4,
  },
  bookmarkContainer: {
    position: 'relative',
    marginBottom: '0.5rem',
  },
  bookmarkItem: {
    background: '#2a2a2a',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  bookmarkContent: {
    flex: 1,
    minWidth: 0,
  },
  bookmarkTitle: {
    color: '#ffffff',
    fontSize: '0.9rem',
    fontWeight: 500,
    marginBottom: '0.25rem',
  },
  bookmarkTime: {
    color: '#888',
    fontSize: '0.75rem',
  },
  dropdownContainer: {
    position: 'relative',
    marginLeft: '0.5rem',
  },
  optionsButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    fontSize: '1rem',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    lineHeight: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    background: '#1a1a1a',
    border: '1px solid #555',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    zIndex: 40,
    minWidth: '120px',
    overflow: 'hidden',
    marginTop: '0.25rem',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '0.75rem',
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'background 0.2s ease',
    textAlign: 'left',
  },
  dropdownIcon: {
    marginRight: '0.5rem',
    fontSize: '0.9rem',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 25,
  },
  uploadSection: {
    background: '#1a1a1a',
    padding: '1rem 2rem',
    borderBottom: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80px',
  },
  uploadArea: {
    border: '2px dashed #555',
    borderRadius: '8px',
    padding: '1rem 2rem',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    background: '#0f0f0f',
    minWidth: '300px',
  },
  uploadAreaDragover: {
    borderColor: '#00d4aa',
    background: '#001a16',
  },
  uploadAreaUploaded: {
    borderColor: '#00d4aa',
    background: '#001a16',
  },
  uploadText: {
    color: '#888',
    fontSize: '0.9rem',
  },
  uploadTextUploaded: {
    color: '#00d4aa',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
    minHeight: 0,
    overflow: 'hidden',
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    background: '#0f0f0f',
    minHeight: 0,
    maxHeight: 'calc(100vh - 240px)',
  },
  statusMessage: {
    background: '#2a2a2a',
    border: '1px solid #555',
    borderRadius: '0.5rem',
    padding: '1rem',
    textAlign: 'center',
    color: '#888',
  },
  inputArea: {
    padding: '1rem 2rem',
    background: '#1a1a1a',
    borderTop: '1px solid #333',
    flexShrink: 0,
    position: 'sticky',
    bottom: 0,
    zIndex: 10,
  },
  inputContainer: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-end',
    maxWidth: '800px',
    margin: '0 auto',
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  messageInput: {
    width: '100%',
    background: '#2a2a2a',
    border: '1px solid #555',
    borderRadius: '1rem',
    padding: '1rem 3rem 1rem 1rem',
    color: '#ffffff',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    resize: 'none',
    minHeight: '50px',
    maxHeight: '120px',
    outline: 'none',
  },
  messageInputDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  sendButton: {
    position: 'absolute',
    right: '0.5rem',
    bottom: '0.5rem',
    background: '#00d4aa',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  sendButtonDisabled: {
    background: '#555',
    cursor: 'not-allowed',
  },
  sendIcon: {
    width: '18px',
    height: '18px',
    color: '#000',
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    padding: '0.5rem',
  },
  typingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#888',
    animation: 'typing 1.4s infinite ease-in-out',
  },
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.innerText = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    margin: 0;
    padding: 0;
    background: #0f0f0f;
    overflow: hidden;
  }

  @keyframes typing {
    0%, 80%, 100% { opacity: 0.3; }
    40% { opacity: 1; }
  }

  .message {
    display: flex;
    gap: 1rem;
    max-width: 100%;
  }

  .message.user {
    justify-content: flex-end;
  }

  .message.assistant {
    justify-content: flex-start;
  }

  .message-content {
    max-width: 80%;
    padding: 1rem 1.5rem;
    border-radius: 1rem;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .message.user .message-content {
    background: #00d4aa;
    color: #000;
    border-bottom-right-radius: 0.25rem;
  }

  .message.assistant .message-content {
    background: #2a2a2a;
    color: #ffffff;
    border-bottom-left-radius: 0.25rem;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.8rem;
    flex-shrink: 0;
  }

  .avatar.user {
    background: #00d4aa;
    color: #000;
  }

  .avatar.assistant {
    background: #555;
    color: #fff;
  }

  .content-image {
    max-width: 100%;
    border-radius: 8px;
    margin: 0.5rem 0;
  }

  .content-table {
    margin: 0.5rem 0;
    border-radius: 8px;
    overflow: hidden;
  }

  .content-table table {
    width: 100%;
    border-collapse: collapse;
    background: #1a1a1a;
  }

  .content-table th,
  .content-table td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #333;
    font-size: 0.85rem;
  }

  .content-table th {
    background: #2a2a2a;
    font-weight: 600;
  }

  .content-caption {
    font-size: 0.9rem;
    color: #888;
    margin-top: 0.5rem;
    font-style: italic;
  }

  .status-message.error {
    border-color: #e74c3c !important;
    color: #e74c3c !important;
  }

  /* Custom scrollbar for chat messages */
  .chat-messages-scroll::-webkit-scrollbar {
    width: 6px;
  }

  .chat-messages-scroll::-webkit-scrollbar-track {
    background: #1a1a1a;
  }

  .chat-messages-scroll::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 3px;
  }

  .chat-messages-scroll::-webkit-scrollbar-thumb:hover {
    background: #777;
  }

  /* Sidebar hover effects */
  .sidebar-toggle:hover:not(:disabled) {
    background: rgba(0, 212, 170, 0.1) !important;
    color: #00d4aa !important;
  }

  .sidebar-toggle:disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
  }

  .sidebar-close:hover {
    color: #ffffff !important;
  }

  .bookmark-item:hover {
    background: #333 !important;
    border-color: #555 !important;
    transform: translateX(4px) !important;
  }

  /* Options button hover effects */
  .options-button:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #ffffff !important;
  }

  /* Dropdown hover effects */
  .dropdown-item:hover {
    background: #333 !important;
  }

  .dropdown-item.reference:hover {
    background: rgba(0, 212, 170, 0.1) !important;
    color: #00d4aa !important;
  }

  .dropdown-item.delete:hover {
    background: rgba(231, 76, 60, 0.1) !important;
    color: #e74c3c !important;
  }
`;
document.head.appendChild(styleSheet);

export default ChatApp;