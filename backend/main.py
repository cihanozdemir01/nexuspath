import uuid
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

@app.post("/templates/{template_id}/sections/", response_model=schemas.TemplateSection)
def create_section_for_template(
    template_id: uuid.UUID, section: schemas.TemplateSectionCreate, db: Session = Depends(get_db)
):
    """
    Belirli bir şablon için yeni bir bölüm (başlık) oluşturur.
    URL'den gelen `template_id` kullanılır.
    """
    return crud.create_template_section(db=db, section=section, template_id=template_id)


@app.get("/templates/{template_id}/sections/", response_model=List[schemas.TemplateSection])
def read_sections_for_template(template_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Belirli bir şablona ait tüm bölümleri (başlıkları) listeler.
    """
    sections = crud.get_template_sections(db=db, template_id=template_id)
    return sections

@app.patch("/templates/{template_id}", response_model=schemas.RoadmapTemplate)
def update_template(template_id: uuid.UUID, template_update: schemas.RoadmapTemplateUpdate, db: Session = Depends(get_db)):
    """
    Bir yol haritası şablonunun adını, açıklamasını veya aktif durumunu günceller.
    Sadece güncellenmek istenen alanları göndermek yeterlidir.
    """
    updated_template = crud.update_roadmap_template(db, template_id, template_update)
    if updated_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return updated_template


@app.delete("/templates/{template_id}", response_model=schemas.RoadmapTemplate)
def delete_template(template_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Bir yol haritası şablonunu ve ona bağlı tüm bölümleri/içerikleri siler.
    """
    deleted_template = crud.delete_roadmap_template(db, template_id)
    if deleted_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return deleted_template

@app.patch("/sections/{section_id}", response_model=schemas.TemplateSection)
def update_section(section_id: uuid.UUID, section_update: schemas.TemplateSectionUpdate, db: Session = Depends(get_db)):
    """
    Bir bölümün (başlığın) başlığını, açıklamasını, sırasını veya ebeveynini günceller.
    """
    updated_section = crud.update_template_section(db, section_id=section_id, section_update=section_update)
    if updated_section is None:
        raise HTTPException(status_code=404, detail="Section not found")
    return updated_section

@app.delete("/sections/{section_id}", response_model=schemas.TemplateSection)
def delete_section(section_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Bir bölümü (başlığı) ve ona bağlı kullanıcı içeriğini siler.
    """
    deleted_section = crud.delete_template_section(db, section_id=section_id)
    if deleted_section is None:
        raise HTTPException(status_code=404, detail="Section not found")
    return deleted_section

