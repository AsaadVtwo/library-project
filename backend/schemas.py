from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Book Schemas
class BookBase(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    cover_image_url: Optional[str] = None
    summary: Optional[str] = None

class BookCreate(BookBase):
    pass

class Book(BookBase):
    id: int
    is_available: bool
    qr_code_data: Optional[str] = None

    class Config:
        orm_mode = True

# User Schemas
class UserBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    telegram_chat_id: Optional[str] = None

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    loans: List['Loan'] = []

    class Config:
        orm_mode = True

# Loan Schemas
class LoanBase(BaseModel):
    book_id: int
    user_id: int
    due_date: datetime

class LoanCreate(LoanBase):
    pass

class Loan(LoanBase):
    id: int
    loan_date: datetime
    return_date: Optional[datetime] = None

    class Config:
        orm_mode = True

# Admin Schemas
class AdminBase(BaseModel):
    email: str
    name: str

class AdminCreate(AdminBase):
    password: str

class AdminUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    password: Optional[str] = None

class Admin(AdminBase):
    id: int
    is_superadmin: bool

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
