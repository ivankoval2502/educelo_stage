from fastapi import APIRouter, HTTPException, status
from datetime import datetime
import random
from app.schemas.plan import PlanUpdate, PlanResponse, PlanCreate

plans = [
    PlanResponse(
        id=123,
        title="mock1",
        description="description1",
        base_prompt="prompt1",
        created_at=datetime.now()
    ),
    PlanResponse(
        id=456,
        title="mock2",
        description="description2",
        base_prompt="prompt2",
        created_at=datetime.now()
    ),
    PlanResponse(
        id=123456,
        title="mock3",
        description="description3",
        base_prompt="prompt3",
        created_at=datetime.now()
    )
]

router = APIRouter()

@router.post("/plans", response_model=PlanResponse, status_code=201)
async def create_plan(plan: PlanCreate):
    mocked_plan = PlanResponse(
        id=random.randint(0,10000),
        title=plan.title,
        description=plan.description,
        base_prompt=plan.base_prompt,
        created_at=datetime.now()
    )
    return mocked_plan

@router.get("/plans")
async def get_plans():
    return plans

@router.get("/plans/{plan_id}")
async def get_plan_by_id(plan_id: int):
    for plan in plans:
        if plan.id == plan_id:
            return plan
    raise HTTPException(status_code=404, detail="Plan not found")

@router.put("/plans/{plan_id}")
async def update_plan(plan_id: int, plan_update: PlanUpdate):
    return plan_update

@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(plan_id: int):
    for plan in plans:
        if plan.id == plan_id:
            plans.remove(plan)
            return
    raise HTTPException(status_code=404, detail="Plan not found")