# Report Punishment System Guide

## Oversigt
Dette system giver staff mulighed for at foreslå straffe via website, som derefter skal godkendes af admins via Discord før de eksekveres.

## Hvordan Det Virker

### 1. Staff Foreslår Straf
1. Staff logger ind på website
2. Går til "Mine Rapporter" 
3. Åbner en rapport
4. Vælger straf:
   - **⚠️ Advarsel** - 1 warning (ingen varighed)
   - **🔨 Ban** - med varighed (1 time → Permanent)
   - **ℹ️ Ingen Straf** - afviser rapport uden straf
5. Tilføjer staff notater
6. Klikker "Opdater Rapport & Send Notifikationer"

### 2. Discord Punishment Channel
Når staff foreslår en straf, sendes en besked til Discord kanalen `1444094682253492401` med:

**Embed indeholder:**
- 👤 Rapporteret spiller navn
- 🔨 Straf type (Ban/Advarsel)
- ⏰ Varighed (kun for bans)
- 📝 Beskrivelse af overtrædelse
- 🔗 Bevis links
- 👮 Staff medlem der foreslog straffen
- 📋 Rapport ID

**To knapper:**
- ✅ **Godkend Straf** (Grøn)
- ❌ **Afvis Straf** (Rød)

### 3. Admin Godkender/Afviser

**Hvis GODKEND:**
- Embed farve → Grøn
- Footer opdateres: "✅ GODKENDT af [admin navn] - [dato tid]"
- Knapper fjernes
- Reporter får Discord DM: "Din rapport - Straf godkendt"
- Admin skal nu manuelt eksekvere straffen i spillet

**Hvis AFVIS:**
- Embed farve → Grå
- Footer opdateres: "❌ AFVIST af [admin navn] - [dato tid]"
- Knapper fjernes
- Reporter får Discord DM: "Din rapport - Straf afvist"
- Ingen straf gives

### 4. Reporter Notifikation

Reporter modtager Discord DM ved:
- **Status opdatering** - Når report status ændres
- **Straf foreslået** - Når staff foreslår en straf (inkl. i status DM)
- **Straf godkendt** - Når admin godkender
- **Straf afvist** - Når admin afviser

## Warning System

**Vigtigt:**
- Warnings = **altid kun 1 warning**
- Ingen varighed på warnings
- Label viser: "⚠️ Advarsel (1 Warning)"
- Varighed dropdown vises ikke når warning er valgt

## Ban System

**Varighed options:**
- 1 Time
- 6 Timer
- 1 Dag
- 3 Dage
- 7 Dage
- 14 Dage
- 30 Dage
- Permanent

## Setup Requirements

### Railway Environment Variables
```
DISCORD_BOT_TOKEN=<din_bot_token>
DISCORD_PUNISHMENT_CHANNEL_ID=1444094682253492401
```

### Discord Bot Permissions
- Send Messages
- Embed Links
- Read Message History
- Use Application Commands
- Add Reactions

### Discord Developer Portal
1. Enable "Message Content Intent"
2. Verify bot has access to punishment channel
3. Bot skal være inviteret til serveren

## Admin Workflow

### Best Practice for Admins:

1. **Review Report**
   - Læs rapport i Discord embed
   - Tjek bevis (links i embed)
   - Vurder om straf er passende

2. **Beslut**
   - Godkend hvis bevis er klart og straf passende
   - Afvis hvis ikke nok bevis eller forkert straf

3. **Efter Godkendelse**
   - Gå til dit admin panel (FiveM, TxAdmin, etc.)
   - Eksekvér straffen manuelt
   - Verificer at spilleren har modtaget straffen

4. **Tracking**
   - Report er opdateret i database
   - Reporter er notificeret
   - Discord embed viser hvem der godkendte/afviste

## Troubleshooting

### Problem: Ingen beskeder i Discord kanal
**Check:**
1. Railway logs for "[PUNISHMENT ERROR]"
2. Bot token er valid
3. Kanal ID er korrekt (1444094682253492401)
4. Bot har adgang til kanalen

### Problem: Knapper virker ikke
**Check:**
1. Bot har "Use Application Commands" permission
2. Message Content Intent er enabled
3. Bot var online da beskeden blev sendt
4. Prøv at sende en ny punishment

### Problem: Reporter får ikke DM
**Check:**
1. Reporter har åbnet DMs fra server members
2. Bot token er valid
3. Check Railway logs for fejl

## Notes

- Database tracker alle straffe og godkendelser
- Embed opdateres permanent når godkendt/afvist
- Reporter kan altid se status på "Mine Rapporter" siden
- Admins ser hvem der godkendte/afviste i embed footer

## Support

Check Railway logs for detaljeret debugging:
```
[PUNISHMENT] - Punishment flow logs
[PUNISHMENT ERROR] - Fejl beskeder
```

Hvis problemer fortsætter, verificer:
- Discord bot token
- Bot permissions
- Channel access
- Environment variables
