from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from .. import crud, models, schemas, database, ai_service, qr_service
import shutil

router = APIRouter(
    prefix="/books",
    tags=["books"],
)

@router.post("/", response_model=schemas.Book)
def create_book(book: schemas.BookCreate, db: Session = Depends(database.get_db)):
    # Generate QR Code
    # For simplicity, we use ISBN or Title as data
    qr_data = book.isbn if book.isbn else book.title
    book_data = book.dict()
    
    # Create DB object first to get ID? No, we can generate QR before.
    # Actually, let's create book then update QR? Or just save QR data string.
    # The model has qr_code_data which stores the string content or the image url?
    # Let's store the base64 image or just the data.
    # The requirement is to "print qr". So we need to be able to generate it.
    # Let's store the data string in DB, and generate image on demand or store image.
    # For now, we'll just store the data string.
    
    # Handle empty ISBN to avoid unique constraint violation on empty strings
    if book.isbn == "":
        book.isbn = None
        
    return crud.create_book(db=db, book=book)

@router.get("/", response_model=List[schemas.Book])
def read_books(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    books = crud.get_books(db, skip=skip, limit=limit)
    return books

@router.get("/{book_id}", response_model=schemas.Book)
def read_book(book_id: int, db: Session = Depends(database.get_db)):
    db_book = crud.get_book(db, book_id=book_id)
    if db_book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return db_book

@router.post("/analyze")
async def analyze_book_cover(file: UploadFile = File(...)):
    contents = await file.read()
    # Call AI Service
    result = ai_service.analyze_book_cover(contents)
    return result

@router.get("/{book_id}/qr")
def get_book_qr(book_id: int, db: Session = Depends(database.get_db)):
    db_book = crud.get_book(db, book_id=book_id)
    if db_book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Generate QR with ID for easy scanning
    data = str(db_book.id)
    qr_image = qr_service.generate_qr_code(data)
    data = str(db_book.id)
    qr_image = qr_service.generate_qr_code(data)
    return {"qr_image": qr_image}

@router.put("/{book_id}", response_model=schemas.Book)
def update_book(book_id: int, book: schemas.BookCreate, db: Session = Depends(database.get_db)):
    db_book = crud.get_book(db, book_id=book_id)
    if db_book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.isbn == "":
        book.isbn = None
        
    return crud.update_book(db=db, book_id=book_id, book_update=book)

@router.delete("/{book_id}", response_model=schemas.Book)
def delete_book(book_id: int, db: Session = Depends(database.get_db)):
    db_book = crud.get_book(db, book_id=book_id)
    if db_book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return crud.delete_book(db=db, book_id=book_id)
