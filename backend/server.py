from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, BackgroundTasks
from fastapi.responses import RedirectResponse, JSONResponse, HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import secrets
import discord
import asyncio
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Discord Config
DISCORD_CLIENT_ID = os.environ.get('DISCORD_CLIENT_ID')
DISCORD_CLIENT_SECRET = os.environ.get('DISCORD_CLIENT_SECRET')
DISCORD_REDIRECT_URI = os.environ.get('DISCORD_REDIRECT_URI')
DISCORD_BOT_TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
DISCORD_SUPER_ADMIN_ROLE_ID = os.environ.get('DISCORD_SUPER_ADMIN_ROLE_ID', '1443527392583745617')
DISCORD_HEAD_ADMIN_ROLE_ID = os.environ.get('DISCORD_HEAD_ADMIN_ROLE_ID', '1337859466544021561')
DISCORD_ADMIN_ROLE_ID = os.environ.get('DISCORD_ADMIN_ROLE_ID', '1443661551142965459')
DISCORD_STAFF_MEMBER_ROLE_ID = os.environ.get('DISCORD_STAFF_MEMBER_ROLE_ID', '1337859475184291922')
DISCORD_PROBATION_ROLE_ID = os.environ.get('DISCORD_PROBATION_ROLE_ID', '1443679804946907147')
DISCORD_GUILD_ID = os.environ.get('DISCORD_GUILD_ID')
DISCORD_CHANNEL_ID = os.environ.get('DISCORD_CHANNEL_ID')
DISCORD_FIRING_CHANNEL_ID = os.environ.get('DISCORD_FIRING_CHANNEL_ID', '1443666133336195143')
DISCORD_FIRING_APPROVER_USER_ID = os.environ.get('DISCORD_FIRING_APPROVER_USER_ID', '1087427288544579705')
DISCORD_PUNISHMENT_CHANNEL_ID = os.environ.get('DISCORD_PUNISHMENT_CHANNEL_ID', '1444094682253492401')
DISCORD_API_ENDPOINT = 'https://discord.com/api/v10'

# Staff rank role IDs
DISCORD_PERM_STAFF_ROLE_ID = os.environ.get('DISCORD_PERM_STAFF_ROLE_ID')
DISCORD_RANK_MOD_ELEV = os.environ.get('DISCORD_RANK_MOD_ELEV')
DISCORD_RANK_MODERATOR = os.environ.get('DISCORD_RANK_MODERATOR')
DISCORD_RANK_ADMINISTRATOR = os.environ.get('DISCORD_RANK_ADMINISTRATOR')
DISCORD_RANK_SENIOR_ADMIN = os.environ.get('DISCORD_RANK_SENIOR_ADMIN')

RANK_TO_ROLE_ID = {
    "mod_elev": DISCORD_RANK_MOD_ELEV,
    "moderator": DISCORD_RANK_MODERATOR,
    "administrator": DISCORD_RANK_ADMINISTRATOR,
    "senior_admin": DISCORD_RANK_SENIOR_ADMIN
}

# TxAdmin Config
TXADMIN_URL = os.environ.get('TXADMIN_URL', 'http://localhost:40120')
TXADMIN_API_KEY = os.environ.get('TXADMIN_API_KEY', '')

# Session storage
sessions = {}

# Pending punishments storage (for Discord button callbacks)
pending_punishments = {}

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Discord Bot for sending embeds
discord_bot_client = None
discord_bot_ready = False

