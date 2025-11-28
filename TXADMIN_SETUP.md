# TxAdmin Manuel Punishment System

## Oversigt
Dette system giver et streamlined workflow hvor staff foreslår straffe via report systemet, admins godkender/afviser via Discord buttons, og derefter eksekverer straffen manuelt i TxAdmin med en autogenereret command.

## Setup Trin

### 1. Discord Bot Permissions

Sørg for at din Discord bot har følgende permissions i serveren:

- **Send Messages** (i punishment kanalen)
- **Embed Links**
- **Use Application Commands**
- **Read Message History**

### 2. Test System

Efter deployment kan du teste systemet:

1. Opret en test report via hjemmesiden
2. Log ind som staff og behandl reporten
3. Vælg en straf (Ban eller Warn)
4. Tjek Discord kanalen `1444094682253492401` - der skulle nu være et embed med **Godkend/Afvis** knapper
5. Klik **Godkend** - du får en TxAdmin command i en privat besked
6. Gå til TxAdmin console og kør command'en

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
5a. GODKEND: 
    - Discord embed opdateres med TxAdmin command
    - Admin får command i privat besked
    - Reporter får DM om godkendelse
    - Admin går til TxAdmin og kører command
5b. AFVIS: 
    - Ingen action
    - Reporter får besked
   ↓
6. Spilleren får warn/ban næste gang de joiner
```

### Warning System
- **Warnings er permanente** - De fjernes ikke automatisk
- Spilleren ser warning beskeden hver gang de joiner
- Warnings kan kun fjernes manuelt via TxAdmin panel

### Ban System  
- Ban varighed sættes i report systemet (1 time, 1 dag, 7 dage, permanent, etc.)
- System genererer TxAdmin command med korrekt syntax
- Admin kører command i TxAdmin console
- Spilleren kan ikke joine serveren før ban udløber

### TxAdmin Commands Generated

**Warning:**
```
/warn [player_name] [reason]
```

**Ban:**
```
/ban [player_name] [duration] [reason]
```

Eksempler:
- `/warn JohnDoe RDM i Legion Square`
- `/ban JaneDoe 7 dage Massevis af RDM`
- `/ban BadPlayer perm Hacking og griefing`

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

### Problem: "Punishment channel not found"
**Løsning:** 
- Tjek at Discord bot er inviteret til serveren
- Tjek at kanalen med ID `1444094682253492401` eksisterer
- Verificer bot har adgang til kanalen

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
- Når du godkender en warn, får du TxAdmin command - HUSK at køre den i TxAdmin!
- Godkend kun straffe hvis du har reviewet beviser grundigt
- Afvis straffe hvis der ikke er nok bevis eller kontekst
- **Vigtigt:** Discord giver dig command når du godkender - kopiér og kør den i TxAdmin console
- Gem en log af eksekverede straffe for tracking

## Workflow Best Practice

1. **Review Report:** Læs rapport, tjek bevis
2. **Klik Godkend/Afvis:** I Discord punishment channel
3. **Kopiér Command:** Fra den private besked du får
4. **Åbn TxAdmin:** Gå til din TxAdmin console
5. **Kør Command:** Paste og enter
6. **Verificer:** Tjek at straffen er registreret i TxAdmin
7. **Test:** Tjek at spilleren får warn/ban når de joiner

## Support

Hvis du oplever problemer:
1. Tjek Railway logs for backend fejl
2. Verificer Discord bot permissions
3. Test Discord button callbacks
4. Verificer TxAdmin er online og tilgængelig
