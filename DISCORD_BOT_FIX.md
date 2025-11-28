# 🔴 KRITISK: Discord Bot Token Problem

## Problem
Discord beskeder sendes IKKE fordi bot token er invalid/udløbet.

**Fejl i logs:**
```
discord.errors.LoginFailure: Improper token has been passed.
```

## Hvorfor Påvirker Det Systemet?

Når Discord bot token er invalid, virker IKKE følgende:
- ❌ Punishment channel beskeder (godkend/afvis knapper)
- ❌ Reporter DM notifikationer
- ❌ Strike DM notifikationer
- ❌ Staff transfer notifikationer
- ❌ Application status notifikationer
- ❌ Firing request buttons

## Løsning: Opdater Discord Bot Token

### Step 1: Få Ny Bot Token

1. Gå til [Discord Developer Portal](https://discord.com/developers/applications)
2. Vælg din application (Redicate bot)
3. Gå til **Bot** sektion
4. Klik **Reset Token** (eller **Copy** hvis token aldrig er blevet brugt)
5. Kopiér den nye token

**VIGTIGT:** Gem token sikkert - du kan kun se den én gang!

### Step 2: Opdater Railway Environment Variable

1. Log ind på Railway
2. Gå til dit Redicate backend projekt
3. Klik på **Variables** tab
4. Find `DISCORD_BOT_TOKEN`
5. Klik **Edit** og indsæt den nye token
6. Klik **Save**

**Railway vil automatisk redeploy backend med den nye token.**

### Step 3: Verificer Bot Permissions

Sørg for at botten har følgende permissions i Discord serveren:

**Required Permissions:**
- ✅ Read Messages/View Channels
- ✅ Send Messages
- ✅ Embed Links
- ✅ Attach Files
- ✅ Read Message History
- ✅ Use External Emojis
- ✅ Add Reactions
- ✅ Use Application Commands

**Kanal Adgang:**
Bot skal have adgang til:
- Punishment channel (ID: 1444094682253492401)
- Firing channel (ID: 1443666133336195143)
- General announcement channel

### Step 4: Test Efter Opdatering

1. **Vent 2-3 minutter** efter Railway redeploy
2. Gå til Railway → Backend → **Logs**
3. Se efter denne besked:
   ```
   Discord bot logged in as [BotName]#1234
   ```

4. **Test systemet:**
   - Opret en test report
   - Vælg en straf (Ban eller Warn)
   - Tjek om besked vises i Discord punishment channel

## Fejlfinding

### Problem: "Discord bot not ready" i logs
**Løsning:** 
- Bot token er stadig invalid
- Dobbelttjek at du kopierede hele token (ingen mellemrum)
- Prøv at regenerate token igen

### Problem: Bot logger ind, men sender ikke beskeder
**Løsning:**
- Tjek bot permissions i Discord server
- Verificer bot har adgang til kanalerne
- Tjek at kanal ID'er er korrekte i Railway vars

### Problem: Knapper virker ikke
**Løsning:**
- Bot skal have "Use Application Commands" permission
- Bot skal have været online da beskeden blev sendt
- Prøv at sende en ny punishment efter bot er online

## Hvad Virker Nu (Uden Bot Token)

✅ **Virker:**
- Website login
- Report oprettelse
- Report visning
- Staff behandling af reports
- Database lagring
- Frontend UI

❌ **Virker IKKE (Kræver valid bot token):**
- Discord notifikationer
- Discord buttons (godkend/afvis)
- DM beskeder til brugere

## Efter Token Er Opdateret

Når bot token er opdateret og backend er redeployed:

1. ✅ Punishment channel vil modtage beskeder
2. ✅ Godkend/Afvis knapper vil virke
3. ✅ Reporter får DM om status
4. ✅ Admin får TxAdmin command i privat besked
5. ✅ Alle Discord integrationer virker

## Kontakt Support

Hvis du stadig har problemer efter at have opdateret token:
1. Check Railway backend logs for fejl
2. Verificer bot permissions i Discord
3. Test med en simpel Discord bot command først
4. Kontakt Emergent support hvis problemet fortsætter

---

**Husk:** Bot token skal holdes hemmelig! Del den aldrig i public channels eller commits.
