# 🚂 Railway Deployment Guide - Redicate FiveM Website

## 📋 Oversigt
Denne guide hjælper dig med at deploye din FiveM website til Railway Pro.

**Stack:**
- Backend: FastAPI (Python)
- Frontend: React
- Database: MongoDB Atlas
- Discord Bot: Inkluderet i backend

---

## 🎯 FASE 1: MongoDB Atlas Setup (GRATIS)

### Step 1: Opret MongoDB Atlas Konto
1. Gå til: https://www.mongodb.com/cloud/atlas/register
2. Sign up med email eller Google
3. Vælg **FREE tier (M0)**

### Step 2: Opret Database Cluster
1. Klik "Build a Database"
2. Vælg **FREE (Shared) tier**
3. Vælg region: **Europe (Frankfurt eller Amsterdam)**
4. Cluster Name: `Redicate-FiveM`
5. Klik "Create"

### Step 3: Opret Database User
1. Under "Security" → "Database Access"
2. Klik "Add New Database User"
3. Username: `redicate_admin`
4. Password: **Generer en stærk password (gem den!)**
5. Database User Privileges: "Read and write to any database"
6. Klik "Add User"

### Step 4: Whitelist IP Addresses
1. Under "Security" → "Network Access"
2. Klik "Add IP Address"
3. Vælg **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Dette er sikkert fordi Railway IP'er ændrer sig
4. Klik "Confirm"

### Step 5: Få Connection String
1. Klik "Connect" på dit cluster
2. Vælg "Connect your application"
3. Driver: **Python** / Version: **3.11 or later**
4. Copy connection string:
   ```
   mongodb+srv://redicate_admin:<password>@redicate-fivem.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Erstat `<password>` med din faktiske password**
6. **Gem denne connection string!**

---

## 🚂 FASE 2: Railway Setup

### Step 1: Opret Railway Konto
1. Gå til: https://railway.app
2. Sign up med **GitHub** (anbefalet)
3. Verify din email

### Step 2: Upgrade til Pro Plan
1. Gå til Settings → Account
2. Klik "Upgrade to Pro"
3. Tilføj betalingsmetode
4. **Pris: $20/måned** (inkluderer $20 credit)

### Step 3: Push Kode til GitHub
⚠️ **VIGTIGT:** Brug Emergent "Save to GitHub" feature først!

1. På Emergent platform:
   - Klik "Save to GitHub"
   - Opret nyt repository: `redicate-fivem-website`
   - Confirm

2. Gå til dit GitHub repo og verificer koden er der

---

## 🎯 FASE 3: Deploy Backend til Railway

### Step 1: Opret Nyt Projekt
1. På Railway dashboard, klik "New Project"
2. Vælg "Deploy from GitHub repo"
3. Vælg: `redicate-fivem-website`
4. Railway scanner repo...

### Step 2: Tilføj Backend Service
1. Klik "Add Service" → "GitHub Repo"
2. Vælg din repo
3. **Root Directory:** `/backend`
4. Service Name: `redicate-backend`

### Step 3: Konfigurer Backend Environment Variables
1. Klik på `redicate-backend` service
2. Gå til "Variables" tab
3. Tilføj følgende variabler:

```
MONGO_URL=mongodb+srv://redicate_admin:DIN_PASSWORD@redicate-fivem.xxxxx.mongodb.net/redicate_fivem?retryWrites=true&w=majority
DB_NAME=redicate_fivem

DISCORD_CLIENT_ID=1443501738899406858
DISCORD_CLIENT_SECRET=pbarWZGMqG8Hv9beLhFIsprjK_Fte3YW
DISCORD_REDIRECT_URI=https://redicate-backend-production.up.railway.app/auth/callback

DISCORD_BOT_TOKEN=MTQ0MzUwMTczODg5OTQwNjg1OA.GjFsO5.0BrK24YekHz-zh7OyuHavL4Vt-zLRKTjsnC69Y

