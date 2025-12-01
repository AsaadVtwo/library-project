from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, models, schemas, database

router = APIRouter(
    prefix="/loans",
    tags=["loans"],
)

@router.post("/", response_model=schemas.Loan)
def create_loan(loan: schemas.LoanCreate, db: Session = Depends(database.get_db)):
    # Check if book is available
    book = crud.get_book(db, book_id=loan.book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if not book.is_available:
        raise HTTPException(status_code=400, detail="Book is already loaned")
        
    return crud.create_loan(db=db, loan=loan)

@router.get("/", response_model=List[schemas.Loan])
def read_loans(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    loans = crud.get_loans(db, skip=skip, limit=limit)
    return loans

@router.put("/{loan_id}/return", response_model=schemas.Loan)
def return_book(loan_id: int, db: Session = Depends(database.get_db)):
    loan = crud.return_book(db, loan_id=loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan
