from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from .. import crud, models, schemas, security, database

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    admin = crud.get_admin_by_email(db, email=form_data.username)
    if not admin or not security.verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": admin.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Initial admin setup (if no admins exist)
@router.post("/setup-admin", response_model=schemas.Admin)
def setup_admin(admin: schemas.AdminCreate, db: Session = Depends(database.get_db)):
    existing_admins = crud.get_admins(db, limit=1)
    if existing_admins:
        raise HTTPException(status_code=400, detail="Admins already exist. Use admin panel to add more.")
    
    return crud.create_admin(db=db, admin=admin)
