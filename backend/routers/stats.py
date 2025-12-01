from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import crud, models, database

router = APIRouter(
    prefix="/stats",
    tags=["stats"],
)

@router.get("/")
def get_stats(db: Session = Depends(database.get_db)):
    total_books = db.query(models.Book).count()
    total_users = db.query(models.User).count()
    active_loans = db.query(models.Loan).filter(models.Loan.return_date == None).count()
    overdue_loans = 0 # Calculate if needed, but simple count is fast
    
    return {
        "total_books": total_books,
        "total_users": total_users,
        "active_loans": active_loans
    }
