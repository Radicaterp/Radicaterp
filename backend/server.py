from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Discord OAuth Config
DISCORD_CLIENT_ID = os.environ.get('DISCORD_CLIENT_ID', '1443501738899406858')
DISCORD_CLIENT_SECRET = os.environ.get('DISCORD_CLIENT_SECRET', 'Cbb5n5vmgzU2QA_nCSztIyPyOIkvPiKz')
DISCORD_REDIRECT_URI = os.environ.get('DISCORD_REDIRECT_URI', 'https://team-management-10.preview.emergentagent.com/auth/callback')
DISCORD_API_ENDPOINT = 'https://discord.com/api/v10'

# Session storage (in production, use Redis)
sessions = {}

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    discord_id: str
    username: str
    avatar: Optional[str] = None
    role: Literal["player", "staff", "head_admin", "owner"] = "player"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Team(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    type: Literal["staff", "whitelist"] = "whitelist"
    icon: Optional[str] = None
    color: Optional[str] = "#4A90E2"
    members: List[str] = []  # Discord IDs
    created_by: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TeamCreate(BaseModel):
    name: str
    description: str
    type: Literal["staff", "whitelist"] = "whitelist"
    icon: Optional[str] = None
    color: Optional[str] = "#4A90E2"

class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Discord ID
    username: str
    team_id: str
    team_name: str
    type: Literal["staff", "whitelist"]
    status: Literal["pending", "approved", "rejected"] = "pending"
    answers: dict  # Form answers
    submitted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None

class ApplicationCreate(BaseModel):
    team_id: str
    answers: dict

class ApplicationReview(BaseModel):
    status: Literal["approved", "rejected"]

class UserRoleUpdate(BaseModel):
    role: Literal["player", "staff", "head_admin", "owner"]

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
    if user.role not in ["head_admin", "owner"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_owner(request: Request) -> User:
    user = await require_auth(request)
    if user.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    return user

# Discord OAuth endpoints
@api_router.get("/auth/login")
async def discord_login():
    oauth_url = (
        f"https://discord.com/api/oauth2/authorize?"
        f"client_id={DISCORD_CLIENT_ID}&"
        f"redirect_uri={DISCORD_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=identify"
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
        
        # Check if user exists
        existing_user = await db.users.find_one({"discord_id": discord_id})
        
        if not existing_user:
            # Create new user
            user_obj = User(
                discord_id=discord_id,
                username=username,
                avatar=avatar,
                role="player"
            )
            await db.users.insert_one(user_obj.model_dump())
        else:
            # Update username/avatar
            await db.users.update_one(
                {"discord_id": discord_id},
                {"$set": {"username": username, "avatar": avatar}}
            )
        
        # Create session
        session_token = secrets.token_urlsafe(32)
        sessions[session_token] = discord_id
        
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            max_age=7 * 24 * 60 * 60,  # 7 days
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

# Team endpoints
@api_router.get("/teams", response_model=List[Team])
async def get_teams():
    teams = await db.teams.find({}, {"_id": 0}).to_list(1000)
    return teams

@api_router.post("/teams", response_model=Team)
async def create_team(team_data: TeamCreate, user: User = Depends(require_admin)):
    team = Team(**team_data.model_dump(), created_by=user.discord_id)
    await db.teams.insert_one(team.model_dump())
    return team

@api_router.get("/teams/{team_id}", response_model=Team)
async def get_team(team_id: str):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return Team(**team)

@api_router.put("/teams/{team_id}", response_model=Team)
async def update_team(team_id: str, team_data: TeamCreate, user: User = Depends(require_admin)):
    result = await db.teams.update_one(
        {"id": team_id},
        {"$set": team_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    return Team(**team)

@api_router.delete("/teams/{team_id}")
async def delete_team(team_id: str, user: User = Depends(require_admin)):
    result = await db.teams.delete_one({"id": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"success": True}

@api_router.post("/teams/{team_id}/members/{discord_id}")
async def add_team_member(team_id: str, discord_id: str, user: User = Depends(require_admin)):
    result = await db.teams.update_one(
        {"id": team_id},
        {"$addToSet": {"members": discord_id}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"success": True}

@api_router.delete("/teams/{team_id}/members/{discord_id}")
async def remove_team_member(team_id: str, discord_id: str, user: User = Depends(require_admin)):
    result = await db.teams.update_one(
        {"id": team_id},
        {"$pull": {"members": discord_id}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"success": True}

# Application endpoints
@api_router.get("/applications", response_model=List[Application])
async def get_applications(user: User = Depends(require_auth)):
    # Admin sees all, users see only their own
    if user.role in ["head_admin", "owner"]:
        applications = await db.applications.find({}, {"_id": 0}).to_list(1000)
    else:
        applications = await db.applications.find({"user_id": user.discord_id}, {"_id": 0}).to_list(1000)
    
    return applications

@api_router.post("/applications", response_model=Application)
async def create_application(app_data: ApplicationCreate, user: User = Depends(require_auth)):
    # Get team info
    team = await db.teams.find_one({"id": app_data.team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if user already has pending application for this team
    existing = await db.applications.find_one({
        "user_id": user.discord_id,
        "team_id": app_data.team_id,
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending application for this team")
    
    application = Application(
        user_id=user.discord_id,
        username=user.username,
        team_id=app_data.team_id,
        team_name=team["name"],
        type=team["type"],
        answers=app_data.answers
    )
    
    await db.applications.insert_one(application.model_dump())
    return application

@api_router.get("/applications/{app_id}", response_model=Application)
async def get_application(app_id: str, user: User = Depends(require_auth)):
    application = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Users can only see their own applications
    if user.role not in ["head_admin", "owner"] and application["user_id"] != user.discord_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Application(**application)

@api_router.post("/applications/{app_id}/review")
async def review_application(app_id: str, review: ApplicationReview, user: User = Depends(require_admin)):
    application = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Update application status
    await db.applications.update_one(
        {"id": app_id},
        {"$set": {
            "status": review.status,
            "reviewed_by": user.discord_id,
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # If approved, add to team and update user role
    if review.status == "approved":
        # Add to team
        await db.teams.update_one(
            {"id": application["team_id"]},
            {"$addToSet": {"members": application["user_id"]}}
        )
        
        # If it's a staff application, update user role
        if application["type"] == "staff":
            await db.users.update_one(
                {"discord_id": application["user_id"]},
                {"$set": {"role": "staff"}}
            )
    
    return {"success": True}

# User management endpoints
@api_router.get("/users", response_model=List[User])
async def get_users(user: User = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.put("/users/{discord_id}/role")
async def update_user_role(discord_id: str, role_data: UserRoleUpdate, user: User = Depends(require_owner)):
    result = await db.users.update_one(
        {"discord_id": discord_id},
        {"$set": {"role": role_data.role}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}

# Stats endpoint
@api_router.get("/stats")
async def get_stats(user: User = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_teams = await db.teams.count_documents({})
    pending_apps = await db.applications.count_documents({"status": "pending"})
    staff_count = await db.users.count_documents({"role": {"$in": ["staff", "head_admin", "owner"]}})
    
    return {
        "total_users": total_users,
        "total_teams": total_teams,
        "pending_applications": pending_apps,
        "staff_count": staff_count
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
