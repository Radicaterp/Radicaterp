# ✅ Railway Deployment Checklist

Print eller gem denne checklist og afkryds efterhånden!

## 📋 FØR DU STARTER

- [ ] Læs hele `RAILWAY_DEPLOYMENT_GUIDE.md`
- [ ] Forbered 30-60 minutter til setup
- [ ] Hav Discord credentials klar
- [ ] Sørg for du har adgang til Discord Developer Portal

---

## 🗄️ MONGODB ATLAS SETUP

- [ ] Opret MongoDB Atlas konto
- [ ] Opret FREE M0 cluster
- [ ] Vælg Europe region (Frankfurt/Amsterdam)
- [ ] Opret database user (username + password)
- [ ] Whitelist "Allow from Anywhere" (0.0.0.0/0)
- [ ] Få connection string
- [ ] Erstat `<password>` i connection string
- [ ] Test connection string virker
- [ ] **GEM CONNECTION STRING ET SIKKERT STED**

---

## 🚂 RAILWAY ACCOUNT SETUP

- [ ] Opret Railway konto (med GitHub)
- [ ] Verify email
- [ ] Upgrade til Pro Plan ($20/måned)
- [ ] Tilføj betalingsmetode
- [ ] Verificer Pro plan er aktiv

---

## 📦 GITHUB REPOSITORY

- [ ] Brug Emergent "Save to GitHub" feature
- [ ] Navngiv repo: `redicate-fivem-website`
- [ ] Verificer al kode er pushed til GitHub
- [ ] Check både `/backend` og `/frontend` mapper er der

---

## 🔧 BACKEND DEPLOYMENT

- [ ] Opret nyt Railway projekt
- [ ] Tilføj service fra GitHub repo
- [ ] Set root directory til `/backend`
- [ ] Navngiv service: `redicate-backend`

### Environment Variables:
- [ ] MONGO_URL (fra MongoDB Atlas)
- [ ] DB_NAME
- [ ] DISCORD_CLIENT_ID
- [ ] DISCORD_CLIENT_SECRET
- [ ] DISCORD_REDIRECT_URI (opdater senere)
- [ ] DISCORD_BOT_TOKEN
- [ ] DISCORD_ADMIN_ROLE_ID
- [ ] DISCORD_HEAD_ADMIN_ROLE_ID
- [ ] DISCORD_GUILD_ID
- [ ] DISCORD_CHANNEL_ID
- [ ] DISCORD_PERM_STAFF_ROLE_ID
- [ ] DISCORD_RANK_MOD_ELEV
- [ ] DISCORD_RANK_MODERATOR
- [ ] DISCORD_RANK_ADMINISTRATOR
- [ ] DISCORD_RANK_SENIOR_ADMIN
- [ ] DISCORD_FIRING_APPROVER_ROLE_ID
- [ ] CORS_ORIGINS (opdater senere)
- [ ] PORT=8001

### Deploy:
- [ ] Klik "Deploy"
- [ ] Vent til deployment er færdig
- [ ] Få backend URL (gem den!)
- [ ] Test backend URL + `/docs` virker

---

## 🎮 DISCORD OAUTH UPDATE

- [ ] Gå til Discord Developer Portal
- [ ] Vælg din application
- [ ] OAuth2 → Redirects
- [ ] Tilføj Railway backend URL + `/auth/callback`
- [ ] Save changes

### Opdater Backend Variables:
- [ ] DISCORD_REDIRECT_URI = din Railway backend URL + `/auth/callback`
- [ ] Backend vil auto-redeploy

---

## 🎨 FRONTEND DEPLOYMENT

- [ ] Tilføj ny service i samme Railway projekt
- [ ] Vælg GitHub repo
- [ ] Set root directory til `/frontend`
- [ ] Navngiv service: `redicate-frontend`

