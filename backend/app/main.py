"""
Nutrix API.

    routers/        HTTP endpoints only (upload, data, statistics, optimization)
    preprocessing/  cleaning applied to every upload
    statistics/     descriptive statistics, distribution, correlation
    optimization/   Problem 1 (LP) and Problem 2 (MILP)
    columns.py      which dataset column holds what
    storage.py      where uploaded datasets are kept
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import upload, statistics, data, optimization

app = FastAPI(title="Nutrix API")

# Configure CORS so the React frontend can communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/api/health")
def read_root():
    return {"message": "Backend is running"}

# Include routers
app.include_router(upload.router)
app.include_router(statistics.router)
app.include_router(data.router)
app.include_router(optimization.router)
