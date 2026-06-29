from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserResponse, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Create or retrieve a user by name (simple session-based identity)."""
    user = User(name=payload.name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
