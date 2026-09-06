import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = None
SessionLocal = None

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception:
    pass


def db_is_available():
    if SessionLocal is None:
        return False
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            return True
        finally:
            db.close()
    except Exception:
        return False


def get_db():
    if SessionLocal is None:
        raise OperationalError(
            "Base de datos no disponible. DATABASE_URL no configurada.",
            {},
            Exception("No database"),
        )
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
