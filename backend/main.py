from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import FastAPI
from .database import engine, Base
from . import models, schemas, crud
from .database import SessionLocal
from typing import List


# 1. Modellerimizi kullanarak veritabanında tabloları oluşturması için SQLAlchemy'e talimat veriyoruz.
# Eğer tablolar zaten varsa, bu komut hiçbir şey yapmaz.
# Bu satır, modeller.py'daki tüm sınıfları (RoadmapTemplate, TemplateSection) bulur ve
# database.py'daki engine'i kullanarak ilgili tabloları veritabanında yaratır.
models.Base.metadata.create_all(bind=engine)

# 2. FastAPI uygulamasını oluşturuyoruz.
app = FastAPI(
    title="NexusPath API",
    description="NexusPath uygulaması için backend API hizmetleri.",
    version="0.1.0"
)

# YENİ KOD: Veritabanı Oturumu için Bağımlılık (Dependency)
# Bu fonksiyon, her API isteği için yeni bir veritabanı oturumu açacak,
# istek tamamlandığında ise kapatacaktır. Bu, kaynakların doğru yönetilmesini sağlar.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 3. İlk API endpoint'imizi (rotamızı) tanımlıyoruz.
# Bu, uygulamanın kök URL'sine ("/") bir GET isteği geldiğinde ne olacağını tanımlar.
# Örneğin, tarayıcıda http://127.0.0.1:8000/ adresine gidildiğinde çalışır.
@app.get("/")
def read_root():
    """
    API'nin çalışıp çalışmadığını kontrol etmek için basit bir hoş geldiniz mesajı döndürür.
    """
    return {"message": "NexusPath API'sine Hoş Geldiniz!"}

# YENİ ENDPOINT: Yeni bir yol haritası şablonu oluştur
@app.post("/templates/", response_model=schemas.RoadmapTemplate)
def create_template(template: schemas.RoadmapTemplateCreate, db: Session = Depends(get_db)):
    """
    Yeni bir yol haritası şablonu oluşturur.
    - **name**: Şablonun adı (zorunlu).
    - **description**: Şablon için açıklama (isteğe bağlı).
    """
    # crud.py dosyasındaki fonksiyonumuzu çağırıyoruz.
    return crud.create_roadmap_template(db=db, template=template)

@app.get("/templates/", response_model=List[schemas.RoadmapTemplate])
def read_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Veritabanında kayıtlı tüm yol haritası şablonlarını listeler.
    """
    templates = crud.get_roadmap_templates(db, skip=skip, limit=limit)
    return templatesra

