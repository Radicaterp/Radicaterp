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
from datetime import datetime, timezone
import httpx
import secrets
import discord
import asyncio

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

# Session storage
sessions = {}

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Discord Bot for sending embeds
discord_bot_client = None
discord_bot_ready = False

class DiscordBot(discord.Client):
    def __init__(self):
        intents = discord.Intents.default()
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
    role: Optional[str] = "player"  # player, staff, head_admin, super_admin
    team_id: Optional[str] = None  # Staff team ID
    staff_rank: Optional[str] = "mod_elev"  # mod_elev, moderator, administrator, senior_admin
    strikes: int = 0
    notes: List[dict] = []  # [{text: str, added_by: str, added_at: str}]
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

class ReportCreate(BaseModel):
    reported_player: str
    report_type: str
    description: str
    evidence: Optional[str] = None

class ReportUpdate(BaseModel):
    status: Literal["investigating", "resolved", "dismissed"]
    admin_notes: Optional[str] = None

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
                return False, "staff_member"  # Approved staff in team, but no admin access
            
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
        # Find a team to assign (use provided team_id or find first available team)
        if team_id:
            assigned_team = await db.staff_teams.find_one({"id": team_id}, {"_id": 0})
        else:
            # Auto-assign to first available team
            assigned_team = await db.staff_teams.find_one({}, {"_id": 0})
        
        # Update user role to staff_member with starting rank
        # NOTE: They get staff_member role, NOT admin access
        await db.users.update_one(
            {"discord_id": application["user_id"]},
            {"$set": {
                "role": "staff_member",
                "staff_rank": "mod_elev",
                "strikes": 0,
                "notes": [],
                "team_id": assigned_team["id"] if assigned_team else None,
                "is_admin": False,
                "is_head_admin": False
            }}
        )
        
        # Add Discord roles (perm staff + mod_elev rank)
        background_tasks.add_task(
            update_discord_roles,
            application["user_id"],
            "mod_elev",
            False
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
    
    await db.reports.update_one(
        {"id": report_id},
        {"$set": {
            "status": update.status,
            "admin_notes": update.admin_notes,
            "handled_by": user.username,
            "handled_at": datetime.now(timezone.utc).isoformat()
        }}
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
    """Remove a member from head admin's team"""
    team = await db.staff_teams.find_one({"head_admin_id": user.discord_id})
    if not team:
        raise HTTPException(status_code=404, detail="No team found")
    
    # Remove member from team
    await db.staff_teams.update_one(
        {"id": team["id"]},
        {"$pull": {"members": discord_id}}
    )
    
    # Update user's team_id
    await db.users.update_one(
        {"discord_id": discord_id},
        {"$set": {"team_id": None, "role": "player"}}
    )
    
    return {"success": True}

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

# Manual staff addition
@api_router.post("/add-staff")
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

@app.on_event("startup")
async def startup_event():
    await init_discord_bot()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    if discord_bot_client:
        await discord_bot_client.close()
