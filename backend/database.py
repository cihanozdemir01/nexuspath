from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Veritabanı dosyasının adını ve yolunu belirliyoruz.
# SQLite kullanacağımız için bu sadece bir dosya adı olacak.
SQLALCHEMY_DATABASE_URL = "sqlite:///./nexuspath.db"

# 2. SQLAlchemy "engine"ini oluşturuyoruz. Bu, veritabanına ana bağlantı noktasıdır.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # Bu ayar sadece SQLite için gereklidir. Farklı thread'lerin aynı bağlantıyı paylaşmasına izin verir.
    connect_args={"check_same_thread": False} 
)

# 3. Veritabanı oturumları oluşturmak için bir "fabrika" (SessionLocal) tanımlıyoruz.
# Bu oturumlar, veritabanı ile yapacağımız konuşmaları (işlemleri) temsil edecek.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Modellerimizin (veritabanı tablolarımızın) miras alacağı bir ana sınıf (Base) oluşturuyoruz.
Base = declarative_base()