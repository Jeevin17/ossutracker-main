from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import re
import requests
import json
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="OSSU Course Tracker API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class CourseStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class CourseDifficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"  
    ADVANCED = "advanced"

class CourseCategory(str, Enum):
    PREREQUISITES = "prerequisites"
    INTRO_CS = "intro_cs"
    CORE_PROGRAMMING = "core_programming"
    CORE_MATH = "core_math"
    CS_TOOLS = "cs_tools"
    CORE_SYSTEMS = "core_systems"
    CORE_THEORY = "core_theory"
    CORE_SECURITY = "core_security"
    CORE_APPLICATIONS = "core_applications"
    CORE_ETHICS = "core_ethics"
    ADVANCED_PROGRAMMING = "advanced_programming"
    ADVANCED_SYSTEMS = "advanced_systems"
    ADVANCED_THEORY = "advanced_theory"
    ADVANCED_SECURITY = "advanced_security"
    ADVANCED_MATH = "advanced_math"
    FINAL_PROJECT = "final_project"

# Models
class Course(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    url: str
    ossu_url: str  # Direct link to OSSU course page
    duration_weeks: Optional[int] = None
    effort_hours_per_week: Optional[str] = None
    prerequisites: List[str] = []
    category: CourseCategory
    difficulty: CourseDifficulty = CourseDifficulty.INTERMEDIATE
    topics_covered: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"  # For MVP, using single user
    course_id: str
    status: CourseStatus = CourseStatus.NOT_STARTED
    completion_percentage: int = 0
    time_spent_hours: float = 0.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CourseCreate(BaseModel):
    title: str
    description: str
    url: str
    ossu_url: str
    duration_weeks: Optional[int] = None
    effort_hours_per_week: Optional[str] = None
    prerequisites: List[str] = []
    category: CourseCategory
    difficulty: CourseDifficulty = CourseDifficulty.INTERMEDIATE
    topics_covered: List[str] = []

class ProgressUpdate(BaseModel):
    status: Optional[CourseStatus] = None
    completion_percentage: Optional[int] = None
    time_spent_hours: Optional[float] = None
    notes: Optional[str] = None

class CourseWithProgress(Course):
    progress: Optional[UserProgress] = None

# Utility functions for cleaning course descriptions
def clean_description(raw_description: str) -> str:
    """Clean noisy course descriptions by removing markdown artifacts and excessive formatting."""
    if not raw_description:
        return ""
    
    # Remove markdown links but keep the text
    cleaned = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', raw_description)
    
    # Remove excessive asterisks and backticks
    cleaned = re.sub(r'\*{2,}', '', cleaned)
    cleaned = re.sub(r'`{1,}', '', cleaned)
    
    # Clean up multiple spaces and newlines
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = re.sub(r'\n\s*\n', '\n', cleaned)
    
    # Remove common noise patterns
    noise_patterns = [
        r'Computer Science • Core programming',
        r'Topics covered:',
        r'\*\*Topics covered\*\*:',
        r'and more`?',
        r'`[^`]*`',  # Remove remaining backtick content
    ]
    
    for pattern in noise_patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
    
    return cleaned.strip()

def parse_topics_covered(topics_string: str) -> List[str]:
    """Parse topics covered from the curriculum format."""
    if not topics_string:
        return []
    
    # Remove backticks and split by common delimiters
    topics_string = re.sub(r'`', '', topics_string)
    topics = re.split(r'[,•]', topics_string)
    
    # Clean each topic
    cleaned_topics = []
    for topic in topics:
        topic = topic.strip()
        if topic and topic.lower() not in ['and more', 'more']:
            cleaned_topics.append(topic)
    
    return cleaned_topics

# API Routes
@api_router.get("/")
async def root():
    return {"message": "OSSU Course Tracker API", "version": "1.0.0"}

@api_router.post("/courses", response_model=Course)
async def create_course(course_data: CourseCreate):
    """Create a new course."""
    course_dict = course_data.dict()
    course_dict["description"] = clean_description(course_dict["description"])
    course = Course(**course_dict)
    
    await db.courses.insert_one(course.dict())
    return course

@api_router.get("/courses", response_model=List[CourseWithProgress])
async def get_courses(category: Optional[CourseCategory] = None):
    """Get all courses with progress information."""
    query = {}
    if category:
        query["category"] = category
    
    courses = await db.courses.find(query).to_list(1000)
    courses_with_progress = []
    
    for course_data in courses:
        course = Course(**course_data)
        
        # Get user progress for this course
        progress_data = await db.user_progress.find_one({
            "course_id": course.id,
            "user_id": "default_user"
        })
        
        progress = None
        if progress_data:
            progress = UserProgress(**progress_data)
        
        course_with_progress = CourseWithProgress(**course.dict(), progress=progress)
        courses_with_progress.append(course_with_progress)
    
    return courses_with_progress

@api_router.get("/courses/{course_id}", response_model=CourseWithProgress)
async def get_course(course_id: str):
    """Get a specific course with progress."""
    course_data = await db.courses.find_one({"id": course_id})
    if not course_data:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course = Course(**course_data)
    
    # Get user progress
    progress_data = await db.user_progress.find_one({
        "course_id": course_id,
        "user_id": "default_user"
    })
    
    progress = None
    if progress_data:
        progress = UserProgress(**progress_data)
    
    return CourseWithProgress(**course.dict(), progress=progress)

@api_router.post("/courses/{course_id}/progress", response_model=UserProgress)
async def update_progress(course_id: str, progress_update: ProgressUpdate):
    """Update user progress for a course."""
    # Check if course exists
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if progress record exists
    existing_progress = await db.user_progress.find_one({
        "course_id": course_id,
        "user_id": "default_user"
    })
    
    if existing_progress:
        # Update existing progress
        update_data = progress_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        # Set timestamps based on status
        if progress_update.status == CourseStatus.IN_PROGRESS and not existing_progress.get("started_at"):
            update_data["started_at"] = datetime.utcnow()
        elif progress_update.status == CourseStatus.COMPLETED:
            update_data["completed_at"] = datetime.utcnow()
            update_data["completion_percentage"] = 100
        
        await db.user_progress.update_one(
            {"id": existing_progress["id"]},
            {"$set": update_data}
        )
        
        updated_progress = await db.user_progress.find_one({"id": existing_progress["id"]})
        return UserProgress(**updated_progress)
    else:
        # Create new progress record
        progress_data = {
            "course_id": course_id,
            "user_id": "default_user",
            **progress_update.dict(exclude_unset=True)
        }
        
        if progress_update.status == CourseStatus.IN_PROGRESS:
            progress_data["started_at"] = datetime.utcnow()
        elif progress_update.status == CourseStatus.COMPLETED:
            progress_data["completed_at"] = datetime.utcnow()
            progress_data["completion_percentage"] = 100
        
        progress = UserProgress(**progress_data)
        await db.user_progress.insert_one(progress.dict())
        return progress

@api_router.post("/sync-ossu-courses")
async def sync_ossu_courses():
    """Sync courses from OSSU Computer Science curriculum by parsing the GitHub repository."""
    try:
        logger.info("Starting OSSU course sync...")
        
        # Import the parser (absolute import)
        from ossu_parser import OSSSUCurriculumParser
        
        parser = OSSSUCurriculumParser()
        course_data_list = parser.parse_ossu_curriculum()
        
        synced_count = 0
        updated_count = 0
        
        for course_data in course_data_list:
            # Check if course already exists (by title and category)
            existing = await db.courses.find_one({
                "title": course_data["title"],
                "category": course_data["category"]
            })
            
            if existing:
                # Update existing course
                await db.courses.update_one(
                    {"id": existing["id"]},
                    {"$set": {**course_data, "updated_at": datetime.utcnow()}}
                )
                updated_count += 1
            else:
                # Create new course
                course = Course(**course_data)
                await db.courses.insert_one(course.dict())
                synced_count += 1
        
        logger.info(f"OSSU sync completed: {synced_count} new, {updated_count} updated")
        
        return {
            "message": f"Successfully synced OSSU curriculum",
            "new_courses": synced_count,
            "updated_courses": updated_count,
            "total_processed": len(course_data_list)
        }
    
    except Exception as e:
        logger.error(f"Failed to sync OSSU courses: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to sync courses: {str(e)}")

@api_router.get("/categories", response_model=List[str])
async def get_categories():
    """Get all available course categories."""
    return [category.value for category in CourseCategory]

@api_router.get("/progress/summary")
async def get_progress_summary():
    """Get user progress summary statistics."""
    total_courses = await db.courses.count_documents({})
    
    progress_data = await db.user_progress.find({"user_id": "default_user"}).to_list(1000)
    
    completed_count = len([p for p in progress_data if p["status"] == CourseStatus.COMPLETED])
    in_progress_count = len([p for p in progress_data if p["status"] == CourseStatus.IN_PROGRESS])
    total_time_spent = sum([p.get("time_spent_hours", 0) for p in progress_data])
    
    return {
        "total_courses": total_courses,
        "completed_courses": completed_count,
        "in_progress_courses": in_progress_count,
        "not_started_courses": total_courses - completed_count - in_progress_count,
        "total_time_spent_hours": total_time_spent,
        "completion_percentage": round((completed_count / total_courses * 100) if total_courses > 0 else 0, 1)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()