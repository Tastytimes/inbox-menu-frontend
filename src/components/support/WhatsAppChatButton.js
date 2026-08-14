import React, { useEffect, useState } from "react";
import { getWhatsAppSupportConfig } from "../../api/supportApi";

const WhatsAppChatButton = ({
  className = "",
  label = "Chat with us on WhatsApp",
  prefillMessage,
}) => {
  const [chatUrl, setChatUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getWhatsAppSupportConfig()
      .then((config) => {
        if (!active) return;

        if (!config?.enabled || !config?.chatUrl) {
          setChatUrl(null);
          return;
        }

        if (prefillMessage?.trim()) {
          const phoneDigits = config.phoneDigits;
          const text = encodeURIComponent(prefillMessage.trim());
          setChatUrl(`https://wa.me/${phoneDigits}?text=${text}`);
          return;
        }

        setChatUrl(config.chatUrl);
      })
      .catch(() => {
        if (active) {
          setChatUrl(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [prefillMessage]);

  if (loading || !chatUrl) {
    return null;
  }

  return (
    <a
      href={chatUrl}
      className={`whatsapp-chat-button ${className}`.trim()}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
    </a>
  );
};

export default WhatsAppChatButton;
