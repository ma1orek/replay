import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Facebook Conversions API Configuration
const PIXEL_ID = "767421659003978";
const ACCESS_TOKEN = "EAAgeb93PAQcBQa52uA3tYglpC9K69T5hGf9Mg8PIwVplDAfQlAZCkGiSQlpAjChsOtvFQvGew8ZAisiRFfGgYUISvNE6X2thIgNY3SX1FNtyZBFKzrQgZBTpX9H4qYBFihmUiFO2QSuuHf9XvsoSDKvtU4IUpZAb6fTAL87e5A4ipKsNWZBb2WCSJZBvOu2FwZDZD";
const API_VERSION = "v18.0";

// Hash function for PII data
function hashData(data: string | null | undefined): string | null {
  if (!data) return null;
  return crypto.createHash("sha256").update(data.toLowerCase().trim()).digest("hex");
}

// Standard Facebook Events
type EventName = 
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Subscribe"
  | "CompleteRegistration"
  | "Contact"
  | "Lead"
  | "StartTrial";

interface EventData {
  event_name: EventName;
  event_time?: number;
  event_source_url?: string;
  action_source?: "website" | "app" | "email" | "phone_call" | "chat" | "other";
  user_data?: {
    em?: string | null | undefined; // hashed email
    ph?: string | null | undefined; // hashed phone
    fn?: string | null | undefined; // hashed first name
    ln?: string | null | undefined; // hashed last name
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string; // Facebook click ID
    fbp?: string; // Facebook browser ID
    external_id?: string | null | undefined; // Your user ID (hashed)
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    num_items?: number;
    predicted_ltv?: number;
    status?: string;
  };
  event_id?: string; // For deduplication with pixel
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      eventName, 
      email,
      phone,
      firstName,
      lastName,
      userId,
      sourceUrl,
      customData,
      eventId,
      fbc,
      fbp
    } = body;

    if (!eventName) {
      return NextResponse.json({ error: "eventName is required" }, { status: 400 });
    }

    // Get client info from headers
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = request.headers.get("user-agent") || "";

    // Build event data
    const eventData: EventData = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: sourceUrl || "https://replay.build",
      action_source: "website",
      user_data: {
        em: hashData(email),
        ph: hashData(phone),
        fn: hashData(firstName),
        ln: hashData(lastName),
        client_ip_address: clientIp,
        client_user_agent: userAgent,
        external_id: userId ? hashData(userId) || undefined : undefined,
        fbc: fbc || undefined,
        fbp: fbp || undefined,
      },
      custom_data: customData || {},
      event_id: eventId || `${eventName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Send to Facebook Conversions API
    const fbResponse = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [eventData],
        }),
      }
    );

    const fbResult = await fbResponse.json();

    if (!fbResponse.ok) {
      console.error("Facebook CAPI error:", fbResult);
      return NextResponse.json({ 
        success: false, 
        error: fbResult.error?.message || "Failed to send event" 
      }, { status: 500 });
    }

    console.log(`FB Event sent: ${eventName}`, fbResult);
    
    return NextResponse.json({ 
      success: true, 
      events_received: fbResult.events_received,
      fbtrace_id: fbResult.fbtrace_id
    });

  } catch (error: any) {
    console.error("FB Events API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({ 
    status: "Facebook Conversions API ready",
    pixel_id: PIXEL_ID,
    events: [
      "PageView",
      "ViewContent", 
      "AddToCart",
      "InitiateCheckout",
      "AddPaymentInfo",
      "Purchase",
      "Subscribe",
      "CompleteRegistration",
      "Contact",
      "Lead",
      "StartTrial"
    ]
  });
}

