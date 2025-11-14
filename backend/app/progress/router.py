from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta, date
from typing import Dict, List

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.conversation import Message, Conversation

router = APIRouter()

@router.get("/stats")
async def get_user_stats(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    # Get all study time
    total_messages_result = await db.execute(
        select(func.count(Message.message_id))
        .join(Conversation)
        .where(Conversation.user_id == current_user.user_id)
        .where(Message.role == "user")
    )
    total_messages = total_messages_result.scalar() or 0
    total_study_minutes = total_messages * 2
    total_study_hours = total_study_minutes / 60

    # Weekly goal
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())

    weekly_messages_result = await db.execute(
        select(func.count(Message.message_id))
        .join(Conversation)
        .where(Conversation.user_id == current_user.user_id)
        .where(Message.role == "user")
        .where(func.date(Message.created_at) >= start_of_week)
    )
    weekly_messages = weekly_messages_result.scalar() or 0
    weekly_study_minutes = weekly_messages * 2
    weekly_study_hours = weekly_study_minutes / 60

    weekly_goal = current_user.weekly_goal_hours or 10
    goal_progress = min(int((weekly_study_hours / weekly_goal) * 100), 100)

    #Day streak

    year_ago = today - timedelta(days=365)

    dates_result = await db.execute(
        select(
            func.date(Message.created_at).label('date'),
            func.count(Message.message_id).label('count')
        )
        .join(Conversation)
        .where(Conversation.user_id == current_user.user_id)
        .where(Message.role == "user")
        .where(func.date(Message.created_at) >= year_ago)
        .group_by(func.date(Message.created_at))
        .order_by(func.date(Message.created_at).desc())
    )

    activity_dates = {row.date: row.count for row in dates_result.all()}

    #Count streak
    streak = 0
    current_check_date = today

    while current_check_date >= year_ago:
        message_count = activity_dates.get(current_check_date, 0)

        if message_count >= 3:
            streak += 1
            current_check_date -= timedelta(days=1)
        else:
            #Break the streak if there is no activity
            break

    return {
        "study_time": {
            "hours": round(total_study_hours, 1),
            "minutes": total_study_minutes,
            "change": "This week"
        },
        "weekly_goal": {
            "current_hours": round(weekly_study_hours, 1),
            "goal_hours": weekly_goal,
            "percent": goal_progress,
            "messages_this_week": weekly_messages,
        },
        "day_streak": {
            "days": streak,
            "status": "Keep it going!" if streak > 0 else "Start your streak today!"
        }
    }

@router.get("/activity")
async def get_activity_heatmap(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    #Get data for heatmap for 52 weeks
    end_date = date.today()
    start_date = end_date - timedelta(days=363)

    result = await db.execute(
        select(
            func.date(Message.created_at).label('date'),
            func.count(Message.message_id).label('count')
        )
        .join(Conversation)
        .where(Conversation.user_id == current_user.user_id)
        .where(Message.role == "user")
        .where(func.date(Message.created_at) >= start_date)
        .group_by(func.date(Message.created_at))
    )

    activity_map = {str(row.date): row.count for row in result.all()}

    daily_activity = []
    current = start_date
    while current <= end_date:
        count = activity_map.get(str(current), 0)
        daily_activity.append({
            "date": str(current),
            "count": count,
            "level": get_activity_level(count)
        })
        current += timedelta(days=1)

    return {
        "activity": daily_activity,
        "total_days": len(daily_activity)
    }

def get_activity_level(count: int) -> str:
    if count == 0:
        return "none"
    elif count < 5:
        return "low"
    elif count < 10:
        return "medium"
    else:
        return "high"