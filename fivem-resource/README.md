# Redicate Admin Panel - FiveM Integration

## Installation

1. **Kopier `redicate-admin` mappen til din FiveM server resources folder:**
   ```
   /path/to/your/fivem/server/resources/redicate-admin/
   ```

2. **Tilføj til din `server.cfg`:**
   ```
   ensure redicate-admin
   ```

3. **Restart din FiveM server**

## Funktioner

✅ **Online Spillere** - Se alle spillere der er online
✅ **Kick** - Kick spillere fra serveren
✅ **Ban** - Ban spillere (permanent eller midlertidig)
✅ **Teleport** - Teleporter spillere til koordinater
✅ **Heal** - Heal spillere (health + armor)
✅ **Announcements** - Send beskeder til alle spillere

## Endpoints

Resourcen lytter på følgende HTTP endpoints:

- `GET /players.json` - Hent liste over online spillere
- `POST /admin/kick` - Kick en spiller
- `POST /admin/ban` - Ban en spiller
- `POST /admin/teleport` - Teleporter en spiller
- `POST /admin/heal` - Heal en spiller
- `POST /admin/announce` - Send announcement

## Sikkerhed

⚠️ **VIGTIGT:** 
- Kun brugere med admin rolle på websitet kan bruge panelet
- Husk at sikre din FiveM server's HTTP endpoints
- Overvej at tilføje IP whitelist for ekstra sikkerhed

## Support

Hvis du har problemer:
1. Check FiveM server console for fejl
2. Verificer at resourcen er startet: `ensure redicate-admin`
3. Test endpoints direkte: `curl http://45.84.198.57:30120/players.json`

## Changelog

### Version 1.0.0
- Initial release
- Basic admin functions implemented
