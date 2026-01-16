// Facebook Pixel & Conversions API Tracking Helper
// Meta Pixel ID: REDACTED_FB_PIXEL_ID
// All standard events: https://developers.facebook.com/docs/meta-pixel/reference

declare global {
  interface Window {
    fbq: any;
  }
}

// All Meta Pixel Standard Events
type EventName = 
  | "PageView"              // Wyświetlenie strony (automatyczne)
  | "ViewContent"           // Wyświetlenie zawartości
  | "AddToCart"             // Dodanie do koszyka
  | "AddToWishlist"         // Dodanie do listy życzeń
  | "InitiateCheckout"      // Zainicjowanie przejścia do kasy
  | "AddPaymentInfo"        // Dodanie informacji o płatności
  | "Purchase"              // Zakup
  | "Subscribe"             // Subskrypcja
  | "StartTrial"            // Rozpoczęcie okresu próbnego
  | "CompleteRegistration"  // Ukończenie rejestracji
  | "Contact"               // Kontakt
  | "Lead"                  // Pozyskanie kontaktu
  | "Search"                // Wyszukiwanie
  | "FindLocation"          // Znalezienie lokalizacji
  | "Schedule"              // Harmonogram/Spotkanie
  | "CustomizeProduct"      // Personalizacja produktu
  | "Donate"                // Przekazanie datku
  | "SubmitApplication";    // Przesłanie wniosku

interface TrackOptions {
  // User data (hashed by CAPI)
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  
  // Event data
  value?: number;
  currency?: string;
  contentName?: string;
  contentCategory?: string;
  contentIds?: string[];
  contentType?: string;
  status?: string;
  searchString?: string;
  numItems?: number;
  predicted_ltv?: number;
}