class PunishmentView(discord.ui.View):
    """Discord View for punishment approval buttons"""
    def __init__(self, punishment_id: str):
        super().__init__(timeout=None)  # No timeout
        self.punishment_id = punishment_id
    
    @discord.ui.button(label="Godkend Straf", style=discord.ButtonStyle.green, custom_id="approve_punishment", emoji="✅")
    async def approve_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.handle_punishment_decision(interaction, True)
    
    @discord.ui.button(label="Afvis Straf", style=discord.ButtonStyle.red, custom_id="reject_punishment", emoji="❌")
    async def reject_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.handle_punishment_decision(interaction, False)
    
    async def handle_punishment_decision(self, interaction: discord.Interaction, approved: bool):
        """Handle punishment approval/rejection"""
        try:
            # Get punishment details
            punishment_data = pending_punishments.get(self.punishment_id)
            if not punishment_data:
                await interaction.response.send_message("❌ Straf data ikke fundet!", ephemeral=True)
                return
            
            # Update punishment in database
            await db.reports.update_one(
                {"id": punishment_data["report_id"]},
                {"$set": {
                    "punishment_approved": approved,
                    "punishment_approved_by": interaction.user.name,
                    "punishment_approved_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            if approved:
                # Generate TxAdmin command
                txadmin_cmd = generate_txadmin_command(
                    punishment_data["reported_player"],
                    punishment_data["punishment_type"],
                    punishment_data["punishment_duration"],
                    punishment_data["description"][:100]  # Limit reason length
                )
                
                # Update embed to show approved with command
                embed = interaction.message.embeds[0]
                embed.color = discord.Color.green()
                
                # Add TxAdmin command field
                embed.add_field(
                    name="🎮 TxAdmin Command",
                    value=f"```{txadmin_cmd}```\n**Gå til TxAdmin og kør denne command!**",
                    inline=False
                )
                
                embed.set_footer(text=f"✅ GODKENDT af {interaction.user.name} - Nu skal straffen eksekveres i TxAdmin")
                
                # Notify reporter
                await send_punishment_decision_to_reporter(
                    punishment_data["reporter_id"],
                    punishment_data["reported_player"],
                    True,
                    interaction.user.name
                )
                
                await interaction.response.edit_message(embed=embed, view=None)
                await interaction.followup.send(
                    f"✅ Straf godkendt!\n\n**TxAdmin Command:**\n```{txadmin_cmd}```\nKopiér og kør denne command i TxAdmin console.", 
                    ephemeral=True
                )
            else:
                # Update embed to show rejected
                embed = interaction.message.embeds[0]
                embed.color = discord.Color.grey()
                embed.set_footer(text=f"❌ AFVIST af {interaction.user.name} - {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')}")
                
                # Notify reporter
                await send_punishment_decision_to_reporter(
                    punishment_data["reporter_id"],
                    punishment_data["reported_player"],
                    False,
                    interaction.user.name
                )
                
                await interaction.response.edit_message(embed=embed, view=None)
                await interaction.followup.send(f"❌ Straf afvist!", ephemeral=True)
            
            # Remove from pending
            pending_punishments.pop(self.punishment_id, None)
            
        except Exception as e:
            print(f"Error handling punishment decision: {e}")
            await interaction.response.send_message(f"❌ Fejl: {str(e)}", ephemeral=True)

class DiscordBot(discord.Client):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(intents=intents)
    
    async def on_ready(self):
        global discord_bot_ready
        discord_bot_ready = True
        print(f'Discord bot logged in as {self.user}')

async def init_discord_bot():
    global discord_bot_client
    if DISCORD_BOT_TOKEN and not discord_bot_client:
        discord_bot_client = DiscordBot()
        asyncio.create_task(discord_bot_client.start(DISCORD_BOT_TOKEN))

async def send_discord_embed(user_id: str, username: str, app_type: str, status: str, reviewed_by: str, head_admin_id: str = None, team_name: str = None):
    """Send Discord embed notification"""
    if not discord_bot_client or not discord_bot_ready:
        print("Discord bot not ready")
        return
    
    try:
        # Get the specific channel
        channel = discord_bot_client.get_channel(int(DISCORD_CHANNEL_ID))
        if not channel:
            print(f"Channel {DISCORD_CHANNEL_ID} not found")
            return
        
        # Create embed
        color = discord.Color.green() if status == "approved" else discord.Color.red()
        status_text = "✅ GODKENDT" if status == "approved" else "❌ AFVIST"
        
        embed = discord.Embed(
            title=f"{status_text} - {app_type} Ansøgning",
            description=f"<@{user_id}> din ansøgning til **{app_type}** er blevet {status_text.lower()}!",
            color=color,
            timestamp=datetime.now(timezone.utc)
        )
        embed.add_field(name="Ansøger", value=username, inline=True)
        embed.add_field(name="Ansøgningstype", value=app_type, inline=True)
        embed.add_field(name="Status", value=status_text, inline=True)
        embed.add_field(name="Behandlet af", value=reviewed_by, inline=False)
        
        # If approved staff application, add team info
        if status == "approved" and app_type.lower() == "staff" and head_admin_id and team_name:
            embed.add_field(
                name="📋 Dit Team", 
                value=f"**{team_name}**\nDin Head Admin: <@{head_admin_id}>", 
                inline=False
            )
        
        embed.set_footer(text="Redicate RP", icon_url="https://customer-assets.emergentagent.com/job_team-management-10/artifacts/pa8pgywq_7442CFA2-6A1F-48F7-81A5-9E9889D2D616-removebg-preview.png")
        
        await channel.send(embed=embed)
        print(f"Sent Discord embed for {username}")
        
        # Also send DM to approved staff member
        if status == "approved" and app_type.lower() == "staff" and head_admin_id and team_name:
            try:
                user = await discord_bot_client.fetch_user(int(user_id))
                if user:
                    dm_embed = discord.Embed(
                        title="🎉 Velkommen til Staff Teamet!",
                        description=f"Tillykke **{username}**! Du er nu en del af staff teamet.",
                        color=discord.Color.blue(),
                        timestamp=datetime.now(timezone.utc)
                    )
                    dm_embed.add_field(name="📋 Dit Team", value=team_name, inline=True)
                    dm_embed.add_field(name="👤 Din Head Admin", value=f"<@{head_admin_id}>", inline=True)
                    dm_embed.add_field(
                        name="📝 Næste Skridt", 
                        value="• Kontakt din Head Admin for onboarding\n• Få tildelt dine opgaver\n• Start din staff træning", 
                        inline=False
                    )
                    dm_embed.set_footer(text="Redicate RP Staff System")
                    
                    await user.send(embed=dm_embed)
                    print(f"Sent DM to {username} with team info")
            except Exception as dm_error:
                print(f"Could not send DM to {username}: {dm_error}")
        
    except Exception as e:
        print(f"Failed to send Discord embed: {e}")

def generate_txadmin_command(player_name: str, punishment_type: str, duration: str, reason: str) -> str:
    """Generate TxAdmin command for manual execution"""
    if punishment_type == "warn":
        # Warnings are always just 1 warning - no duration
        return f"/warn {player_name} {reason}"
    elif punishment_type == "ban":
        # Convert duration to TxAdmin format
        if "permanent" in duration.lower():
            return f"/ban {player_name} perm {reason}"
        else:
            return f"/ban {player_name} {duration} {reason}"
    return ""

async def send_punishment_decision_to_reporter(reporter_id: str, reported_player: str, approved: bool, decided_by: str):
    """Notify reporter about punishment decision"""
    if not discord_bot_client or not discord_bot_ready:
        return
    
    try:
        reporter_user = await discord_bot_client.fetch_user(int(reporter_id))
        if not reporter_user:
            return
        
        if approved:
            embed = discord.Embed(
                title="✅ Din Rapport - Straf Godkendt",
                description=f"Straffen for **{reported_player}** er blevet godkendt af en administrator.",
                color=discord.Color.green(),
                timestamp=datetime.now(timezone.utc)
            )
            embed.add_field(name="👮 Godkendt af", value=decided_by, inline=False)
            embed.add_field(
                name="📋 Næste Skridt", 
                value="Straffen vil blive eksekveret af staff i TxAdmin. Spilleren vil modtage straffen næste gang de joiner serveren.", 
                inline=False
            )
        else:
            embed = discord.Embed(
                title="❌ Din Rapport - Straf Afvist",
                description=f"Straffen for **{reported_player}** er blevet afvist af en administrator.",
                color=discord.Color.red(),
                timestamp=datetime.now(timezone.utc)
            )
            embed.add_field(name="👮 Afvist af", value=decided_by, inline=False)
            embed.add_field(
                name="📋 Årsag", 
                value="Straffen blev vurderet som ikke passende for denne overtrædelse, eller der var ikke tilstrækkeligt bevis.", 
                inline=False
            )
        
        embed.set_footer(text="Redicate Report System")
        await reporter_user.send(embed=embed)
        
    except Exception as e:
        print(f"Error sending decision to reporter: {e}")

async def send_punishment_to_channel(report_id: str, reported_player: str, report_type: str, punishment_type: str, punishment_duration: str, handled_by: str, description: str, evidence: str = None, reporter_id: str = None):
    """Send punishment notification to Discord punishment channel with approval buttons"""
    print(f"[PUNISHMENT] Attempting to send punishment to channel for {reported_player}")
    print(f"[PUNISHMENT] Bot client exists: {discord_bot_client is not None}, Bot ready: {discord_bot_ready}")
    
    if not discord_bot_client or not discord_bot_ready:
        print("[PUNISHMENT ERROR] Discord bot not ready - bot token may be invalid!")
        print("[PUNISHMENT ERROR] Punishment notification cannot be sent. Please update DISCORD_BOT_TOKEN in Railway.")
        return
    
    try:
        # Get the punishment channel
        channel = discord_bot_client.get_channel(int(DISCORD_PUNISHMENT_CHANNEL_ID))
        if not channel:
            print(f"Punishment channel {DISCORD_PUNISHMENT_CHANNEL_ID} not found")
            return
        
        # Set color and emoji based on punishment type
        if punishment_type == "ban":
            color = discord.Color.red()
            punishment_emoji = "🔨"
            punishment_text = "BAN"
        elif punishment_type == "warn":
            color = discord.Color.orange()
            punishment_emoji = "⚠️"
            punishment_text = "ADVARSEL (1 WARNING)"
            # Force warnings to have no duration - always just 1 warning
            punishment_duration = None
        else:
            color = discord.Color.grey()
            punishment_emoji = "ℹ️"
            punishment_text = "Ingen Straf"
        
        # Create embed
        embed = discord.Embed(
            title=f"{punishment_emoji} {punishment_text} - {reported_player}",
            description=f"**Rapport Type:** {report_type}\n\n⚠️ Kræver godkendelse før eksekvering",
            color=color,
            timestamp=datetime.now(timezone.utc)
        )
        embed.add_field(name="👤 Rapporteret Spiller", value=reported_player, inline=True)
        embed.add_field(name="🔨 Straf Type", value=punishment_text, inline=True)
        
        # Only show duration for bans, not warnings
        if punishment_duration and punishment_type == "ban":
            embed.add_field(name="⏰ Varighed", value=punishment_duration, inline=True)
        
        embed.add_field(name="📝 Beskrivelse", value=description[:500] if description else "Ingen beskrivelse", inline=False)
        
        if evidence:
            embed.add_field(name="🔗 Bevis", value=evidence[:500], inline=False)
        
        embed.add_field(name="👮 Foreslået af", value=handled_by, inline=True)
        embed.add_field(name="📋 Rapport ID", value=report_id, inline=True)
        
        embed.set_footer(text="⏳ Afventer Godkendelse")
        
        # Store punishment data for button callback
        punishment_id = f"{report_id}_{datetime.now(timezone.utc).timestamp()}"
        pending_punishments[punishment_id] = {
            "report_id": report_id,
            "reported_player": reported_player,
            "punishment_type": punishment_type,
            "punishment_duration": punishment_duration,
            "description": description,
            "reporter_id": reporter_id
        }
        
        # Create view with buttons
        view = PunishmentView(punishment_id)
        
        await channel.send(embed=embed, view=view)
        print(f"[PUNISHMENT SUCCESS] Notification with buttons sent to channel for {reported_player}")
        
    except Exception as e:
        print(f"[PUNISHMENT ERROR] Error sending punishment to channel: {e}")
        import traceback
        traceback.print_exc()

async def send_report_status_notification(reporter_id: str, reporter_username: str, report_id: str, reported_player: str, report_type: str, new_status: str, handled_by: str, admin_notes: str = None, punishment_type: str = None, punishment_duration: str = None):
    """Send DM to reporter when their report status is updated"""
    if not discord_bot_client or not discord_bot_ready:
        print("Discord bot not ready for report notification")
        return
    
    try:
        # Get reporter user
        reporter_user = await discord_bot_client.fetch_user(int(reporter_id))
        if not reporter_user:
            print(f"Reporter {reporter_id} not found")
            return
        
        # Set color based on status
        if new_status == "resolved":
            color = discord.Color.green()
            status_emoji = "✅"
            status_text = "Afsluttet"
        elif new_status == "dismissed":
            color = discord.Color.red()
            status_emoji = "❌"
            status_text = "Afvist"
        elif new_status == "investigating":
            color = discord.Color.blue()
            status_emoji = "🔍"
            status_text = "Under Undersøgelse"
        else:
            color = discord.Color.yellow()
            status_emoji = "⏳"
            status_text = "Afventer"
        
        # Create embed
        embed = discord.Embed(
            title=f"{status_emoji} Din Rapport Er Blevet Opdateret",
            description=f"Status på din rapport om **{reported_player}** er blevet ændret.",
            color=color,
            timestamp=datetime.now(timezone.utc)
        )
        embed.add_field(name="👤 Rapporteret Spiller", value=reported_player, inline=True)
        embed.add_field(name="📝 Type", value=report_type, inline=True)
        embed.add_field(name="📊 Ny Status", value=f"{status_emoji} {status_text}", inline=True)
        
        # Add punishment information if provided
        if punishment_type and punishment_type != "none":
            if punishment_type == "ban":
                punishment_emoji = "🔨"
                punishment_text = "BAN"
            elif punishment_type == "warn":
                punishment_emoji = "⚠️"
                punishment_text = "ADVARSEL"
            else:
                punishment_emoji = "ℹ️"
                punishment_text = punishment_type.upper()
            
            punishment_info = f"{punishment_emoji} {punishment_text}"
            if punishment_duration:
                punishment_info += f" - {punishment_duration}"
            
            embed.add_field(name="🔨 Straf Givet", value=punishment_info, inline=False)
        
        embed.add_field(name="👮 Behandlet af", value=handled_by, inline=False)
        
        if admin_notes:
            embed.add_field(
                name="💬 Staff Kommentar",
                value=admin_notes[:1000],  # Limit to 1000 chars
                inline=False
            )
        
        embed.set_footer(text="Redicate Report System")
        
        await reporter_user.send(embed=embed)
        print(f"Report status notification sent to {reporter_username}")
        
    except discord.Forbidden:
        print(f"Cannot send DM to {reporter_username} - DMs are disabled")
    except Exception as e:
        print(f"Error sending report notification: {e}")

async def send_strike_notification_dm(staff_discord_id: str, staff_username: str, strike_number: int, reason: str, added_by: str):
    """Send DM to staff member when they receive a strike"""
    if not discord_bot_client or not discord_bot_ready:
        print("Discord bot not ready")
        return
    
    try:
        # Get staff user
        staff_user = await discord_bot_client.fetch_user(int(staff_discord_id))
        if not staff_user:
            print(f"Staff user {staff_discord_id} not found")
            return
        
        # Create embed
        color = discord.Color.orange() if strike_number < 3 else discord.Color.red()
        embed = discord.Embed(
            title=f"⚠️ Du har modtaget en Strike ({strike_number}/3)",
            description=f"Din Head Admin har givet dig en strike.",
            color=color,
            timestamp=datetime.now(timezone.utc)
        )
        embed.add_field(name="📝 Årsag", value=reason, inline=False)
        embed.add_field(name="👤 Givet af", value=added_by, inline=True)
        embed.add_field(name="📊 Strikes i alt", value=f"{strike_number}/3", inline=True)
        
        if strike_number >= 3:
            embed.add_field(
                name="🚨 KRITISK ADVARSEL",
                value="Du har nu 3 strikes. Din Head Admin vil indstille dig til fyring. Du vil modtage besked om beslutningen.",
                inline=False
            )
        else:
            embed.add_field(
                name="💡 Hvad nu?",
                value="Tag kontakt til din Head Admin for at diskutere situationen og undgå yderligere strikes.",
                inline=False
            )
        
        embed.set_footer(text="Redicate Staff System")
        
        await staff_user.send(embed=embed)
        print(f"Strike notification sent to {staff_username}")
        
    except discord.Forbidden:
        print(f"Cannot send DM to {staff_username} - DMs are disabled")
    except Exception as e:
        print(f"Error sending strike notification: {e}")

async def send_staff_assignment_dm(head_admin_id: str, new_staff_username: str, new_staff_id: str, team_name: str):
    """Send DM to head admin about new staff member with guide"""
    if not discord_bot_client or not discord_bot_ready:
        print("Discord bot not ready")
        return
    
    try:
        # Get head admin user
        head_admin = await discord_bot_client.fetch_user(int(head_admin_id))
        if not head_admin:
            print(f"Head admin {head_admin_id} not found")
            return
        
        # Create embed with guide
        embed = discord.Embed(
            title="🎯 Nyt Staff Medlem på Dit Team!",
            description=f"**{new_staff_username}** er blevet godkendt og tilføjet til **{team_name}**",
            color=discord.Color.blue(),
            timestamp=datetime.now(timezone.utc)
        )
        embed.add_field(name="Staff Medlem", value=f"<@{new_staff_id}>", inline=True)
        embed.add_field(name="Discord ID", value=new_staff_id, inline=True)
        embed.add_field(name="Team", value=team_name, inline=True)
        
        # Guide for head admin
        guide_text = """
**📋 HVAD NU?**

1️⃣ **Velkomst**: Tag kontakt til det nye staff medlem og byd dem velkommen
2️⃣ **Træning**: Giv dem en intro til server regler og staff guidelines
3️⃣ **Permissions**: Sørg for de har de rigtige roller i Discord
4️⃣ **Shadowing**: Lad dem følge dig eller andre erfarne staff
5️⃣ **First Tasks**: Start med simple opgaver som at svare på spørgsmål

**⚙️ ANSVARSOMRÅDER**
• Hjælp spillere med spørgsmål
• Behandl reports
• Overvåg server for regelbrydelser
• Dokumentér vigtige situationer
• Rapportér til dig som Head Admin

**📞 SUPPORT**
Hvis du har brug for hjælp til at træne dit team, kontakt Super Admins.

God fornøjelse med dit nye team medlem! 🚀
"""
        
        embed.add_field(name="Guide til Træning", value=guide_text, inline=False)
        embed.set_footer(text="Redicate RP Staff System")
        
        await head_admin.send(embed=embed)
        print(f"Sent staff assignment DM to head admin {head_admin_id}")
    except Exception as e:
        print(f"Failed to send staff assignment DM: {e}")

async def send_transfer_notifications(
    staff_discord_id: str,
    staff_username: str,
    old_head_admin_id: str,
    old_team_name: str,
    new_head_admin_id: str,
    new_team_name: str,
    admin_username: str
):
    """Send custom DM notifications to all parties involved in a staff transfer"""
    if not discord_bot_client or not discord_bot_ready:
        print("Discord bot not ready for transfer notifications")
        return
    
    try:
        # 1. DM to the transferred staff member
        try:
            staff_user = await discord_bot_client.fetch_user(int(staff_discord_id))
            if staff_user:
                staff_embed = discord.Embed(
                    title="🔄 Du er blevet overført til et nyt team!",
                    description=f"Hej **{staff_username}**!\n\nDu er blevet overført til et nyt staff team.",
                    color=discord.Color.blue(),
                    timestamp=datetime.now(timezone.utc)
                )
                staff_embed.add_field(
                    name="📤 Fra Team",
                    value=old_team_name,
                    inline=True
                )
                staff_embed.add_field(
                    name="📥 Til Team",
                    value=new_team_name,
                    inline=True
                )
                staff_embed.add_field(
                    name="👤 Din Nye Head Admin",
                    value=f"<@{new_head_admin_id}>",
                    inline=False
                )
                staff_embed.add_field(
                    name="⚙️ Overført af",
                    value=admin_username,
                    inline=True
                )
                staff_embed.add_field(
                    name="📝 Næste Skridt",
                    value="• Kontakt din nye Head Admin\n• Få info om dit nye teams arbejdsområde\n• Fortsæt dit gode arbejde!",
                    inline=False
                )
                staff_embed.set_footer(text="Redicate RP Staff System")
                
                await staff_user.send(embed=staff_embed)
                print(f"✅ Sent transfer DM to staff member {staff_username}")
        except Exception as e:
            print(f"❌ Could not send DM to staff member: {e}")
        
        # 2. DM to old head admin (if exists)
        if old_head_admin_id:
            try:
                old_head_admin = await discord_bot_client.fetch_user(int(old_head_admin_id))
                if old_head_admin:
                    old_ha_embed = discord.Embed(
                        title="📤 Staff medlem overført fra dit team",
                        description=f"Et af dine team medlemmer er blevet overført til et andet team.",
                        color=discord.Color.orange(),
                        timestamp=datetime.now(timezone.utc)
                    )
                    old_ha_embed.add_field(
                        name="👤 Staff Medlem",
                        value=f"**{staff_username}** (<@{staff_discord_id}>)",
                        inline=False
                    )
                    old_ha_embed.add_field(
                        name="📤 Fra",
                        value=old_team_name,
                        inline=True
                    )
                    old_ha_embed.add_field(
                        name="📥 Til",
                        value=new_team_name,
                        inline=True
                    )
                    old_ha_embed.add_field(
                        name="⚙️ Overført af",
                        value=admin_username,
                        inline=False
                    )
                    old_ha_embed.set_footer(text="Redicate RP Staff System")
                    
                    await old_head_admin.send(embed=old_ha_embed)
                    print(f"✅ Sent transfer notification to old head admin")
            except Exception as e:
                print(f"❌ Could not send DM to old head admin: {e}")
        
        # 3. DM to new head admin
        try:
            new_head_admin = await discord_bot_client.fetch_user(int(new_head_admin_id))
            if new_head_admin:
                new_ha_embed = discord.Embed(
                    title="📥 Nyt staff medlem overført til dit team!",
                    description=f"Et staff medlem er blevet overført til **{new_team_name}**.",
                    color=discord.Color.green(),
                    timestamp=datetime.now(timezone.utc)
                )
                new_ha_embed.add_field(
                    name="👤 Staff Medlem",
                    value=f"**{staff_username}** (<@{staff_discord_id}>)",
                    inline=False
                )
                new_ha_embed.add_field(
                    name="📤 Fra Team",
                    value=old_team_name,
                    inline=True
                )
                new_ha_embed.add_field(
                    name="📥 Til Team",
                    value=new_team_name,
                    inline=True
                )
                new_ha_embed.add_field(
                    name="⚙️ Overført af",
                    value=admin_username,
                    inline=False
                )
                new_ha_embed.add_field(
                    name="📋 HVAD NU?",
                    value="• Kontakt det nye team medlem\n• Giv dem en intro til teamets arbejdsområde\n• Hjælp dem med at komme godt i gang",
                    inline=False
                )
                new_ha_embed.set_footer(text="Redicate RP Staff System")
                
                await new_head_admin.send(embed=new_ha_embed)
                print(f"✅ Sent transfer notification to new head admin")
        except Exception as e:
            print(f"❌ Could not send DM to new head admin: {e}")
        
        print(f"✅ All transfer notifications sent for {staff_username}")
    except Exception as e:
        print(f"❌ Failed to send transfer notifications: {e}")
        import traceback
        traceback.print_exc()

async def give_probation_role(discord_id: str):
    """Give probation role to new staff member"""
    if not discord_bot_client or not discord_bot_ready:
        print(f"❌ Discord bot not ready")
        return False
    
    try:
        guild = discord_bot_client.get_guild(int(DISCORD_GUILD_ID))
        if not guild:
            print(f"❌ Guild {DISCORD_GUILD_ID} not found")
            return False
        
        member = await guild.fetch_member(int(discord_id))
        if not member:
            print(f"❌ Member {discord_id} not found in guild")
            return False
        
        # Add probation role
        probation_role = guild.get_role(int(DISCORD_PROBATION_ROLE_ID))
        if probation_role:
            await member.add_roles(probation_role)
            print(f"✅ Gave probation role to {discord_id} ({member.name})")
            return True
        else:
            print(f"❌ Probation role {DISCORD_PROBATION_ROLE_ID} not found")
            return False
    except Exception as e:
        print(f"❌ Failed to give probation role: {e}")
        import traceback
        traceback.print_exc()
        return False

async def upgrade_from_probation(discord_id: str):
    """Upgrade staff member from probation to full staff"""
    if not discord_bot_client or not discord_bot_ready:
        print(f"❌ Discord bot not ready")
        return False
    
    try:
        guild = discord_bot_client.get_guild(int(DISCORD_GUILD_ID))
        if not guild:
            print(f"❌ Guild {DISCORD_GUILD_ID} not found")
            return False
        
        member = await guild.fetch_member(int(discord_id))
        if not member:
            print(f"❌ Member {discord_id} not found in guild")
            return False
        
        # Remove probation role
        probation_role = guild.get_role(int(DISCORD_PROBATION_ROLE_ID))
        if probation_role and probation_role in member.roles:
            await member.remove_roles(probation_role)
        
        # Add perm staff role
        perm_role = guild.get_role(int(DISCORD_PERM_STAFF_ROLE_ID))
        if perm_role:
            await member.add_roles(perm_role)
            print(f"✅ Upgraded {discord_id} ({member.name}) from probation to full staff")
            return True
        else:
            print(f"❌ Perm staff role {DISCORD_PERM_STAFF_ROLE_ID} not found")
            return False
    except Exception as e:
        print(f"❌ Failed to upgrade from probation: {e}")
        import traceback
        traceback.print_exc()
        return False

async def update_discord_roles(discord_id: str, new_rank: str, remove_all_ranks: bool = False):
    """Update Discord roles for staff member"""
    if not discord_bot_client or not discord_bot_ready:
        print(f"❌ Discord bot not ready. Client: {discord_bot_client}, Ready: {discord_bot_ready}")
        return False
    
    try:
        guild = discord_bot_client.get_guild(int(DISCORD_GUILD_ID))
        if not guild:
            print(f"❌ Guild {DISCORD_GUILD_ID} not found")
            return False
        
        print(f"✅ Found guild: {guild.name}")
        
        member = await guild.fetch_member(int(discord_id))
        if not member:
            print(f"❌ Member {discord_id} not found in guild")
            return False
        
        print(f"✅ Found member: {member.name}")
        
        # Remove all rank roles if specified (for firing)
        if remove_all_ranks:
            for role_id in RANK_TO_ROLE_ID.values():
                role = guild.get_role(int(role_id))
                if role and role in member.roles:
                    await member.remove_roles(role)
            
            # Remove perm staff role
            perm_role = guild.get_role(int(DISCORD_PERM_STAFF_ROLE_ID))
            if perm_role and perm_role in member.roles:
                await member.remove_roles(perm_role)
            
            print(f"Removed all staff roles from {discord_id}")
            return True
        
        # Add perm staff role if not present
        perm_role = guild.get_role(int(DISCORD_PERM_STAFF_ROLE_ID))
        if perm_role and perm_role not in member.roles:
            await member.add_roles(perm_role)
        
        # Remove all rank roles first
        for role_id in RANK_TO_ROLE_ID.values():
            role = guild.get_role(int(role_id))
            if role and role in member.roles:
                await member.remove_roles(role)
        
        # Add new rank role
        new_role_id = RANK_TO_ROLE_ID.get(new_rank)
        if new_role_id:
            new_role = guild.get_role(int(new_role_id))
            if new_role:
                await member.add_roles(new_role)
                print(f"✅ Updated {discord_id} ({member.name}) to rank {new_rank}")
                return True
            else:
                print(f"❌ Role {new_role_id} not found in guild")
        else:
            print(f"❌ No role mapping for rank {new_rank}")
        
        return False
    except Exception as e:
        print(f"❌ Failed to update Discord roles: {e}")
        import traceback
        traceback.print_exc()
        return False

async def notify_firing_request(staff_username: str, staff_id: str, head_admin_username: str, head_admin_id: str, strikes: List[dict]):
    """Notify approver role about firing request with interactive buttons"""
    if not discord_bot_client or not discord_bot_ready:
        return
    
    try:
        # Create firing request in database
        firing_request = FiringRequest(
            staff_id=staff_id,
            staff_username=staff_username,
            head_admin_id=head_admin_id,
            head_admin_username=head_admin_username,
            reason=f"{len(strikes)} strikes opnået",
            strikes=strikes
        )
        await db.firing_requests.insert_one(firing_request.model_dump())
        
        channel = discord_bot_client.get_channel(int(DISCORD_FIRING_CHANNEL_ID))
        if not channel:
            print(f"Firing channel {DISCORD_FIRING_CHANNEL_ID} not found")
            return
        
        # Build strikes list
        strikes_text = "\n".join([
            f"**Strike {i+1}:** {s['reason']} (af {s['added_by']})" 
            for i, s in enumerate(strikes)
        ])
        
        embed = discord.Embed(
            title="⚠️ Fyring Anmodning",
            description=f"<@{DISCORD_FIRING_APPROVER_USER_ID}> En staff medlem skal godkendes til fyring",
            color=discord.Color.red(),
            timestamp=datetime.now(timezone.utc)
        )
        embed.add_field(name="👤 Staff Medlem", value=f"{staff_username} (<@{staff_id}>)", inline=True)
        embed.add_field(name="👮 Head Admin", value=f"{head_admin_username} (<@{head_admin_id}>)", inline=True)
        embed.add_field(name="📊 Total Strikes", value=str(len(strikes)), inline=True)
        embed.add_field(name="⚠️ Strikes Oversigt", value=strikes_text, inline=False)
        embed.add_field(name="🆔 Request ID", value=f"`{firing_request.id}`", inline=False)
        embed.set_footer(text="Redicate RP Staff System • Brug knapperne nedenfor")
        
        # Create buttons view
        from discord.ui import View, Button
        
        class FiringApprovalView(View):
            def __init__(self, request_id: str):
                super().__init__(timeout=None)  # No timeout
                self.request_id = request_id
                
                # Approve button
                approve_btn = Button(
                    label="✅ Godkend Fyring",
                    style=discord.ButtonStyle.success,
                    custom_id=f"firing_approve_{request_id}"
                )
                approve_btn.callback = self.approve_callback
                self.add_item(approve_btn)
                
                # Reject button
                reject_btn = Button(
                    label="❌ Afvis Fyring",
                    style=discord.ButtonStyle.danger,
                    custom_id=f"firing_reject_{request_id}"
                )
                reject_btn.callback = self.reject_callback
                self.add_item(reject_btn)
            
            async def approve_callback(self, interaction: discord.Interaction):
                # Check if user is authorized
                if str(interaction.user.id) != DISCORD_FIRING_APPROVER_USER_ID:
                    await interaction.response.send_message(
                        "❌ Du har ikke rettigheder til at godkende fyringer!",
                        ephemeral=True
                    )
                    return
                
                # Update firing request in database
                await db.firing_requests.update_one(
                    {"id": self.request_id},
                    {"$set": {
                        "status": "approved",
                        "reviewed_by": str(interaction.user.id),
                        "reviewed_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Get firing request details
                firing_req = await db.firing_requests.find_one({"id": self.request_id}, {"_id": 0})
                
                # Fire the staff member (remove all roles)
                await update_discord_roles(firing_req["staff_id"], None, True)
                
                # Update user in database
                await db.users.update_one(
                    {"discord_id": firing_req["staff_id"]},
                    {"$set": {
                        "role": "player",
                        "is_admin": False,
                        "is_head_admin": False,
                        "team_id": None,
                        "staff_rank": None
                    }}
                )
                
                # Send DM to fired staff member
                try:
                    fired_user = await discord_bot_client.fetch_user(int(firing_req["staff_id"]))
                    if fired_user:
                        dm_embed = discord.Embed(
                            title="⚠️ Staff Fyring",
                            description=f"Hej **{firing_req['staff_username']}**,\n\nDu er blevet fyret fra staff teamet.",
                            color=discord.Color.red(),
                            timestamp=datetime.now(timezone.utc)
                        )
                        dm_embed.add_field(
                            name="📋 Årsag",
                            value=firing_req["reason"],
                            inline=False
                        )
                        dm_embed.add_field(
                            name="⚠️ Strikes",
                            value="\n".join([f"**Strike {i+1}:** {s['reason']}" for i, s in enumerate(firing_req["strikes"])]),
                            inline=False
                        )
                        dm_embed.add_field(
                            name="ℹ️ Hvad Nu?",
                            value="Dine staff roller er blevet fjernet. Hvis du har spørgsmål, kontakt server ledelsen.",
                            inline=False
                        )
                        dm_embed.set_footer(text="Redicate RP Staff System")
                        
                        await fired_user.send(embed=dm_embed)
                        print(f"Sent firing DM to {firing_req['staff_username']}")
                except Exception as dm_error:
                    print(f"Could not send firing DM: {dm_error}")
                
                # Update embed
                embed = interaction.message.embeds[0]
                embed.color = discord.Color.green()
                embed.title = "✅ Fyring Godkendt"
                embed.add_field(
                    name="Godkendt af", 
                    value=f"<@{interaction.user.id}>", 
                    inline=False
                )
                
                await interaction.response.edit_message(embed=embed, view=None)
                await interaction.followup.send(
                    f"✅ {firing_req['staff_username']} er blevet fyret og fjernet fra teamet. DM sendt.",
                    ephemeral=True
                )
            
            async def reject_callback(self, interaction: discord.Interaction):
                # Check if user is authorized
                if str(interaction.user.id) != DISCORD_FIRING_APPROVER_USER_ID:
                    await interaction.response.send_message(
                        "❌ Du har ikke rettigheder til at afvise fyringer!",
                        ephemeral=True
                    )
                    return
                
                # Update firing request in database
                await db.firing_requests.update_one(
                    {"id": self.request_id},
                    {"$set": {
                        "status": "rejected",
                        "reviewed_by": str(interaction.user.id),
                        "reviewed_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                firing_req = await db.firing_requests.find_one({"id": self.request_id}, {"_id": 0})
                
                # Update embed
                embed = interaction.message.embeds[0]
                embed.color = discord.Color.orange()
                embed.title = "❌ Fyring Afvist"
                embed.add_field(
                    name="Afvist af", 
                    value=f"<@{interaction.user.id}>", 
                    inline=False
                )
                
                await interaction.response.edit_message(embed=embed, view=None)
                await interaction.followup.send(
                    f"❌ Fyring anmodning for {firing_req['staff_username']} er blevet afvist.",
                    ephemeral=True
                )
        
        view = FiringApprovalView(firing_request.id)
        message = await channel.send(embed=embed, view=view)
        
        # Save message ID for reference
        await db.firing_requests.update_one(
            {"id": firing_request.id},
            {"$set": {"discord_message_id": str(message.id)}}
        )
        
        print(f"Sent firing request notification with buttons for {staff_username}")
    except Exception as e:
        print(f"Failed to send firing notification: {e}")
        import traceback
        traceback.print_exc()

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    discord_id: str
    username: str
    avatar: Optional[str] = None
    is_admin: bool = False
    is_head_admin: bool = False
    role: Optional[str] = "player"  # player, staff, head_admin, super_admin, staff_member
    team_id: Optional[str] = None  # Staff team ID
    staff_rank: Optional[str] = "mod_elev"  # mod_elev, moderator, administrator, senior_admin
    strikes: int = 0
    notes: List[dict] = []  # [{text: str, added_by: str, added_at: str}]
    on_probation: bool = False  # True if in probation period
    probation_end_date: Optional[str] = None  # ISO datetime when probation ends
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StaffTeam(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    head_admin_id: str  # Discord ID of head admin
    members: List[str] = []  # Discord IDs of team members
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StaffTeamCreate(BaseModel):
    name: str
    description: str
    head_admin_id: str

class AddStaffMember(BaseModel):
    discord_id: str
    username: str
    team_id: str

class AddStrikeRequest(BaseModel):
    reason: str

class AddNoteRequest(BaseModel):
    note: str

class UpRankRequest(BaseModel):
    new_rank: Literal["mod_elev", "moderator", "administrator", "senior_admin"]

class ApplicationType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: Optional[str] = None
    color: Optional[str] = "#4A90E2"
    questions: List[dict] = []  # [{"label": "Question", "type": "text", "required": true}]
    active: bool = True
    created_by: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ApplicationTypeCreate(BaseModel):
    name: str
    description: str
    icon: Optional[str] = None
    color: Optional[str] = "#4A90E2"
    questions: List[dict] = []

class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    application_type_id: str
    application_type_name: str
    status: Literal["pending", "approved", "rejected"] = "pending"
    answers: dict
    submitted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None

class ApplicationCreate(BaseModel):
    application_type_id: str
    answers: dict

class ApplicationReview(BaseModel):
    status: Literal["approved", "rejected"]

class FiringRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    staff_id: str
    staff_username: str
    head_admin_id: str
    head_admin_username: str
    reason: str
    strikes: List[dict]  # List of strikes with reasons
    status: Literal["pending", "approved", "rejected"] = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    discord_message_id: Optional[str] = None

class Report(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reporter_id: str
    reporter_username: str
    reported_player: str
    report_type: str  # RDM, VDM, FailRP, Metagaming, etc.
    description: str
    evidence: Optional[str] = None  # Links to clips/screenshots
    status: Literal["pending", "investigating", "resolved", "dismissed"] = "pending"
    submitted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    handled_by: Optional[str] = None
    handled_at: Optional[str] = None
    admin_notes: Optional[str] = None
    punishment_type: Optional[str] = None  # "ban", "warn", "none"
    punishment_duration: Optional[str] = None  # "permanent", "1 day", "3 days", "7 days", etc.

class ReportCreate(BaseModel):
    reported_player: str
    report_type: str
    description: str
    evidence: Optional[str] = None

class ReportUpdate(BaseModel):
    status: Literal["investigating", "resolved", "dismissed"]
    admin_notes: Optional[str] = None
    punishment_type: Optional[str] = None  # "ban", "warn", "none"
    punishment_duration: Optional[str] = None

# Auth helpers
async def get_current_user(request: Request) -> Optional[User]:
    session_token = request.cookies.get("session_token")
    if not session_token or session_token not in sessions:
        return None
    
    discord_id = sessions[session_token]
    user_doc = await db.users.find_one({"discord_id": discord_id}, {"_id": 0})
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(request: Request) -> User:
    user = await require_auth(request)
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_head_admin(request: Request) -> User:
    user = await require_auth(request)
    if not user.is_head_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_super_admin(request: Request) -> User:
    user = await require_auth(request)
    if user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return user

async def check_discord_role(access_token: str) -> tuple[bool, str]:
    """Check user's Discord role and return (is_admin, role_type)"""
    try:
        async with httpx.AsyncClient() as http_client:
            # Get user's guilds
            guilds_response = await http_client.get(
                f"{DISCORD_API_ENDPOINT}/users/@me/guilds",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            
            if guilds_response.status_code != 200:
                return False, "player"
            
            guilds = guilds_response.json()
            
            # Check if user is in the required guild
            in_guild = any(g["id"] == DISCORD_GUILD_ID for g in guilds)
            if not in_guild:
                return False, "player"
            
            # Get guild member info
            member_response = await http_client.get(
                f"{DISCORD_API_ENDPOINT}/users/@me/guilds/{DISCORD_GUILD_ID}/member",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            
            if member_response.status_code != 200:
                return False, "player"
            
            member_data = member_response.json()
            roles = member_data.get("roles", [])
            
            # Check role hierarchy (top to bottom)
            if DISCORD_SUPER_ADMIN_ROLE_ID in roles:
                return True, "super_admin"
            elif DISCORD_HEAD_ADMIN_ROLE_ID in roles:
                return True, "head_admin"
            elif DISCORD_ADMIN_ROLE_ID in roles:
                return True, "staff"
            elif DISCORD_STAFF_MEMBER_ROLE_ID in roles:
                return True, "staff_member"  # Staff members can also view/handle reports
            
            return False, "player"
    except Exception as e:
        print(f"Error checking Discord role: {e}")
        return False, "player"

# Discord OAuth endpoints
@api_router.get("/auth/login")
async def discord_login():
    oauth_url = (
        f"https://discord.com/api/oauth2/authorize?"
        f"client_id={DISCORD_CLIENT_ID}&"
        f"redirect_uri={DISCORD_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=identify guilds guilds.members.read"
    )
    return {"url": oauth_url}

@api_router.get("/auth/callback")
async def discord_callback(code: str, response: Response):
    async with httpx.AsyncClient() as http_client:
        # Exchange code for token
        token_response = await http_client.post(
            f"{DISCORD_API_ENDPOINT}/oauth2/token",
            data={
                "client_id": DISCORD_CLIENT_ID,
                "client_secret": DISCORD_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": DISCORD_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        token_data = token_response.json()
        access_token = token_data["access_token"]
        
        # Get user info
        user_response = await http_client.get(
            f"{DISCORD_API_ENDPOINT}/users/@me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        discord_user = user_response.json()
        discord_id = discord_user["id"]
        username = discord_user["username"]
        avatar = discord_user.get("avatar")
        
        # Check user's Discord role
        is_admin, role_type = await check_discord_role(access_token)
        
        # Determine if user is head admin (head_admin or super_admin roles)
        is_head_admin = role_type in ["head_admin", "super_admin"]
        
        # Check if user exists
        existing_user = await db.users.find_one({"discord_id": discord_id})
        
        if not existing_user:
            user_obj = User(
                discord_id=discord_id,
                username=username,
                avatar=avatar,
                is_admin=is_admin,
                is_head_admin=is_head_admin,
                role=role_type
            )
            await db.users.insert_one(user_obj.model_dump())
        else:
            # Always update ALL role-related fields to ensure demotions work
            update_data = {
                "username": username, 
                "avatar": avatar, 
                "is_admin": is_admin, 
                "is_head_admin": is_head_admin,
                "role": role_type
            }
            
            # If user lost admin privileges, clear team_id
            if not is_admin and existing_user.get("is_admin"):
                update_data["team_id"] = None
            
            await db.users.update_one(
                {"discord_id": discord_id},
                {"$set": update_data}
            )
        
        # Create session
        session_token = secrets.token_urlsafe(32)
        sessions[session_token] = discord_id
        
        # Create redirect response and set cookie on it
        redirect_response = RedirectResponse(url="https://www.redicate.dk")
        redirect_response.set_cookie(
            key="session_token",
            value=session_token,
            domain=".redicate.dk",
            httponly=True,
            secure=True,
            max_age=7 * 24 * 60 * 60,
            samesite="none"
        )
        
        return redirect_response

@api_router.get("/auth/me")
async def get_current_user_info(user: User = Depends(require_auth)):
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token and session_token in sessions:
        del sessions[session_token]
    response.delete_cookie("session_token")
    return {"success": True}

# Application Types endpoints
@api_router.get("/application-types", response_model=List[ApplicationType])
async def get_application_types():
    app_types = await db.application_types.find({"active": True}, {"_id": 0}).to_list(1000)
    return app_types

@api_router.post("/application-types", response_model=ApplicationType)
async def create_application_type(app_type_data: ApplicationTypeCreate, user: User = Depends(require_admin)):
    app_type = ApplicationType(**app_type_data.model_dump(), created_by=user.discord_id)
    await db.application_types.insert_one(app_type.model_dump())
    return app_type

@api_router.put("/application-types/{type_id}", response_model=ApplicationType)
async def update_application_type(type_id: str, app_type_data: ApplicationTypeCreate, user: User = Depends(require_admin)):
    result = await db.application_types.update_one(
        {"id": type_id},
        {"$set": app_type_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application type not found")
    
    app_type = await db.application_types.find_one({"id": type_id}, {"_id": 0})
    return ApplicationType(**app_type)

@api_router.delete("/application-types/{type_id}")
async def delete_application_type(type_id: str, user: User = Depends(require_admin)):
    result = await db.application_types.update_one(
        {"id": type_id},
        {"$set": {"active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application type not found")
    return {"success": True}

# Applications endpoints
@api_router.get("/applications", response_model=List[Application])
async def get_applications(user: User = Depends(require_auth)):
    if user.is_admin:
        applications = await db.applications.find({}, {"_id": 0}).to_list(1000)
    else:
        applications = await db.applications.find({"user_id": user.discord_id}, {"_id": 0}).to_list(1000)
    
    return applications

@api_router.post("/applications", response_model=Application)
async def create_application(app_data: ApplicationCreate, user: User = Depends(require_auth)):
    # Get application type info
    app_type = await db.application_types.find_one({"id": app_data.application_type_id}, {"_id": 0})
    if not app_type or not app_type.get("active", True):
        raise HTTPException(status_code=404, detail="Application type not found")
    
    # Check if user already has pending application for this type
    existing = await db.applications.find_one({
        "user_id": user.discord_id,
        "application_type_id": app_data.application_type_id,
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Du har allerede en afventende ansøgning for denne type")
    
    application = Application(
        user_id=user.discord_id,
        username=user.username,
        application_type_id=app_data.application_type_id,
        application_type_name=app_type["name"],
        answers=app_data.answers
    )
    
    await db.applications.insert_one(application.model_dump())
    return application

@api_router.get("/applications/search")
async def search_user_applications(username: str = None, discord_id: str = None, user: User = Depends(require_admin)):
    """Search for a user and get all their applications"""
    if not username and not discord_id:
        raise HTTPException(status_code=400, detail="Provide username or discord_id")
    
    # Find user
    query = {}
    if discord_id:
        query["discord_id"] = discord_id
    elif username:
        query["username"] = {"$regex": username, "$options": "i"}
    
    # Get all users matching search
    users = await db.users.find(query, {"_id": 0, "discord_id": 1, "username": 1, "avatar": 1, "role": 1}).to_list(10)
    
    if not users:
        return {"users": [], "message": "Ingen brugere fundet"}
    
    # For each user, get their applications
    results = []
    for user_data in users:
        applications = await db.applications.find(
            {"user_id": user_data["discord_id"]},
            {"_id": 0}
        ).sort("submitted_at", -1).to_list(100)
        
        # Get application type details for each application
        for app in applications:
            app_type = await db.application_types.find_one(
                {"id": app["application_type_id"]},
                {"_id": 0, "name": 1, "questions": 1}
            )
            if app_type:
                app["application_type_details"] = app_type
        
        results.append({
            "user": user_data,
            "applications": applications,
            "total_applications": len(applications)
        })
    
    return {"users": results, "total_users": len(results)}

@api_router.get("/applications/{app_id}", response_model=Application)
async def get_application(app_id: str, user: User = Depends(require_auth)):
    application = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if not user.is_admin and application["user_id"] != user.discord_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Application(**application)

@api_router.post("/applications/{app_id}/review")
async def review_application(
    app_id: str, 
    review: ApplicationReview, 
    background_tasks: BackgroundTasks,
    user: User = Depends(require_admin),
    team_id: Optional[str] = None
):
    application = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Update application status
    await db.applications.update_one(
        {"id": app_id},
        {"$set": {
            "status": review.status,
            "reviewed_by": user.username,
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Initialize assigned_team
    assigned_team = None
    
    # If approved and it's a staff application
    if review.status == "approved" and application["application_type_name"].lower() == "staff":
        # Find a team to assign (use provided team_id or assign to team with fewest members)
        if team_id:
            assigned_team = await db.staff_teams.find_one({"id": team_id}, {"_id": 0})
        else:
            # Get all teams and assign to the one with fewest members
            all_teams = await db.staff_teams.find({}, {"_id": 0}).to_list(None)
            if all_teams:
                # Sort teams by member count (fewest first)
                all_teams.sort(key=lambda t: len(t.get('members', [])))
                assigned_team = all_teams[0]
                print(f"⚖️ Assigned to team with fewest members: {assigned_team['name']} ({len(assigned_team.get('members', []))} members)")
            else:
                assigned_team = None
                print("⚠️ No teams available for assignment")
        
        # Update user role to staff_member with starting rank
        # NOTE: They start with probation for 1 week
        probation_end = datetime.now(timezone.utc) + timedelta(days=7)
        await db.users.update_one(
            {"discord_id": application["user_id"]},
            {"$set": {
                "role": "staff_member",
                "staff_rank": "mod_elev",
                "strikes": 0,
                "notes": [],
                "team_id": assigned_team["id"] if assigned_team else None,
                "is_admin": False,
                "is_head_admin": False,
                "on_probation": True,
                "probation_end_date": probation_end.isoformat()
            }}
        )
        
        # Add Discord probation role (not perm staff yet)
        background_tasks.add_task(
            give_probation_role,
            application["user_id"]
        )
        
        # If team assigned, add to team and notify head admin
        if assigned_team:
            # Add member to team
            await db.staff_teams.update_one(
                {"id": assigned_team["id"]},
                {"$addToSet": {"members": application["user_id"]}}
            )
            
            # Send guide to head admin via Discord DM
            background_tasks.add_task(
                send_staff_assignment_dm,
                assigned_team["head_admin_id"],
                application["username"],
                application["user_id"],
                assigned_team["name"]
            )
    
    # Send Discord embed in background with team info if staff application
    head_admin_id = None
    team_name = None
    if review.status == "approved" and application["application_type_name"].lower() == "staff" and assigned_team:
        head_admin_id = assigned_team["head_admin_id"]
        team_name = assigned_team["name"]
    
    background_tasks.add_task(
        send_discord_embed,
        application["user_id"],
        application["username"],
        application["application_type_name"],
        review.status,
        user.username,
        head_admin_id,
        team_name
    )
    
    return {"success": True}

# Report endpoints
@api_router.get("/reports", response_model=List[Report])
async def get_reports(user: User = Depends(require_auth)):
    if user.is_admin:
        reports = await db.reports.find({}, {"_id": 0}).to_list(1000)
    else:
        reports = await db.reports.find({"reporter_id": user.discord_id}, {"_id": 0}).to_list(1000)
    
    return reports

@api_router.post("/reports", response_model=Report)
async def create_report(report_data: ReportCreate, user: User = Depends(require_auth)):
    report = Report(
        reporter_id=user.discord_id,
        reporter_username=user.username,
        reported_player=report_data.reported_player,
        report_type=report_data.report_type,
        description=report_data.description,
        evidence=report_data.evidence
    )
    
    await db.reports.insert_one(report.model_dump())
    return report

@api_router.get("/reports/{report_id}", response_model=Report)
async def get_report(report_id: str, user: User = Depends(require_auth)):
    report = await db.reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if not user.is_admin and report["reporter_id"] != user.discord_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Report(**report)

@api_router.put("/reports/{report_id}")
async def update_report(report_id: str, update: ReportUpdate, user: User = Depends(require_admin)):
    report = await db.reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Update report with new information
    update_data = {
        "status": update.status,
        "admin_notes": update.admin_notes,
        "handled_by": user.username,
        "handled_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Add punishment info if provided
    if update.punishment_type:
        update_data["punishment_type"] = update.punishment_type
        update_data["punishment_duration"] = update.punishment_duration
    
    await db.reports.update_one(
        {"id": report_id},
        {"$set": update_data}
    )
    
    # Send punishment to punishment channel if punishment was given
    if update.punishment_type and update.punishment_type != "none":
        asyncio.create_task(
            send_punishment_to_channel(
                report_id,
                report["reported_player"],
                report["report_type"],
                update.punishment_type,
                update.punishment_duration,
                user.username,
                report["description"],
                report.get("evidence"),
                report["reporter_id"]  # Include reporter_id for notifications
            )
        )
    
    # Send DM notification to reporter about ALL changes
    asyncio.create_task(
        send_report_status_notification(
            report["reporter_id"],
            report["reporter_username"],
            report_id,
            report["reported_player"],
            report["report_type"],
            update.status,
            user.username,
            update.admin_notes,
            update.punishment_type,
            update.punishment_duration
        )
    )
    
    return {"success": True}

# Staff Teams endpoints
@api_router.get("/staff-teams", response_model=List[StaffTeam])
async def get_staff_teams(user: User = Depends(require_admin)):
    teams = await db.staff_teams.find({}, {"_id": 0}).to_list(1000)
    return teams

@api_router.get("/staff/my-team")
async def get_my_team(user: User = Depends(require_head_admin)):
    """Get the team where current user is head admin"""
    team = await db.staff_teams.find_one({"head_admin_id": user.discord_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="No team found for this head admin")
    
    # Get team member details
    members = []
    if team.get("members"):
        members = await db.users.find(
            {"discord_id": {"$in": team["members"]}},
            {"_id": 0}
        ).to_list(1000)
    
    return {
        "team": team,
        "members": members
    }

@api_router.delete("/staff/my-team/members/{discord_id}")
async def remove_my_team_member(discord_id: str, user: User = Depends(require_head_admin)):
    """DISABLED - Head admins cannot remove members. Contact super admin."""
    raise HTTPException(
        status_code=403, 
        detail="Kun super admins kan fjerne team medlemmer. Kontakt en super admin for hjælp."
    )

# Staff Management Endpoints (Strikes, Notes, Uprank)
@api_router.post("/staff/my-team/members/{discord_id}/strike")
async def add_strike(discord_id: str, strike_data: AddStrikeRequest, user: User = Depends(require_head_admin)):
    """Add a strike to a team member"""
    # Verify member is in head admin's team
    team = await db.staff_teams.find_one({"head_admin_id": user.discord_id})
    if not team or discord_id not in team.get("members", []):
        raise HTTPException(status_code=404, detail="Member not in your team")
    
    # Get staff member
    staff = await db.users.find_one({"discord_id": discord_id})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    new_strikes = staff.get("strikes", 0) + 1
    
    # Update strikes
    await db.users.update_one(
        {"discord_id": discord_id},
        {"$set": {"strikes": new_strikes}}
    )
    
    # Add note about strike
    note = {
        "text": f"⚠️ Strike {new_strikes}/3: {strike_data.reason}",
        "added_by": user.username,
        "added_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.update_one(
        {"discord_id": discord_id},
        {"$push": {"notes": note}}
    )
    
    # Send DM notification to staff member about the strike
    await send_strike_notification_dm(
        discord_id,
        staff["username"],
        new_strikes,
        strike_data.reason,
        user.username
    )
    
    # If 3 strikes, notify for firing
    if new_strikes >= 3:
        # Get all strikes for this staff member
        updated_staff = await db.users.find_one({"discord_id": discord_id}, {"_id": 0})
        strikes_list = []
        for note in updated_staff.get("notes", []):
            if "Strike" in note.get("text", ""):
                strikes_list.append({
                    "reason": note["text"],
                    "added_by": note["added_by"],
                    "added_at": note["added_at"]
                })
        
        await notify_firing_request(
            staff["username"],
            discord_id,
            user.username,
            user.discord_id,
            strikes_list
        )
    
    return {"success": True, "strikes": new_strikes, "requires_firing": new_strikes >= 3}

@api_router.post("/staff/my-team/members/{discord_id}/note")
async def add_note(discord_id: str, note_data: AddNoteRequest, user: User = Depends(require_head_admin)):
    """Add a note to a team member"""
    # Verify member is in head admin's team
    team = await db.staff_teams.find_one({"head_admin_id": user.discord_id})
    if not team or discord_id not in team.get("members", []):
        raise HTTPException(status_code=404, detail="Member not in your team")
    
    note = {
        "text": note_data.note,
        "added_by": user.username,
        "added_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.update_one(
        {"discord_id": discord_id},
        {"$push": {"notes": note}}
    )
    
    return {"success": True}

@api_router.post("/super-admin/strikes/remove/{discord_id}")
async def remove_strike(discord_id: str, user: User = Depends(require_super_admin)):
    """Remove a strike from a staff member (Super Admin only)"""
    # Get staff member
    staff = await db.users.find_one({"discord_id": discord_id})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    current_strikes = staff.get("strikes", 0)
    
    if current_strikes <= 0:
        raise HTTPException(status_code=400, detail="Staff member has no strikes to remove")
    
    new_strikes = current_strikes - 1
    
    # Update strikes count
    await db.users.update_one(
        {"discord_id": discord_id},
        {"$set": {"strikes": new_strikes}}
    )
    
    # Add note about strike removal
    note = {
        "text": f"✅ Strike fjernet af Super Admin (strikes: {current_strikes} → {new_strikes})",
        "added_by": user.username,
        "added_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.update_one(
        {"discord_id": discord_id},
        {"$push": {"notes": note}}
    )
    
    return {"success": True, "new_strikes": new_strikes}

@api_router.post("/staff/my-team/members/{discord_id}/uprank")
async def uprank_member(discord_id: str, uprank_data: UpRankRequest, user: User = Depends(require_head_admin)):
    """Uprank a team member"""
    # Verify member is in head admin's team
    team = await db.staff_teams.find_one({"head_admin_id": user.discord_id})
    if not team or discord_id not in team.get("members", []):
        raise HTTPException(status_code=404, detail="Member not in your team")
    
    staff = await db.users.find_one({"discord_id": discord_id})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    old_rank = staff.get("staff_rank", "mod_elev")
    new_rank = uprank_data.new_rank
    
    # Update database
    await db.users.update_one(
        {"discord_id": discord_id},
        {"$set": {"staff_rank": new_rank}}
    )
    
    # Add note about uprank
    note = {
        "text": f"🎉 Upranket fra {old_rank} til {new_rank}",
        "added_by": user.username,
        "added_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.update_one(
        {"discord_id": discord_id},
        {"$push": {"notes": note}}
    )
    
    # Update Discord roles
    success = await update_discord_roles(discord_id, new_rank)
    
    return {"success": True, "discord_updated": success, "new_rank": new_rank}

@api_router.post("/staff-teams", response_model=StaffTeam)
async def create_staff_team(team_data: StaffTeamCreate, user: User = Depends(require_admin)):
    # Verify head admin exists and has correct role
    head_admin = await db.users.find_one({"discord_id": team_data.head_admin_id})
    if not head_admin or head_admin.get("role") != "head_admin":
        raise HTTPException(status_code=400, detail="Head admin not found or invalid role")
    
    team = StaffTeam(**team_data.model_dump())
    await db.staff_teams.insert_one(team.model_dump())
    return team

@api_router.delete("/staff-teams/{team_id}")
async def delete_staff_team(team_id: str, user: User = Depends(require_admin)):
    result = await db.staff_teams.delete_one({"id": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"success": True}

@api_router.post("/staff-teams/{team_id}/members/{discord_id}")
async def remove_staff_member(team_id: str, discord_id: str, user: User = Depends(require_admin)):
    await db.staff_teams.update_one(
        {"id": team_id},
        {"$pull": {"members": discord_id}}
    )
    await db.users.update_one(
        {"discord_id": discord_id},
        {"$set": {"team_id": None}}
    )
    return {"success": True}

async def send_transfer_notifications(staff_discord_id: str, staff_username: str, old_head_admin_id: str, old_team_name: str, new_head_admin_id: str, new_team_name: str, transferred_by: str):
    """Send DM notifications about staff transfer"""
    if not discord_bot_client or not discord_bot_ready:
        print("Discord bot not ready")
        return
    
    try:
        # Notify the transferred staff member
        staff_user = await discord_bot_client.fetch_user(int(staff_discord_id))
        if staff_user:
            embed = discord.Embed(
                title="📋 Du er blevet overført til et nyt team!",
                description=f"Hej **{staff_username}**! Du er blevet overført til et nyt staff team.",
                color=discord.Color.blue(),
                timestamp=datetime.now(timezone.utc)
            )
            embed.add_field(name="🔄 Fra Team", value=old_team_name, inline=True)
            embed.add_field(name="➡️ Til Team", value=new_team_name, inline=True)
            embed.add_field(name="👤 Ny Head Admin", value=f"<@{new_head_admin_id}>", inline=True)
            embed.add_field(name="⚙️ Overført af", value=transferred_by, inline=False)
            embed.add_field(
                name="📝 Næste Skridt",
                value="• Kontakt din nye Head Admin\n• Få info om dit nye teams arbejdsområde\n• Fortsæt dit gode arbejde!",
                inline=False
            )
            embed.set_footer(text="Redicate RP Staff System")
            await staff_user.send(embed=embed)
        
        # Notify old head admin (if exists)
        if old_head_admin_id:
            old_head_admin = await discord_bot_client.fetch_user(int(old_head_admin_id))
            if old_head_admin:
                embed = discord.Embed(
                    title="📤 Staff medlem overført fra dit team",
                    description=f"**{staff_username}** er blevet overført fra dit team.",
                    color=discord.Color.orange(),
                    timestamp=datetime.now(timezone.utc)
                )
                embed.add_field(name="👤 Staff Medlem", value=f"<@{staff_discord_id}>", inline=True)
                embed.add_field(name="➡️ Nyt Team", value=new_team_name, inline=True)
                embed.add_field(name="⚙️ Overført af", value=transferred_by, inline=False)
                embed.set_footer(text="Redicate RP Staff System")
                await old_head_admin.send(embed=embed)
        
        # Notify new head admin
        new_head_admin = await discord_bot_client.fetch_user(int(new_head_admin_id))
        if new_head_admin:
            embed = discord.Embed(
                title="📥 Nyt staff medlem overført til dit team!",
                description=f"**{staff_username}** er blevet overført til dit team.",
                color=discord.Color.green(),
                timestamp=datetime.now(timezone.utc)
            )
            embed.add_field(name="👤 Staff Medlem", value=f"<@{staff_discord_id}>", inline=True)
            embed.add_field(name="🔄 Fra Team", value=old_team_name, inline=True)
            embed.add_field(name="⚙️ Overført af", value=transferred_by, inline=False)
            embed.add_field(
                name="📋 HVAD NU?",
                value="• Kontakt det nye team medlem\n• Giv dem en intro til teamets arbejdsområde\n• Hjælp dem med at komme godt i gang",
                inline=False
            )
            embed.set_footer(text="Redicate RP Staff System")
            await new_head_admin.send(embed=embed)
        
        print(f"Sent transfer notifications for {staff_username}")
    except Exception as e:
        print(f"Failed to send transfer notifications: {e}")

@api_router.post("/super-admin/staff/transfer")
async def transfer_staff_member(data: dict, user: User = Depends(require_admin)):
    """Transfer a staff member from one team to another (Super Admin only)"""
    discord_id = data.get("discord_id")
    new_team_id = data.get("new_team_id")
    
    # Get staff member
    staff_member = await db.users.find_one({"discord_id": discord_id}, {"_id": 0})
    if not staff_member:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    old_team_id = staff_member.get("team_id")
    old_team = await db.staff_teams.find_one({"id": old_team_id}, {"_id": 0}) if old_team_id else None
    new_team = await db.staff_teams.find_one({"id": new_team_id}, {"_id": 0})
    
    if not new_team:
        raise HTTPException(status_code=404, detail="New team not found")
    
    # Remove from old team
    if old_team_id:
        await db.staff_teams.update_one(
            {"id": old_team_id},
            {"$pull": {"members": discord_id}}
        )
    
    # Add to new team
    await db.staff_teams.update_one(
        {"id": new_team_id},
        {"$addToSet": {"members": discord_id}}
    )
    
    # Update user's team_id
    await db.users.update_one(
        {"discord_id": discord_id},
        {"$set": {"team_id": new_team_id}}
    )
    
    # Send DMs to all involved parties
    asyncio.create_task(
        send_transfer_notifications(
            staff_member["discord_id"],
            staff_member["username"],
            old_team["head_admin_id"] if old_team else None,
            old_team["name"] if old_team else "Ingen team",
            new_team["head_admin_id"],
            new_team["name"],
            user.username
        )
    )
    
    return {"success": True, "message": f"{staff_member['username']} overført til {new_team['name']}"}

@api_router.delete("/super-admin/staff/remove/{discord_id}")
async def remove_staff_member_completely(discord_id: str, user: User = Depends(require_admin)):
    """Remove a staff member completely (Super Admin only)"""
    # Get staff member
    staff_member = await db.users.find_one({"discord_id": discord_id}, {"_id": 0})
    if not staff_member:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    team_id = staff_member.get("team_id")
    
    # Remove from team
    if team_id:
        await db.staff_teams.update_one(
            {"id": team_id},
            {"$pull": {"members": discord_id}}
        )
    
    # Update user to player role
    await db.users.update_one(
        {"discord_id": discord_id},
        {"$set": {
            "team_id": None, 
            "role": "player",
            "is_admin": False,
            "is_head_admin": False,
            "staff_rank": None,
            "strikes": 0
        }}
    )
    
    return {"success": True, "message": f"{staff_member['username']} fjernet fra staff"}

@api_router.post("/super-admin/staff/add")
async def add_staff_member(staff_data: AddStaffMember, user: User = Depends(require_admin)):
    # Check if user exists
    existing_user = await db.users.find_one({"discord_id": staff_data.discord_id})
    
    if existing_user:
        # Update existing user
        await db.users.update_one(
            {"discord_id": staff_data.discord_id},
            {"$set": {"role": "staff", "team_id": staff_data.team_id}}
        )
    else:
        # Create new user entry
        new_user = User(
            discord_id=staff_data.discord_id,
            username=staff_data.username,
            is_admin=True,
            role="staff",
            team_id=staff_data.team_id
        )
        await db.users.insert_one(new_user.model_dump())
    
    # Add to team
    await db.staff_teams.update_one(
        {"id": staff_data.team_id},
        {"$addToSet": {"members": staff_data.discord_id}}
    )
    
    # Get team info and notify head admin
    team = await db.staff_teams.find_one({"id": staff_data.team_id}, {"_id": 0})
    if team:
        asyncio.create_task(
            send_staff_assignment_dm(
                team["head_admin_id"],
                staff_data.username,
                staff_data.discord_id,
                team["name"]
            )
        )
    
    return {"success": True}

# Staff endpoint
@api_router.get("/staff")
async def get_staff():
    staff = await db.users.find(
        {"is_admin": True},
        {"_id": 0, "discord_id": 1, "username": 1, "avatar": 1, "is_admin": 1, "role": 1}
    ).to_list(1000)
    return staff

# Stats endpoint
@api_router.get("/stats")
async def get_stats(user: User = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_app_types = await db.application_types.count_documents({"active": True})
    pending_apps = await db.applications.count_documents({"status": "pending"})
    approved_apps = await db.applications.count_documents({"status": "approved"})
    pending_reports = await db.reports.count_documents({"status": "pending"})
    
    return {
        "total_users": total_users,
        "total_application_types": total_app_types,
        "pending_applications": pending_apps,
        "approved_applications": approved_apps,
        "pending_reports": pending_reports
    }

# Users endpoint for admin
@api_router.get("/users", response_model=List[User])
async def get_all_users(user: User = Depends(require_admin)):
    """Get all users - for admin panel"""
    users = await db.users.find({}, {"_id": 0}).to_list(10000)
    return users

# FiveM Admin Panel Endpoints
FIVEM_SERVER_IP = "45.84.198.57"
FIVEM_SERVER_PORT = "30120"

@api_router.get("/fivem/players")
async def get_fivem_players(user: User = Depends(require_admin)):
    """Get online players from FiveM server"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/players.json")
            players = response.json()
            return {"players": players}
    except Exception as e:
        print(f"Error fetching FiveM players: {e}")
        return {"players": []}

@api_router.get("/fivem/stats")
async def get_fivem_stats(user: User = Depends(require_admin)):
    """Get server stats"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Get server info
            info_response = await client.get(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/info.json")
            info = info_response.json()
            
            # Get dynamic info
            dynamic_response = await client.get(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/dynamic.json")
            dynamic = dynamic_response.json()
            
            return {
                "maxPlayers": info.get("vars", {}).get("sv_maxClients", 64),
                "uptime": "24h 15m",  # You can calculate from server start time
                "resources": len(dynamic.get("resources", []))
            }
    except Exception as e:
        print(f"Error fetching FiveM stats: {e}")
        return {"maxPlayers": 64, "uptime": "N/A", "resources": 0}

@api_router.post("/fivem/kick")
async def kick_player(data: dict, user: User = Depends(require_admin)):
    """Kick a player from the server"""
    player_id = data.get("player_id")
    reason = data.get("reason", "Kicked by admin")
    
    # Send command to FiveM server
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/kick",
                json={"player_id": player_id, "reason": reason, "admin": user.username}
            )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to kick player: {str(e)}")

@api_router.post("/fivem/ban")
async def ban_player(data: dict, user: User = Depends(require_admin)):
    """Ban a player from the server"""
    player_id = data.get("player_id")
    reason = data.get("reason", "Banned by admin")
    duration = data.get("duration", 0)
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/ban",
                json={"player_id": player_id, "reason": reason, "duration": duration, "admin": user.username}
            )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ban player: {str(e)}")

@api_router.post("/fivem/teleport")
async def teleport_player(data: dict, user: User = Depends(require_admin)):
    """Teleport a player"""
    player_id = data.get("player_id")
    coordinates = data.get("coordinates")
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/teleport",
                json={"player_id": player_id, "coordinates": coordinates, "admin": user.username}
            )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to teleport player: {str(e)}")

@api_router.post("/fivem/heal")
async def heal_player(data: dict, user: User = Depends(require_admin)):
    """Heal a player"""
    player_id = data.get("player_id")
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/heal",
                json={"player_id": player_id, "admin": user.username}
            )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to heal player: {str(e)}")

@api_router.post("/fivem/announce")
async def send_announcement(data: dict, user: User = Depends(require_admin)):
    """Send announcement to all players"""
    message = data.get("message")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/announce",
                json={"message": message, "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fivem/revive")
async def revive_player(data: dict, user: User = Depends(require_admin)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/revive",
                json={"player_id": data.get("player_id"), "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fivem/armor")
async def give_armor(data: dict, user: User = Depends(require_admin)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/armor",
                json={"player_id": data.get("player_id"), "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fivem/freeze")
async def freeze_player(data: dict, user: User = Depends(require_admin)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/freeze",
                json={"player_id": data.get("player_id"), "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fivem/unfreeze")
async def unfreeze_player(data: dict, user: User = Depends(require_admin)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/unfreeze",
                json={"player_id": data.get("player_id"), "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fivem/give-money")
async def give_money(data: dict, user: User = Depends(require_admin)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/give-money",
                json={"player_id": data.get("player_id"), "amount": data.get("amount"), 
                      "account": data.get("account"), "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fivem/set-job")
async def set_job(data: dict, user: User = Depends(require_admin)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/set-job",
                json={"player_id": data.get("player_id"), "job": data.get("job"), 
                      "grade": data.get("grade"), "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fivem/give-item")
async def give_item(data: dict, user: User = Depends(require_admin)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/give-item",
                json={"player_id": data.get("player_id"), "item": data.get("item"), 
                      "count": data.get("count"), "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fivem/give-weapon")
async def give_weapon(data: dict, user: User = Depends(require_admin)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/give-weapon",
                json={"player_id": data.get("player_id"), "weapon": data.get("weapon"), 
                      "ammo": data.get("ammo"), "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fivem/bring")
async def bring_player(data: dict, user: User = Depends(require_admin)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/bring",
                json={"player_id": data.get("player_id"), "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fivem/goto")
async def goto_player(data: dict, user: User = Depends(require_admin)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/goto",
                json={"player_id": data.get("player_id"), "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fivem/spectate")
async def spectate_player(data: dict, user: User = Depends(require_admin)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/spectate",
                json={"player_id": data.get("player_id"), "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fivem/clear-inventory")
async def clear_inventory(data: dict, user: User = Depends(require_admin)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/clear-inventory",
                json={"player_id": data.get("player_id"), "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fivem/wipe-player")
async def wipe_player(data: dict, user: User = Depends(require_admin)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"http://{FIVEM_SERVER_IP}:{FIVEM_SERVER_PORT}/admin/wipe-player",
                json={"player_id": data.get("player_id"), "admin": user.username})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def check_probation_periods():
    """Background task to check and upgrade staff from probation"""
    while True:
        try:
            await asyncio.sleep(3600)  # Check every hour
            
            # Find users whose probation has ended
            now = datetime.now(timezone.utc).isoformat()
            expired_probations = await db.users.find({
                "on_probation": True,
                "probation_end_date": {"$lte": now}
            }).to_list(None)
            
            for user in expired_probations:
                print(f"🔄 Processing probation upgrade for {user['username']}")
                
                # Upgrade Discord roles
                success = await upgrade_from_probation(user['discord_id'])
                
                if success:
                    # Update database
                    await db.users.update_one(
                        {"discord_id": user["discord_id"]},
                        {"$set": {
                            "on_probation": False,
                            "probation_end_date": None
                        }}
                    )
                    print(f"✅ Successfully upgraded {user['username']} from probation")
                    
                    # Send DM to user
                    try:
                        if discord_bot_client and discord_bot_ready:
                            discord_user = await discord_bot_client.fetch_user(int(user['discord_id']))
                            if discord_user:
                                embed = discord.Embed(
                                    title="🎉 Probation Afsluttet!",
                                    description=f"Tillykke **{user['username']}**! Du har gennemført din probation periode.",
                                    color=discord.Color.green(),
                                    timestamp=datetime.now(timezone.utc)
                                )
                                embed.add_field(
                                    name="✅ Hvad betyder det?",
                                    value="• Du er nu fuldt staff medlem\n• Du har fået din permanente staff rolle\n• Fortsæt det gode arbejde!",
                                    inline=False
                                )
                                embed.set_footer(text="Redicate RP Staff System")
                                await discord_user.send(embed=embed)
                    except Exception as dm_error:
                        print(f"Could not send probation completion DM: {dm_error}")
                
        except Exception as e:
            print(f"Error in probation check: {e}")
            import traceback
            traceback.print_exc()

@app.on_event("startup")
async def startup_event():
    await init_discord_bot()
    # Start probation checker
    asyncio.create_task(check_probation_periods())

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    if discord_bot_client:
        await discord_bot_client.close()
