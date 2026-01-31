"use client";

import MobilePreviewView from "./MobilePreviewView";
import { useMobileComments, useMobileCommentsSimple } from "./useMobileComments";

interface MobilePreviewWithCommentsProps {
  previewUrl: string | null;
  previewCode: string | null;
  isProcessing: boolean;
  processingProgress: number;
  processingMessage: string;
  projectName: string;
  projectId?: string | null;
  onPublish: () => Promise<string | null>;
  publishedUrl: string | null;
  isPublishing: boolean;
  onCodeUpdate?: (newCode: string) => void;
  onClose?: () => void;
}

// Wrapper that uses Liveblocks comments (must be inside RoomProvider)
function WithLiveblocksComments(props: MobilePreviewWithCommentsProps) {
  const { comments, addComment, userInfo, isConnected } = useMobileComments();

  return (
    <MobilePreviewView
      {...props}
      onAddComment={isConnected ? addComment : undefined}
      comments={comments}
      userName={userInfo.name}
      userAvatar={userInfo.avatar}
      onCodeUpdate={props.onCodeUpdate}
    />
  );
}

// Wrapper that uses local comments (no Liveblocks needed)
function WithLocalComments(props: MobilePreviewWithCommentsProps) {
  const { comments, addComment, userInfo } = useMobileCommentsSimple();

  return (
    <MobilePreviewView
      {...props}
      onAddComment={addComment}
      comments={comments}
      userName={userInfo.name}
      userAvatar={userInfo.avatar}
      onCodeUpdate={props.onCodeUpdate}
    />
  );
}

export default function MobilePreviewWithComments(props: MobilePreviewWithCommentsProps) {
  // projectId determines if we're inside RoomProvider (set by MobileLiveCollaboration)
  // Only use Liveblocks hooks when projectId exists and is truthy
  const hasRoomProvider = !!props.projectId && props.projectId.length > 0;
  
  if (hasRoomProvider) {
    return <WithLiveblocksComments {...props} />;
  }
  
  // No RoomProvider - use simple local comments
  return <WithLocalComments {...props} />;
}
