from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import crud, models

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        'Welcome to the AI Library Bot!\n'
        'Commands:\n'
        '/search <query> - Search for books\n'
        '/register <email> - Link your account\n'
        '/myloans - Check your active loans'
    )

async def search(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = " ".join(context.args)
    if not query:
        await update.message.reply_text('Please provide a search query. Usage: /search <title>')
        return
    
    db = SessionLocal()
    # Simple search by title
    books = db.query(models.Book).filter(models.Book.title.contains(query)).all()
    db.close()
    
    if not books:
        await update.message.reply_text('No books found.')
        return
        
    response = "Found books:\n"
    for book in books:
        status = "Available" if book.is_available else "Loaned"
        response += f"- {book.title} by {book.author} ({status})\n"
        
    await update.message.reply_text(response)

async def register(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    email = " ".join(context.args)
    if not email:
        await update.message.reply_text('Please provide your email. Usage: /register <email>')
        return
        
    chat_id = str(update.effective_chat.id)
    db = SessionLocal()
    user = crud.get_user_by_email(db, email)
    
    if user:
        user.telegram_chat_id = chat_id
        db.commit()
        await update.message.reply_text(f'Successfully linked to user: {user.name}')
    else:
        await update.message.reply_text('User not found with that email.')
    db.close()

async def myloans(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = str(update.effective_chat.id)
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.telegram_chat_id == chat_id).first()
    
    if not user:
        await update.message.reply_text('You are not registered. Use /register <email> first.')
        db.close()
        return
        
    loans = db.query(models.Loan).filter(models.Loan.user_id == user.id, models.Loan.return_date == None).all()
    
    if not loans:
        await update.message.reply_text('You have no active loans.')
    else:
        response = "Your active loans:\n"
        for loan in loans:
            book = crud.get_book(db, loan.book_id)
            response += f"- {book.title} (Due: {loan.due_date.date()})\n"
        await update.message.reply_text(response)
    
    db.close()

def run_bot():
    if not TOKEN:
        print("Telegram Token not found.")
        return

    application = Application.builder().token(TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("search", search))
    application.add_handler(CommandHandler("register", register))
    application.add_handler(CommandHandler("myloans", myloans))

    print("Starting Telegram Bot...")
    application.run_polling()

if __name__ == "__main__":
    run_bot()
