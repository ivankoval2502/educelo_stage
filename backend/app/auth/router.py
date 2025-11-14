from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.auth.schemas import UserRegister, UserResponse, Token, UserUpdate, PasswordChange, GoalUpdate
from app.auth.dependencies import get_current_active_user
from app.core.security import hash_password, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.database import get_db
from app.models.user import User

router = APIRouter()

fake_users_db = {}

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == user.email))
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return UserResponse(
        user_id=new_user.user_id,
        username=new_user.username,
        email=new_user.email,
        is_active=new_user.is_active,
        created_at=new_user.created_at
    )

@router.post("/login", response_model=Token)
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: AsyncSession = Depends(get_db)
):

    result = await db.execute(select(User).filter(User.email == form_data.username))
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return Token(access_token=access_token)


@router.get("/me")
async def get_me(
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db)
):
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "email": current_user.email,
        "created_at": current_user.created_at,
        "weekly_goal_hours": current_user.weekly_goal_hours or 10,
        "goal_last_updated": str(current_user.goal_last_updated) if current_user.goal_last_updated else None
    }

@router.patch("/me")
async def update_user_profile(
        user_update: UserUpdate,
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db)
):
    # Проверка username
    if user_update.username:
        result = await db.execute(
            select(User).where(
                User.username == user_update.username,
                User.user_id != current_user.user_id
            )
        )
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Username already taken")

        current_user.username = user_update.username

    # ✅ Проверка email НА ОДНОМ УРОВНЕ с username
    if user_update.email:
        result = await db.execute(
            select(User).where(
                User.email == user_update.email,
                User.user_id != current_user.user_id
            )
        )
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Email already taken")

        current_user.email = user_update.email

    await db.commit()
    await db.refresh(current_user)

    return {
        "message": "Profile updated successfully",
        "user": {
            "username": current_user.username,
            "email": current_user.email
        }
    }

@router.post("/change-password")
async def change_password(
        password_data: PasswordChange,
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db)
):
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    current_user.hashed_password = hash_password(password_data.new_password)

    await db.commit()

    return {"message": "Password changed successfully"}

@router.patch("/goal")
async def update_weekly_goal(
        goal_update: GoalUpdate,
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db)
):
    from datetime import date, timedelta

    today = date.today()

    if current_user.goal_last_updated:
        days_since_update = (today - current_user.goal_last_updated).days
        if days_since_update < 7:
            days_remaining = 7 - days_since_update
            raise HTTPException(
                status_code=400,
                detail=f"Goal can only be updated once per week. Please wait {days_remaining} days."
            )

    # ✅ ЭТО ДОЛЖНО БЫТЬ ВНЕ if
    current_user.weekly_goal_hours = goal_update.weekly_goal_hours
    current_user.goal_last_updated = today

    await db.commit()
    await db.refresh(current_user)

    return {
        "message": "Goal updated successfully",
        "weekly_goal_hours": current_user.weekly_goal_hours,
        "next_update_available": str(today + timedelta(days=7))
    }



