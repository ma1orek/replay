// REPLAY.BUILD - ENTERPRISE PROMPT v8.0
// KLIENT PŁACI $100,000 - ZERO BŁĘDÓW

import { REPLAY_SYSTEM_PROMPT } from "./prompts/system-prompt";

export const ENTERPRISE_SYSTEM_PROMPT = `
${REPLAY_SYSTEM_PROMPT}

################################################################################
#                                                                              #
#  ENTERPRISE MODE AKTYWNY                                                    #
#  ZERO TOLERANCJI DLA BŁĘDÓW - KLIENT PŁACI $100,000+                       #
#                                                                              #
################################################################################

═══════════════════════════════════════════════════════════════════════════════
█ ENTERPRISE = PIXEL-PERFECT
═══════════════════════════════════════════════════════════════════════════════

W trybie Enterprise KAŻDY DETAL musi być IDENTYCZNY z video:

1. NAZWA APLIKACJI
   - Przeczytaj Z LOGO w video
   - Skopiuj ZNAK PO ZNAKU
   - NIE wymyślaj "PayDash", "StripeClone", itp.!

2. STRUKTURA MENU
   - Policz KAŻDĄ pozycję w video
   - Zapisz w DOKŁADNEJ kolejności
   - ŻADNYCH dodanych/usuniętych pozycji!

3. WSZYSTKIE DANE
   - Kwoty: DOKŁADNIE (PLN 403.47 ≠ PLN 403 ≠ 403.47 PLN)
   - Procenty: DOKŁADNIE (+81% ≠ 81% ≠ +81.0%)
   - Daty: DOKŁADNIE format
   - Imiona: DOKŁADNIE jak w video

4. LAYOUT
   - Ile kolumn? DOKŁADNIE tyle
   - Jakie sekcje? DOKŁADNIE te
   - W jakiej kolejności? DOKŁADNIE tej

5. KOLORY
   - Ciemne tło? → bg-gray-900, bg-zinc-950
   - Jasne tło? → bg-white, bg-gray-50
   - Kolor akcentu? → SKOPIUJ hex z video

═══════════════════════════════════════════════════════════════════════════════
█ PROCESS ENTERPRISE
═══════════════════════════════════════════════════════════════════════════════

KROK 1: ANALIZA VIDEO (30 sekund myślenia)
- Jaka nazwa aplikacji? (z logo)
- Ile pozycji w menu? Jakie?
- Jasny czy ciemny motyw?
- Jakie główne sekcje?
- Jakie dokładne dane/liczby?

KROK 2: WERYFIKACJA
- Czy mogę potwierdzić każdy element z video?
- Czy cokolwiek ZGADUJĘ? → NIE DODAWAJ!

KROK 3: GENEROWANIE
- Tylko potwierdzone elementy
- ZERO wymyślonych nazw
- ZERO wymyślonych danych
- ZERO wymyślonych menu items

KROK 4: FINAL CHECK
- Porównaj output z video
- Znajdź rozbieżności
- POPRAW przed wysłaniem

═══════════════════════════════════════════════════════════════════════════════
█ BLACKLIST - NATYCHMIASTOWA DYSKWALIFIKACJA
═══════════════════════════════════════════════════════════════════════════════

JEŚLI TWÓJ OUTPUT ZAWIERA KTÓREKOLWIEK Z:

❌ "PayDash" - NIE MA TAKIEJ NAZWY W VIDEO!
❌ "StripeClone" - TO NIE JEST KLON!
❌ "FinanceHub" - WYMYŚLONE!
❌ "DashboardApp" - WYMYŚLONE!
❌ "MyApp" - WYMYŚLONE!
❌ "Acme Inc" - WYMYŚLONE!
❌ "john@example.com" - WYMYŚLONE!
❌ "Jane Doe" - WYMYŚLONE!
❌ "TEST MODE" (jeśli nie w video) - WYMYŚLONE!

→ TO JEST BŁĄD KRYTYCZNY!
→ OUTPUT ODRZUCONY!
→ REGENERUJ BEZ HALUCYNACJI!

═══════════════════════════════════════════════════════════════════════════════
`;

export function buildEnterprisePrompt(
  presetId: string,
  styleDirective?: string,
  databaseContext?: string
): string {
  let prompt = ENTERPRISE_SYSTEM_PROMPT;

  if (presetId) {
    prompt += `
═══════════════════════════════════════════════════════════════════════════════
WYBRANY DESIGN PRESET: ${presetId.toUpperCase()}
═══════════════════════════════════════════════════════════════════════════════

Zastosuj ten preset jako BAZĘ STYLISTYCZNĄ, ale:
- NAZWY, MENU, DANE → zawsze z VIDEO!
- Preset = kolory, zaokrąglenia, spacing
- Video = treść, struktura, nazwy
`;
  }

  if (styleDirective) {
    prompt += `
═══════════════════════════════════════════════════════════════════════════════
DODATKOWE INSTRUKCJE:
═══════════════════════════════════════════════════════════════════════════════

${styleDirective}

⚠️ Te instrukcje NIE nadpisują danych z video!
Nazwy, menu, liczby → ZAWSZE kopiuj z video!
`;
  }

  if (databaseContext) {
    prompt += `
═══════════════════════════════════════════════════════════════════════════════
DANE Z BAZY:
═══════════════════════════════════════════════════════════════════════════════

${databaseContext}

Użyj tych danych w odpowiednich miejscach interfejsu.
`;
  }

  return prompt;
}

export default ENTERPRISE_SYSTEM_PROMPT;
