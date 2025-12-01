from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import books, users, loans, stats, auth, admins

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Library System")

# CORS Configuration
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router)
app.include_router(users.router)
app.include_router(loans.router)
app.include_router(stats.router)
app.include_router(auth.router)
app.include_router(admins.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Library System API"}