### Environment Variables:
- [ ] REACT_APP_BACKEND_URL (din backend URL)
- [ ] PORT=3000
- [ ] REACT_APP_ENABLE_VISUAL_EDITS=false
- [ ] ENABLE_HEALTH_CHECK=false

### Deploy:
- [ ] Klik "Deploy"
- [ ] Vent til React build er færdig (3-5 min)
- [ ] Få frontend URL (din hjemmeside!)
- [ ] **GEM FRONTEND URL**

---

## 🔄 FINAL BACKEND CORS UPDATE

- [ ] Gå til backend service → Variables
- [ ] Opdater CORS_ORIGINS til din frontend URL
- [ ] Backend vil auto-redeploy
- [ ] Vent til deployment færdig

---

## ✅ TESTING

### Frontend:
- [ ] Åbn frontend URL i browser
- [ ] Hjemmeside loader
- [ ] Navigation virker
- [ ] Ingen "Made with Emergent" watermark
- [ ] Design ser korrekt ud

### Login:
- [ ] Klik "Log ind med Discord"
- [ ] Discord OAuth popup vises
- [ ] Authorize app
- [ ] Redirect tilbage til site
- [ ] Du er nu logget ind
- [ ] Dit brugernavn vises i navbar

### Backend API:
- [ ] Åbn backend URL + `/docs`
- [ ] FastAPI Swagger UI vises
- [ ] Prøv et endpoint (f.eks. `/api/auth/me`)

### Database:
- [ ] Gå til MongoDB Atlas dashboard
- [ ] Browse Collections
- [ ] Se `users` collection
- [ ] Din bruger er gemt efter login

### Discord Bot:
- [ ] Check Discord server
- [ ] Bot har grøn status (online)
- [ ] Bot har korrekte permissions

### Admin Features:
- [ ] Log ind som admin
- [ ] Gå til Admin Panel (dropdown)
- [ ] Se ansøgninger tab
- [ ] Se rapporter tab

### Head Admin Features:
- [ ] Log ind som head admin
- [ ] Gå til Head Admin Panel
- [ ] Se dit team
- [ ] Klik "Administrér" på et medlem
- [ ] Test tilføj note
- [ ] Test tilføj strike
- [ ] Test uprank

### Discord Integration:
- [ ] Godkend en staff ansøgning
- [ ] Check head admin får Discord DM
- [ ] Verificer staff medlem får Discord rolle
- [ ] Test staff har korrekt rank rolle

---

## 🌐 CUSTOM DOMAIN (VALGFRIT)

- [ ] Køb domain (f.eks. redicaterp.dk)
- [ ] Tilføj custom domain i Railway (frontend)
- [ ] Få DNS records fra Railway
- [ ] Opdater DNS hos domain provider
- [ ] Vent på DNS propagation (10-60 min)
- [ ] Opdater backend CORS_ORIGINS
- [ ] Opdater frontend REACT_APP_BACKEND_URL
- [ ] Opdater Discord OAuth redirect URI
- [ ] Test custom domain virker

---

## 💰 MONITORING

- [ ] Check Railway Usage dashboard
- [ ] Verificer du er under $20/måned
- [ ] Set up billing alerts (valgfrit)
- [ ] Monitor MongoDB Atlas storage

**Forventet månedlig kostnad: $7-15**

---

## 🎉 DEPLOYMENT COMPLETE!

Når alle ovenstående er ✅:

**Din FiveM website er nu live! 🚀**

- Hjemmeside: `https://your-frontend-url.railway.app`
- Backend API: `https://your-backend-url.railway.app`
- Database: MongoDB Atlas (gratis)
- Discord Bot: Kører 24/7
- Kostnad: ~$10-15/måned
- Ingen watermark!

---

## 📞 HAR DU PROBLEMER?

1. Læs Troubleshooting sektion i `RAILWAY_DEPLOYMENT_GUIDE.md`
2. Check Railway logs for errors
3. Join Railway Discord: https://discord.gg/railway
4. Spørg i Emergent chat

**Held og lykke med deployment! 🎯**