DISCORD_ADMIN_ROLE_ID=1337859475184291922
DISCORD_HEAD_ADMIN_ROLE_ID=1337859466544021561
DISCORD_GUILD_ID=1205895441796038656
DISCORD_CHANNEL_ID=1337859648136417385

DISCORD_PERM_STAFF_ROLE_ID=1337859475184291922
DISCORD_RANK_MOD_ELEV=1337859474077122572
DISCORD_RANK_MODERATOR=1337859473473146973
DISCORD_RANK_ADMINISTRATOR=1337859471874985986
DISCORD_RANK_SENIOR_ADMIN=1337859471082389671
DISCORD_FIRING_APPROVER_ROLE_ID=1443527392583745617

CORS_ORIGINS=https://redicate-frontend-production.up.railway.app
PORT=8001
```

⚠️ **VIGTIGT:** 
- Erstat `DIN_PASSWORD` med din MongoDB password
- `DISCORD_REDIRECT_URI` og `CORS_ORIGINS` skal opdateres efter du får dine Railway URLs

### Step 4: Deploy Backend
1. Klik "Deploy"
2. Vent 2-5 minutter
3. Når det er færdigt, får du en URL som: `redicate-backend-production.up.railway.app`
4. **GEM DENNE URL!**

### Step 5: Opdater Discord OAuth Redirect URI
1. Gå til Discord Developer Portal: https://discord.com/developers/applications
2. Vælg din application
3. OAuth2 → Redirects
4. Tilføj: `https://redicate-backend-production.up.railway.app/auth/callback`
5. Save

### Step 6: Opdater Backend Environment Variables
1. Tilbage på Railway, gå til backend Variables
2. Opdater:
   ```
   DISCORD_REDIRECT_URI=https://redicate-backend-production.up.railway.app/auth/callback
   ```
3. Backend vil automatisk redeploy

---

## 🎨 FASE 4: Deploy Frontend til Railway

### Step 1: Tilføj Frontend Service
1. I samme Railway projekt, klik "New Service"
2. Vælg "GitHub Repo"
3. Vælg din repo
4. **Root Directory:** `/frontend`
5. Service Name: `redicate-frontend`

### Step 2: Konfigurer Frontend Environment Variables
1. Klik på `redicate-frontend` service
2. Gå til "Variables" tab
3. Tilføj:

```
REACT_APP_BACKEND_URL=https://redicate-backend-production.up.railway.app
PORT=3000
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

⚠️ **Brug din faktiske backend URL fra Step 3.4**

### Step 3: Deploy Frontend
1. Klik "Deploy"
2. Vent 3-5 minutter (React build tager længere tid)
3. Når det er færdigt, får du en URL som: `redicate-frontend-production.up.railway.app`
4. **DET ER DIN HJEMMESIDE URL!** 🎉

### Step 4: Opdater Backend CORS
1. Gå tilbage til backend service → Variables
2. Opdater:
   ```
   CORS_ORIGINS=https://redicate-frontend-production.up.railway.app
   ```
3. Backend vil redeploy

---

## 🎯 FASE 5: Test Alt Virker

### Test Checklist:

1. **Frontend Loading:**
   - [ ] Gå til din frontend URL
   - [ ] Hjemmeside loader korrekt
   - [ ] Ingen "Made with Emergent" watermark! 🎉

2. **Discord Login:**
   - [ ] Klik "Log ind med Discord"
   - [ ] Discord OAuth virker
   - [ ] Du bliver redirected tilbage
   - [ ] Du er logget ind

3. **Backend API:**
   - [ ] Åbn din backend URL + `/docs`
   - [ ] FastAPI Swagger docs vises

4. **Database:**
   - [ ] Log ind på siden
   - [ ] Submit en test ansøgning
   - [ ] Gå til MongoDB Atlas → Collections
   - [ ] Se data er saved

5. **Discord Bot:**
   - [ ] Check Discord server
   - [ ] Bot er online (grøn status)
   - [ ] Test en staff ansøgning approval
   - [ ] Head admin får DM

6. **Admin Features:**
   - [ ] Gå til Admin Panel
   - [ ] Godkend en ansøgning
   - [ ] Check Head Admin Panel
   - [ ] Test strikes/noter/uprank
   - [ ] Verificer Discord roller opdateres

---

## 🔧 FASE 6: Custom Domain (Valgfrit)

### Step 1: Køb Domain
- Namecheap, GoDaddy, eller Cloudflare

### Step 2: Tilføj Custom Domain til Railway
1. Frontend service → Settings → Domains
2. Klik "Add Domain"
3. Indtast: `www.redicaterp.dk` (eller dit domain)
4. Railway giver dig DNS records

### Step 3: Opdater DNS
1. Gå til din domain provider
2. Tilføj CNAME record:
   ```
   www → redicate-frontend-production.up.railway.app
   ```
3. Vent 10-60 minutter for DNS propagation

### Step 4: Opdater Environment Variables
1. Backend → Variables:
   ```
   CORS_ORIGINS=https://www.redicaterp.dk
   DISCORD_REDIRECT_URI=https://api.redicaterp.dk/auth/callback
   ```

2. Frontend → Variables:
   ```
   REACT_APP_BACKEND_URL=https://api.redicaterp.dk
   ```

3. Discord Developer Portal:
   - Opdater OAuth redirect til: `https://api.redicaterp.dk/auth/callback`

