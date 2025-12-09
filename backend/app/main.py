from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import upload, datasources, dashboard_config

app = FastAPI(title="SimpleBI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(datasources.router)
app.include_router(dashboard_config.router)



@app.get("/")
def read_root():
    return {"message": "Welcome to SimpleBI Platform"}
