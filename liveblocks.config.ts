import { createClient, LiveList } from "@liveblocks/client";
import { createRoomContext, createLiveblocksContext } from "@liveblocks/react";

// Presence - co każdy user "ma przy sobie" (kursor, zaznaczenie)
type Presence = {
  cursor: { x: number; y: number } | null;
  selectedElement: string | null;
  isCommenting: boolean;
};

// Comment type for storage
export type StoredComment = {
  id: string;
  x: number;
  y: number;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorColor: string;
  timestamp: number;
  resolved: boolean;
  tab: string; // Which tab this comment belongs to (preview, code, flow, etc.)
  replies: {
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    authorColor: string;
    timestamp: number;
  }[];
};

// Storage - współdzielony stan (komentarze, live editing w przyszłości)
type Storage = {
  comments: LiveList<StoredComment>;
};

// UserMeta - info o userze widoczne dla innych
type UserMeta = {
  id: string;
  info: {
    name: string;
    email?: string;
    avatar?: string;
    color: string;
  };
};

// Room event - eventy wysyłane do pokoju
type RoomEvent = {
  type: "CURSOR_CLICK" | "ELEMENT_SELECTED";
  x?: number;
  y?: number;
  elementId?: string;
};

// Thread metadata - gdzie jest przypięty komentarz
type ThreadMetadata = {
  x: number;
  y: number;
  elementId?: string;
  resolved?: boolean;
};

// Client - autoryzacja przez nasz endpoint
const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
  throttle: 16, // 60fps dla smooth kursorów
});

// Export hooks z typami
export const {
  RoomProvider,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useOthersMapped,
  useSelf,
  useRoom,
  useBroadcastEvent,
  useEventListener,
  useStorage,
  useMutation,
  useStatus,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

export const {
  LiveblocksProvider,
  useInboxNotifications,
  useUnreadInboxNotificationsCount,
  useMarkAllInboxNotificationsAsRead,
  useUser,
} = createLiveblocksContext<UserMeta, ThreadMetadata>(client);

// Kolory dla userów
export const CURSOR_COLORS = [
  "#E57373", // Red
  "#9575CD", // Purple
  "#4FC3F7", // Blue
  "#81C784", // Green
  "#FFB74D", // Orange
  "#F06292", // Pink
  "#4DB6AC", // Teal
  "#7986CB", // Indigo
];

export function getUserColor(index: number): string {
  return CURSOR_COLORS[index % CURSOR_COLORS.length];
}
