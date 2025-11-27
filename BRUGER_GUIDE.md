# REDICATE RP - Bruger Guide

## 🎮 Systemet

Din FiveM server hjemmeside er nu live med fuld Discord integration!

### 🔗 URL
**Hjemmeside:** https://redicate-hub.preview.emergentagent.com

---

## 👥 Bruger Roller

Systemet har 4 roller med forskellige rettigheder:

1. **Player** (Spiller)
   - Kan se teams
   - Kan sende ansøgninger
   - Kan se egne ansøgninger

2. **Staff** (Staff medlem)
   - Alle player rettigheder
   - Er medlem af staff teamet

3. **Head Admin**
   - Alle staff rettigheder
   - Kan godkende/afvise ansøgninger
   - Kan oprette nye teams
   - Kan administrere team medlemmer
   - Se statistikker

4. **Owner** (Ejer)
   - Alle rettigheder
   - Kan ændre bruger roller
   - Fuld system kontrol

---

## 🎯 Features

### For Alle Brugere:
- ✅ **Discord Login** - Sikker login via Discord OAuth
- ✅ **Se Teams** - Vis alle tilgængelige teams og jobs
- ✅ **Ansøg** - Send ansøgning til whitelist jobs eller staff team
- ✅ **Mine Ansøgninger** - Se status på egne ansøgninger

### For Admins (Head Admin + Owner):
- ✅ **Admin Panel** - Administrer ansøgninger og teams
- ✅ **Opret Teams** - Lav nye whitelist jobs eller staff teams
- ✅ **Godkend/Afvis** - Behandl ansøgninger
- ✅ **Team Management** - Tilføj/fjern medlemmer
- ✅ **Statistikker** - Se brugere, teams, ansøgninger

### For Owner:
- ✅ **Ejer Panel** - Fuld bruger administration
- ✅ **Roller Management** - Forfrem/degrader brugere
- ✅ **System Kontrol** - Total kontrol over systemet

---

## 🚀 Sådan Kommer Du I Gang

### 1. Log Ind Som Ejer

1. Gå til hjemmesiden
2. Klik på "Log ind med Discord"
3. Godkend Discord tilladelser
4. Du er nu logget ind!

### 2. Gør Dig Selv Til Ejer

Da du er den første bruger, skal du manuelt sætte din rolle til "owner":

**Find din Discord ID:**
1. I Discord: Højreklik på dig selv → "Kopier bruger-ID"
2. Eller brug denne kommando på serveren:

```bash
# Opdater rolle via MongoDB direkte
python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def set_owner():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['redicate_rp']
    
    # Find din bruger (efter første login)
    users = await db.users.find({}).to_list(10)
    for user in users:
        print(f"Bruger: {user['username']} (ID: {user['discord_id']})")
    
    # Opdater til owner (erstat DISCORD_ID med din ID)
    discord_id = "DIN_DISCORD_ID_HER"
    result = await db.users.update_one(
        {"discord_id": discord_id},
        {"$set": {"role": "owner"}}
    )
    print(f"\nOpdateret {result.modified_count} bruger til owner")
    
    client.close()

asyncio.run(set_owner())
EOF
```

### 3. Opret Teams

1. Gå til **Admin Panel**
2. Klik på **"Opret Team"** fanen
3. Udfyld:
   - **Navn**: f.eks. "Politi", "EMS", "Mekaniker"
   - **Beskrivelse**: Hvad teamet laver
   - **Type**: "Whitelist" for jobs, "Staff" for staff team
   - **Icon**: En emoji som 👮 🚑 🔧
   - **Farve**: Vælg en farve for teamet
4. Klik **"Opret Team"**

**Eksempler:**
- **Politi**: 👮 (whitelist) - "Håndhæv loven"
- **EMS**: 🚑 (whitelist) - "Redningsarbejde"
- **Mekaniker**: 🔧 (whitelist) - "Reparer køretøjer"
- **Staff**: ⚙️ (staff) - "Server administration"

### 4. Behandl Ansøgninger

1. Gå til **Admin Panel** → **"Ansøgninger"** fanen
2. Se alle afventende ansøgninger
3. Klik **"Se Detaljer"** for at læse ansøgningen
4. Klik **"Godkend"** eller **"Afvis"**

**Når du godkender:**
- **Staff ansøgning** → Bruger får "staff" rolle + tilføjes til team
- **Whitelist ansøgning** → Bruger tilføjes til teamet

### 5. Administrer Brugere (Kun Owner)

1. Gå til **Ejer Panel**
2. Vælg en bruger fra listen
3. Vælg ny rolle: Player, Staff, Head Admin, eller Owner
4. Klik **"Opdater Rolle"**

---

## 🎨 Design

Systemet har et moderne gaming design med:
- 🎨 **Redicate Blå** (#4A90E2) som primær farve
- 🌙 **Dark Theme** for gaming atmosfære
- ✨ **Glassmorphism** effekter
- 🎯 **Smooth Animations** på alle interaktioner
- 📱 **Responsive Design** - virker på mobil, tablet og desktop

---

## 🔐 Sikkerhed

- ✅ Discord OAuth for sikker login
- ✅ Session-based authentication
- ✅ Role-based access control
- ✅ Alle data er Discord ID baseret
- ✅ Protected routes og API endpoints

---

## 🗄️ Database

**MongoDB Collections:**
- `users` - Bruger data med Discord info og roller
- `teams` - Alle teams/jobs (staff og whitelist)
- `applications` - Alle ansøgninger med status

**Database Navn:** redicate_rp
**MongoDB URL:** mongodb://localhost:27017

---

## 🛠️ Teknisk Info

**Backend:**
- FastAPI (Python)
- MongoDB (Motor driver)
- Discord OAuth2
- Endpoint prefix: `/api`

**Frontend:**
- React 19
- Shadcn UI Components
- Tailwind CSS
- Axios

**Discord Integration:**
- Client ID: 1443501738899406858
- Redirect URI: https://redicate-hub.preview.emergentagent.com/auth/callback

---

## 📋 Test Data

Systemet kommer med 4 pre-oprettede teams:
1. 👮 **Politi** (whitelist)
2. 🚑 **EMS** (whitelist)
3. 🔧 **Mekaniker** (whitelist)
4. ⚙️ **Staff Team** (staff)

Du kan slette eller redigere disse efter behov.

---

## 💡 Tips

1. **Gør trusted brugere til Head Admin** så de kan hjælpe med ansøgninger
2. **Opret flere whitelist jobs** baseret på din server setup
3. **Tjek "Mine Ansøgninger"** på dashboard for at se ansøgningsstatus
4. **Brug Ejer Panel** til at promovere dine admins

---

## 📞 Support

Ved tekniske problemer:
1. Tjek backend logs: `tail -f /var/log/supervisor/backend.err.log`
2. Tjek frontend logs: `tail -f /var/log/supervisor/frontend.err.log`
3. Tjek MongoDB connection: Database skal køre på `mongodb://localhost:27017`

---

**Systemet er klar til brug! God fornøjelse med din Redicate RP server! 🎮**
