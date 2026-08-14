import React, { useEffect, useState } from "react";
import { fetchSupportMediaBlob } from "../api/adminApi";

function resolveMediaKind(messageType, mediaMimeType) {
  if (messageType === "video" || mediaMimeType?.startsWith("video/")) {
    return "video";
  }

  if (messageType === "audio" || mediaMimeType?.startsWith("audio/")) {
    return "audio";
  }

  if (messageType === "image" || mediaMimeType?.startsWith("image/")) {
    return "image";
  }

  return "document";
}

const SupportMessageMedia = ({ mediaId, messageType, mediaMimeType, caption }) => {
  const [objectUrl, setObjectUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const mediaKind = resolveMediaKind(messageType, mediaMimeType);

  useEffect(() => {
    if (!mediaId) return undefined;

    let active = true;

    const loadMedia = async () => {
      try {
        const blob = await fetchSupportMediaBlob(mediaId);
        if (!active) return;

        const createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
        setFailed(false);
      } catch {
        if (active) {
          setFailed(true);
        }
      }
    };

    void loadMedia();

    return () => {
      active = false;
      setObjectUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
    };
  }, [mediaId]);

  if (!mediaId) {
    return null;
  }

  if (failed) {
    return <div className="admin-support-inbox__media-fallback">Media unavailable</div>;
  }

  if (!objectUrl) {
    return <div className="admin-support-inbox__media-fallback">Loading media…</div>;
  }

  if (mediaKind === "video") {
    return (
      <div className="admin-support-inbox__media-link">
        <video
          src={objectUrl}
          controls
          playsInline
          className="admin-support-inbox__media-video"
        />
      </div>
    );
  }

  if (mediaKind === "audio") {
    return (
      <div className="admin-support-inbox__media-link">
        <audio src={objectUrl} controls className="admin-support-inbox__media-audio" />
      </div>
    );
  }

  if (mediaKind === "image") {
    return (
      <a href={objectUrl} target="_blank" rel="noreferrer" className="admin-support-inbox__media-link">
        <img
          src={objectUrl}
          alt={caption || "WhatsApp image"}
          className="admin-support-inbox__media-image"
        />
      </a>
    );
  }

  return (
    <a href={objectUrl} target="_blank" rel="noreferrer" className="admin-support-inbox__media-link">
      View document
    </a>
  );
};

export default SupportMessageMedia;