// Generate unique event ID for deduplication
function generateEventId(eventName: string): string {
  return `${eventName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to get cookie by name
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
}

// Track event on both Pixel (client) and CAPI (server) with deduplication
export async function trackFBEvent(
  eventName: EventName, 
  options: TrackOptions = {}
): Promise<void> {
  const eventId = generateEventId(eventName);
  
  // 1. Track with Pixel (client-side) - with eventID for deduplication
  if (typeof window !== "undefined" && window.fbq) {
    const pixelParams: Record<string, any> = {};
    
    if (options.value !== undefined) pixelParams.value = options.value;
    if (options.currency) pixelParams.currency = options.currency || "USD";
    if (options.contentName) pixelParams.content_name = options.contentName;
    if (options.contentCategory) pixelParams.content_category = options.contentCategory;
    if (options.contentIds) pixelParams.content_ids = options.contentIds;
    if (options.contentType) pixelParams.content_type = options.contentType;
    if (options.status) pixelParams.status = options.status;
    if (options.searchString) pixelParams.search_string = options.searchString;
    if (options.numItems !== undefined) pixelParams.num_items = options.numItems;
    if (options.predicted_ltv !== undefined) pixelParams.predicted_ltv = options.predicted_ltv;
    
    // Track with eventID for deduplication
    window.fbq("track", eventName, pixelParams, { eventID: eventId });
  }

  // 2. Send to Conversions API (server-side)
  try {
    const fbc = getCookie("_fbc");
    const fbp = getCookie("_fbp");

    await fetch("/api/fb-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        email: options.email,
        phone: options.phone,
        firstName: options.firstName,
        lastName: options.lastName,
        userId: options.userId,
        sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        eventId, // Same ID for deduplication
        fbc,
        fbp,
        customData: {
          currency: options.currency || "USD",
          value: options.value,
          content_name: options.contentName,
          content_category: options.contentCategory,
          content_ids: options.contentIds,
          content_type: options.contentType,
          status: options.status,
          search_string: options.searchString,
          num_items: options.numItems,
          predicted_ltv: options.predicted_ltv,
        },
      }),
    });
  } catch (error) {
    console.warn("FB CAPI tracking failed:", error);
    // Don't throw - tracking should never break the app
  }
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS FOR SPECIFIC EVENTS
// ═══════════════════════════════════════════════════════════════

/** 
 * ViewContent - Wyświetlenie zawartości
 * Użyj gdy: użytkownik wchodzi na stronę produktu/toola
 */
export function trackViewContent(contentName?: string, userId?: string, email?: string) {
  return trackFBEvent("ViewContent", { 
    contentName: contentName || "Replay Tool",
    contentCategory: "video-to-code",
    userId,
    email
  });
}

/** 
 * AddToCart - Dodanie do koszyka
 * Użyj gdy: użytkownik rozpoczyna generację (zużywa kredyty)
 */
export function trackAddToCart(contentName: string, value?: number, userId?: string, email?: string) {
  return trackFBEvent("AddToCart", { 
    contentName,
    contentCategory: "ai-generation",
    value,
    currency: "USD",
    userId,
    email
  });
}

/** 
 * AddToWishlist - Dodanie do listy życzeń
 * Użyj gdy: użytkownik zapisuje projekt do późniejszej edycji
 */
export function trackAddToWishlist(contentName: string, userId?: string) {
  return trackFBEvent("AddToWishlist", { 
    contentName,
    contentCategory: "project",
    userId 
  });
}

/** 
 * InitiateCheckout - Zainicjowanie kasy
 * Użyj gdy: użytkownik klika "Upgrade" lub wybiera plan
 */
export function trackInitiateCheckout(value: number, contentName: string, userId?: string, email?: string) {
  return trackFBEvent("InitiateCheckout", { 
    value,
    currency: "USD",
    contentName,
    userId,
    email
  });
}

/** 
 * AddPaymentInfo - Dodanie informacji o płatności
 * Użyj gdy: użytkownik przechodzi do Stripe/wpisuje dane karty
 */
export function trackAddPaymentInfo(userId?: string, email?: string) {
  return trackFBEvent("AddPaymentInfo", { userId, email });
}

/** 
 * Purchase - Zakup
 * Użyj gdy: transakcja zakończona sukcesem (webhook Stripe)
 */
export function trackPurchase(value: number, contentName: string, userId?: string, email?: string) {
  return trackFBEvent("Purchase", { 
    value,
    currency: "USD",
    contentName,
    userId,
    email 
  });
}

/** 
 * Subscribe - Subskrypcja
 * Użyj gdy: użytkownik kupuje plan Pro (webhook Stripe)
 */
export function trackSubscribe(value: number, userId?: string, email?: string) {
  return trackFBEvent("Subscribe", { 
    value,
    currency: "USD",
    userId,
    email,
    contentName: "Replay Pro Subscription"
  });
}

/** 
 * StartTrial - Rozpoczęcie okresu próbnego
 * Użyj gdy: nowy użytkownik otrzymuje darmowe kredyty
 */
export function trackStartTrial(userId?: string, email?: string) {
  return trackFBEvent("StartTrial", { 
    userId, 
    email,
    value: 0,
    currency: "USD"
  });
}

/** 
 * CompleteRegistration - Ukończenie rejestracji
 * Użyj gdy: użytkownik kończy rejestrację (OAuth/email)
 * Value = predicted LTV of a free user signup ($5 estimated)
 */
export function trackCompleteRegistration(email?: string, userId?: string) {
  return trackFBEvent("CompleteRegistration", { 
    email,
    userId,
    status: "completed",
    value: 5.00,       // Predicted value of a new signup (for ROAS optimization)
    currency: "USD"
  });
}

/** 
 * Contact - Kontakt
 * Użyj gdy: użytkownik wysyła feedback lub kontaktuje się
 */
export function trackContact(userId?: string, email?: string) {
  return trackFBEvent("Contact", { userId, email });
}

/** 
 * Lead - Pozyskanie kontaktu
 * Użyj gdy: użytkownik zapisuje się na newsletter/early access
 */
export function trackLead(email?: string, userId?: string, contentName?: string) {
  return trackFBEvent("Lead", { 
    email, 
    userId,
    contentName: contentName || "Replay Lead"
  });
}

/** 
 * Search - Wyszukiwanie
 * Użyj gdy: użytkownik wyszukuje w aplikacji
 */
export function trackSearch(searchString: string, userId?: string) {
  return trackFBEvent("Search", { 
    searchString,
    userId 
  });
}

/** 
 * Schedule - Zaplanowanie spotkania
 * Użyj gdy: użytkownik umawia się na demo/konsultację
 */
export function trackSchedule(userId?: string, email?: string) {
  return trackFBEvent("Schedule", { userId, email });
}

/** 
 * SubmitApplication - Przesłanie wniosku
 * Użyj gdy: użytkownik aplikuje o Enterprise/specjalny dostęp
 */
export function trackSubmitApplication(contentName: string, userId?: string, email?: string) {
  return trackFBEvent("SubmitApplication", { 
    contentName,
    userId,
    email
  });
}

// ═══════════════════════════════════════════════════════════════
// REPLAY-SPECIFIC EVENT ALIASES (SaaS Funnel)
// ═══════════════════════════════════════════════════════════════

/** 
 * SaaS Funnel dla Replay:
 * 1. PageView (auto) → ViewContent (tool)
 * 2. CompleteRegistration (signup)
 * 3. InitiateCheckout (pricing click)
 * 4. Purchase (transaction complete)
 * 
 * NIE używamy AddToCart - to dla e-commerce, nie SaaS!
 */

/** Rozpoczęcie generacji = ViewContent (użytkownik korzysta z toola) */
export const trackStartGeneration = (userId?: string, email?: string) => 
  trackViewContent("Video-to-Code Generation", userId, email);

/** Zakończenie generacji = ViewContent z nazwą projektu */
export const trackGenerationComplete = (projectName: string, userId?: string, email?: string) => 
  trackViewContent(`Generated: ${projectName}`, userId, email);

/** Publikacja projektu = Lead (wartościowa akcja pokazująca zaangażowanie) */
export const trackPublishProject = (projectName: string, userId?: string, email?: string) => 
  trackLead(email, userId, `Published: ${projectName}`);

/** Upgrade do Pro = InitiateCheckout */
export const trackUpgradeClick = (plan: string, value: number, userId?: string, email?: string) => 
  trackInitiateCheckout(value, `Upgrade to ${plan}`, userId, email);

/** Zakup kredytów = Purchase */
export const trackCreditsPurchase = (value: number, credits: number, userId?: string, email?: string) => 
  trackPurchase(value, `${credits} Credits Top-up`, userId, email);

/** Klik w cennik/pricing = InitiateCheckout z niską wartością (pokazuje intencję) */
export const trackPricingClick = (userId?: string, email?: string) =>
  trackInitiateCheckout(0, "Viewed Pricing", userId, email);

