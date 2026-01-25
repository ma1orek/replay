import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Cursor colors - duplicated here to avoid importing client-side code
const CURSOR_COLORS = [
  "#E57373", "#9575CD", "#4FC3F7", "#81C784", 
  "#FFB74D", "#F06292", "#4DB6AC", "#7986CB",
];

function getUserColor(index: number): string {
  return CURSOR_COLORS[index % CURSOR_COLORS.length];
}

// Lazy initialization to avoid build-time errors when env var is missing
let liveblocks: Liveblocks | null = null;
function getLiveblocks(): Liveblocks {
  if (!liveblocks) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secret) {
      throw new Error("LIVEBLOCKS_SECRET_KEY environment variable is required");
    }
    liveblocks = new Liveblocks({ secret });
  }
  return liveblocks;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Pobierz dane z requesta
    const { room } = await request.json();
    
    if (!room) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    // 2. Pobierz usera z Supabase session
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 3. Przygotuj dane usera (zalogowany lub gość)
    let userId: string;
    let userName: string;
    let userEmail: string | undefined;
    let userAvatar: string | undefined;

    if (user) {
      // Zalogowany user - pobierz profil
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      userId = user.id;
      userName = profile?.full_name || user.email?.split("@")[0] || "User";
      userEmail = user.email;
      userAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`;
    } else {
      // Gość - generuj tymczasowe ID
      const guestId = `guest-${Math.random().toString(36).substring(7)}`;
      userId = guestId;
      userName = "Guest";
      userAvatar = `https://api.dicebear.com/7.x/shapes/svg?seed=${guestId}`;
    }

    // 4. Przypisz kolor na podstawie hash ID
    const colorIndex = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const userColor = getUserColor(colorIndex);

    // 5. Opcjonalnie: sprawdź czy user ma dostęp do projektu
    // Na razie pozwalamy wszystkim zalogowanym userom
    // W przyszłości: sprawdź w bazie czy user jest właścicielem/członkiem teamu
    
    // Jeśli room to ID projektu, możesz sprawdzić:
    // const projectId = room.replace('project-', '');
    // const { data: project } = await supabase
    //   .from('generations')
    //   .select('user_id')
    //   .eq('id', projectId)
    //   .single();
    // if (project?.user_id !== user?.id) {
    //   return NextResponse.json({ error: "Access denied" }, { status: 403 });
    // }

    // 6. Stwórz sesję Liveblocks
    const session = getLiveblocks().prepareSession(userId, {
      userInfo: {
        name: userName,
        email: userEmail,
        avatar: userAvatar,
        color: userColor,
      },
    });

    // 7. Pozwól na dostęp do pokoju
    session.allow(room, session.FULL_ACCESS);

    // 8. Autoryzuj i zwróć token
    const { status, body } = await session.authorize();
    return new NextResponse(body, { status });

  } catch (error) {
    console.error("[Liveblocks Auth Error]:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
