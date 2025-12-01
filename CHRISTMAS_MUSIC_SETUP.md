# Setup Guide: All I Want for Christmas Music

## Hvor Skal Du Placere Musik Filen?

### Option 1: Local File (Anbefalet for Railway)

1. **Placér filen:**
   ```
   /app/frontend/public/christmas-music.mp3
   ```

2. **Filen er allerede konfigureret i koden:**
   ```javascript
   audio.src = '/christmas-music.mp3';
   ```

3. **Upload til Railway:**
   - Gem filen i `/app/frontend/public/`
   - Commit via "Save to GitHub"
   - Railway deployer automatisk

### Option 2: CDN/External URL

1. **Upload til CDN (Cloudflare, AWS S3, etc.)**

2. **Opdater `ChristmasMusic.js`:**
   ```javascript
   audio.src = 'https://your-cdn.com/all-i-want-for-christmas.mp3';
   ```

## Vigtige Overvejelser

### Fil Format
- **Anbefalet:** MP3 (bedste browser support)
- **Alternative:** OGG, WAV
- **Fil størrelse:** Hold under 5MB for bedre loading

### Kvalitet vs Størrelse
- **128 kbps** - God kvalitet, mindre fil (anbefalet)
- **192 kbps** - Bedre kvalitet, større fil
- **320 kbps** - Bedst kvalitet, stor fil (ikke anbefalet for web)

### Copyright & Licensing
✅ Du har sagt I har fået lov til at bruge sangen
- Sørg for licensen dækker web streaming
- Gem dokumentation for licensen

## Test Efter Upload

1. **Local test:**
   ```bash
   # Check filen findes
   ls -lh /app/frontend/public/christmas-music.mp3
   ```

2. **Browser test:**
   - Åbn website
   - Klik på musik knappen (bund højre)
   - Verificer musik starter

3. **Fejlfinding:**
   - Åbn browser console (F12)
   - Se efter fejl relateret til audio
   - Check network tab for 404 errors

## Hvordan Uploade Til Production

### Via GitHub:
1. Placér `christmas-music.mp3` i `/app/frontend/public/`
2. Klik "Save to GitHub" i Emergent
3. Railway deployer automatisk
4. Musik er nu tilgængelig på live site!

### Via Railway CLI:
```bash
# Upload direkte til Railway volume (avanceret)
railway up
```

## Alternative: Streaming Services

Hvis du vil bruge Spotify/YouTube/Apple Music:

### Spotify Web Playback SDK:
- Kræver Spotify Premium konto
- Mere kompleks implementation
- Se: https://developer.spotify.com/documentation/web-playback-sdk/

### YouTube Embed:
- Kan ikke auto-play uden user interaction
- Mindre diskret end audio player

### Anbefaling:
Brug lokal MP3 fil for bedst kontrol og bruger oplevelse.

## Nuværende Setup

**Musik Kontrol Placering:**
- Fixed position: Bottom right
- Gradient baggrund: Rød → Grøn
- Gul border
- Play/Pause toggle
- Volume slider

**Features:**
- ✅ Loop musik (spiller i loop)
- ✅ Volume kontrol (0-100%)
- ✅ Bruger kan slukke når som helst
- ✅ Starter pauset (bruger skal selv starte)
- ✅ Persistent under navigation

## Browser Compatibility

Musik virker i:
- ✅ Chrome/Edge (alle versioner)
- ✅ Firefox (alle versioner)
- ✅ Safari (desktop & mobile)
- ✅ Opera
- ⚠️ IE11 (kun MP3)

## Performance Tips

1. **Preload:**
   - Musik loader kun når knap klikkes
   - Ingen impact på initial page load

2. **Caching:**
   - Browser cacher filen efter første load
   - Hurtigere ved gentagne besøg

3. **File Size:**
   - Anbefaling: 2-4 MB MP3
   - 128kbps giver god kvalitet ved ~1MB per minut

## Support

Hvis musik ikke virker:
1. Check browser console for fejl
2. Verificer fil path er korrekt
3. Test i different browser
4. Check fil format er supported

---

**Næste Skridt:**
Upload din `christmas-music.mp3` fil til `/app/frontend/public/` og deploy! 🎵🎄
