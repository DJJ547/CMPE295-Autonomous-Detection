import React, { useState, useEffect } from 'react';
import { Message } from 'semantic-ui-react';

const PopupMessage = ({ message, type }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000); // auto-dismiss after 3 seconds

      return () => clearTimeout(timer); // cleanup on unmount or new message
    }
  }, [message]);

  return (
    isVisible && (
      <div
        style={{
          zIndex: 50,
          position: 'fixed',
          top: '1.25rem',
          left: '50%',
          transform: 'translateX(-50%)',
          minWidth: '300px',
        }}
      >
        <Message
          floating
          compact
          positive={type === 'success'}
          negative={type === 'error'}
          content={message}
        />
      </div>
    )
  );
};

export default PopupMessage;
