# TxAdmin Integration Setup Guide

## Oversigt
Dette system integrerer automatisk straffe (warns og bans) fra report systemet direkte til TxAdmin, så spillere modtager deres straf automatisk når de joiner serveren.

## Setup Trin

### 1. Få TxAdmin API Key

1. Log ind på din TxAdmin panel (typisk `http://din-server-ip:40120`)
2. Gå til **Settings** → **Admin Manager**
3. Find eller opret en admin konto til API adgang
4. Kopiér API Token/Key

### 2. Opdater Railway Environment Variables

Tilføj følgende environment variables i Railway:

```
TXADMIN_URL=http://din-server-ip:40120
TXADMIN_API_KEY=din_api_key_her
```

**Vigtigt:** Hvis din FiveM server og Redicate website kører på samme netværk, kan du bruge:
```
TXADMIN_URL=http://localhost:40120
```

### 3. Discord Bot Permissions

Sørg for at din Discord bot har følgende permissions i serveren:

- **Send Messages** (i punishment kanalen)
- **Embed Links**
- **Use Application Commands**
- **Read Message History**

### 4. Test Integration

Efter deployment kan du teste systemet:

1. Opret en test report via hjemmesiden
2. Log ind som staff og behandl reporten
3. Vælg en straf (Ban eller Warn)
4. Tjek Discord kanalen `1444094682253492401` - der skulle nu være et embed med **Godkend/Afvis** knapper
5. Klik på en af knapperne for at teste callback

## Hvordan Det Virker

### Report Flow
```
1. Bruger opretter report
   ↓
2. Staff behandler report og vælger straf
   ↓
3. Straf sendes til Discord punishment kanal med knapper
   ↓
4. Admin klikker "Godkend" eller "Afvis"
   ↓
5a. GODKEND: TxAdmin API kalder warn/ban
5b. AFVIS: Ingen action, reporter får besked
   ↓
6. Reporter modtager DM om beslutningen
   ↓
7. Næste gang spilleren joiner: TxAdmin viser warning/ban
```

### Warning System
- **Warnings er permanente** - De fjernes ikke automatisk
- Spilleren ser warning beskeden hver gang de joiner
- Warnings kan kun fjernes manuelt via TxAdmin panel

### Ban System  
- Ban varighed sættes i report systemet (1 time, 1 dag, 7 dage, permanent, etc.)
- TxAdmin executor bannet automatisk
- Spilleren kan ikke joine serveren før ban udløber

## Discord Punishment Channel Features

### Embed Information
- 👤 Rapporteret spiller
- 🔨 Straf type (BAN/ADVARSEL)
- ⏰ Varighed (hvis relevant)
- 📝 Beskrivelse af overtrædelse
- 🔗 Bevis links
- 👮 Staff medlem der foreslog straffen
- 📋 Rapport ID

### Interactive Buttons
- ✅ **Godkend Straf** (Grøn knap)
  - Eksekverer straffen via TxAdmin
  - Opdaterer embed footer med godkender navn
  - Sender besked til reporter
  - Fjerner knapper
  
- ❌ **Afvis Straf** (Rød knap)
  - Ingen straf gives
  - Opdaterer embed footer med afviser navn
  - Sender besked til reporter
  - Fjerner knapper

## Reporter Notifikationer

Reporter får Discord DM ved:

1. **Status opdatering** - Når report status ændres
2. **Straf forslag** - Når staff foreslår en straf (inkluderet i status opdatering)
3. **Straf godkendt** - Når admin godkender straffen
4. **Straf afvist** - Når admin afviser straffen

## Troubleshooting

### Problem: "TxAdmin API key not configured"
**Løsning:** Tjek at `TXADMIN_API_KEY` er sat i Railway environment variables

### Problem: "Punishment channel not found"
**Løsning:** 
- Tjek at Discord bot er inviteret til serveren
- Tjek at kanalen med ID `1444094682253492401` eksisterer
- Verificer bot har adgang til kanalen

### Problem: TxAdmin API fejl
**Løsning:**
- Verificer TxAdmin URL er korrekt
- Tjek at API key er valid
- Sørg for at TxAdmin er online og tilgængelig
- Tjek TxAdmin logs for fejl

### Problem: Knapper virker ikke
**Løsning:**
- Discord bot skal have været online da beskeden blev sendt
- Genstart backend hvis bot lige er startet
- Tjek at bot har message content intent enabled

## Warnings vs Bans

### Når bruger Warn:
- Mindre overtrædelser (FailRP, metagaming, minor RDM)
- Første gangs-overtrædelser
- Situationer hvor du vil advare først

### Når bruger Ban:
- Alvorlige overtrædelser (Mass RDM, hacking, griefing)
- Gentagne overtrædelser efter warns
- Zero-tolerance overtrædelser

## Notes til Admins

- **Warnings fjernes IKKE automatisk** - Tjek TxAdmin panel for at se spillers warning historik
- Når du godkender en warn, får spilleren beskeden næste gang de joiner
- Godkend kun straffe hvis du har reviewet beviser grundigt
- Afvis straffe hvis der ikke er nok bevis eller kontekst

## Support

Hvis du oplever problemer med TxAdmin integration:
1. Tjek Railway logs for backend fejl
2. Tjek TxAdmin logs for API fejl
3. Verificer alle environment variables er sat korrekt
4. Test Discord bot permissions
