"use client";

import MobilePreviewView from "./MobilePreviewView";
import { useMobileComments } from "./useMobileComments";

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
}

export default function MobilePreviewWithComments(props: MobilePreviewWithCommentsProps) {
  const { comments, addComment, userInfo, isConnected } = useMobileComments();

  return (
    <MobilePreviewView
      {...props}
      onAddComment={isConnected ? addComment : undefined}
      comments={comments}
      userName={userInfo.name}
      userAvatar={userInfo.avatar}
    />
  );
}
