from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, BackgroundTasks
from fastapi.responses import RedirectResponse, JSONResponse
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
DISCORD_ADMIN_ROLE_ID = os.environ.get('DISCORD_ADMIN_ROLE_ID')
DISCORD_SUPER_ADMIN_ROLE_ID = os.environ.get('DISCORD_SUPER_ADMIN_ROLE_ID', '1337859475184291922')
DISCORD_HEAD_ADMIN_ROLE_ID = os.environ.get('DISCORD_HEAD_ADMIN_ROLE_ID', '1337859466544021561')
DISCORD_GUILD_ID = os.environ.get('DISCORD_GUILD_ID')
DISCORD_CHANNEL_ID = os.environ.get('DISCORD_CHANNEL_ID')
DISCORD_API_ENDPOINT = 'https://discord.com/api/v10'

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

async def send_discord_embed(user_id: str, username: str, app_type: str, status: str, reviewed_by: str):
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
        embed.set_footer(text="Redicate RP", icon_url="https://customer-assets.emergentagent.com/job_team-management-10/artifacts/pa8pgywq_7442CFA2-6A1F-48F7-81A5-9E9889D2D616-removebg-preview.png")
        
        await channel.send(embed=embed)
        print(f"Sent Discord embed for {username}")
    except Exception as e:
        print(f"Failed to send Discord embed: {e}")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    discord_id: str
    username: str
    avatar: Optional[str] = None
    is_admin: bool = False
    role: Optional[str] = "player"  # player, staff, head_admin, super_admin
    team_id: Optional[str] = None  # Staff team ID
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
            
            # Check role hierarchy
            if DISCORD_SUPER_ADMIN_ROLE_ID in roles:
                return True, "super_admin"
            elif DISCORD_HEAD_ADMIN_ROLE_ID in roles:
                return True, "head_admin"
            elif DISCORD_ADMIN_ROLE_ID in roles:
                return True, "staff"
            
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
        
        # Check if user exists
        existing_user = await db.users.find_one({"discord_id": discord_id})
        
        if not existing_user:
            user_obj = User(
                discord_id=discord_id,
                username=username,
                avatar=avatar,
                is_admin=is_admin,
                role=role_type
            )
            await db.users.insert_one(user_obj.model_dump())
        else:
            await db.users.update_one(
                {"discord_id": discord_id},
                {"$set": {"username": username, "avatar": avatar, "is_admin": is_admin, "role": role_type}}
            )
        
        # Create session
        session_token = secrets.token_urlsafe(32)
        sessions[session_token] = discord_id
        
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            max_age=7 * 24 * 60 * 60,
            samesite="lax"
        )
        
        return {"success": True, "discord_id": discord_id}

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
    user: User = Depends(require_admin)
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
    
    # Send Discord embed in background
    background_tasks.add_task(
        send_discord_embed,
        application["user_id"],
        application["username"],
        application["application_type_name"],
        review.status,
        user.username
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

# Staff endpoint
@api_router.get("/staff")
async def get_staff():
    staff = await db.users.find(
        {"is_admin": True},
        {"_id": 0, "discord_id": 1, "username": 1, "avatar": 1, "is_admin": 1}
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