---

## 💰 FASE 7: Overvåg Forbrug

### Check Dit Usage:
1. Railway Dashboard → Project
2. Se "Usage" widget
3. Monitor hvor meget af $20 credit du bruger

**Forventet forbrug (per måned):**
- Backend: $5-7
- Frontend: $2-3
- Discord Bot: Inkluderet i backend
- **Total: ~$7-10** (under de $20 credit!)

### Cost Optimization Tips:
- Brug MongoDB Atlas FREE tier (spar $10/måned)
- Slet old deployments hvis Railway storage fylder
- Monitor logs for errors (kan spare CPU)

---

## 🆘 Troubleshooting

### Problem: Backend kan ikke starte
**Løsning:**
1. Check Railway logs: Backend service → Logs
2. Verificer alle environment variables er sat
3. Check MongoDB connection string er korrekt

### Problem: Frontend viser "Connection Error"
**Løsning:**
1. Verificer `REACT_APP_BACKEND_URL` peger på backend URL
2. Check backend er deployed og running
3. Verificer CORS er konfigureret korrekt

### Problem: Discord Bot offline
**Løsning:**
1. Check `DISCORD_BOT_TOKEN` i backend variables
2. Verificer bot har correct permissions i Discord
3. Check backend logs for Discord errors

### Problem: Login virker ikke
**Løsning:**
1. Verificer `DISCORD_REDIRECT_URI` i både:
   - Railway backend variables
   - Discord Developer Portal
2. Check de matcher EKSAKT (inkl. https://)

---

## 📞 Support

Hvis du støder på problemer:

1. **Railway Community:** https://discord.gg/railway
2. **MongoDB Support:** https://www.mongodb.com/support
3. **Emergent Support:** I chatten her!

---

## ✅ Deployment Complete!

Når alt virker:
- ✅ Hjemmeside live på Railway
- ✅ Ingen watermark
- ✅ Custom domain (valgfrit)
- ✅ Discord bot kører 24/7
- ✅ Stabil og hurtig
- ✅ Kun $10-15/måned

**Tillykke! Din FiveM website er nu live! 🎉🚀**

---

## 📝 Quick Reference

**Railway URLs:**
- Dashboard: https://railway.app/dashboard
- Docs: https://docs.railway.app

**MongoDB Atlas:**
- Dashboard: https://cloud.mongodb.com

**Discord Developer:**
- Portal: https://discord.com/developers/applications

**Support Links:**
- Railway Discord: https://discord.gg/railway
- MongoDB Docs: https://docs.mongodb.com
