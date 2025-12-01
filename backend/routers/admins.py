from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, models, schemas, database

router = APIRouter(
    prefix="/admins",
    tags=["admins"],
)

@router.post("/", response_model=schemas.Admin)
def create_admin(admin: schemas.AdminCreate, db: Session = Depends(database.get_db)):
    db_admin = crud.get_admin_by_email(db, email=admin.email)
    if db_admin:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_admin(db=db, admin=admin)

@router.get("/", response_model=List[schemas.Admin])
def read_admins(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    admins = crud.get_admins(db, skip=skip, limit=limit)
    return admins

@router.get("/{admin_id}", response_model=schemas.Admin)
def read_admin(admin_id: int, db: Session = Depends(database.get_db)):
    db_admin = crud.get_admin(db, admin_id=admin_id)
    if db_admin is None:
        raise HTTPException(status_code=404, detail="Admin not found")
    return db_admin

@router.put("/{admin_id}", response_model=schemas.Admin)
def update_admin(admin_id: int, admin: schemas.AdminUpdate, db: Session = Depends(database.get_db)):
    db_admin = crud.get_admin(db, admin_id=admin_id)
    if db_admin is None:
        raise HTTPException(status_code=404, detail="Admin not found")
    return crud.update_admin(db=db, admin_id=admin_id, admin_update=admin)

@router.delete("/{admin_id}", response_model=schemas.Admin)
def delete_admin(admin_id: int, db: Session = Depends(database.get_db)):
    db_admin = crud.get_admin(db, admin_id=admin_id)
    if db_admin is None:
        raise HTTPException(status_code=404, detail="Admin not found")
    return crud.delete_admin(db=db, admin_id=admin_id)
