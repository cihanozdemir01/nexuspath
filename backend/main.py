

import uuid
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import SessionLocal, engine

from sqladmin import Admin, ModelView
from . import models 


# Veritabanı tablolarını oluştur
models.Base.metadata.create_all(bind=engine)

# FastAPI uygulamasını başlat
app = FastAPI(
    title="NexusPath API",
    description="NexusPath uygulaması için backend API hizmetleri.",
    version="0.1.0",
)

# 1. Bir Admin instance'ı oluşturuyoruz ve onu FastAPI uygulamamıza ve veritabanı motorumuza bağlıyoruz.
admin = Admin(app=app, engine=engine)

# 2. Hangi veritabanı modellerini yönetmek istediğimizi belirten "View" sınıfları oluşturuyoruz.
class RoadmapTemplateAdmin(ModelView, model=models.RoadmapTemplate):
    column_list = [models.RoadmapTemplate.id, models.RoadmapTemplate.name, models.RoadmapTemplate.is_active]
    name = "Şablon"
    name_plural = "Şablonlar"
    icon = "fa-solid fa-map" # FontAwesome ikon sınıfı

class TemplateSectionAdmin(ModelView, model=models.TemplateSection):
    column_list = [models.TemplateSection.id, models.TemplateSection.title, models.TemplateSection.order_index]
    name = "Başlık"
    name_plural = "Başlıklar"
    icon = "fa-solid fa-list-ol"

# 3. Oluşturduğumuz bu "View"ları admin panelimize kaydediyoruz.
admin.add_view(RoadmapTemplateAdmin)
admin.add_view(TemplateSectionAdmin)

# CORS (Cross-Origin Resource Sharing) ayarları
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Veritabanı oturumu için bağımlılık (dependency)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- KÖK ENDPOINT ---
@app.get("/")
def read_root():
    return {"message": "NexusPath API'sine Hoş Geldiniz!"}


# --- ŞABLON (TEMPLATE) ENDPOINT'LERİ ---

@app.post("/templates/", response_model=schemas.RoadmapTemplate)
def create_template(template: schemas.RoadmapTemplateCreate, db: Session = Depends(get_db)):
    return crud.create_roadmap_template(db=db, template=template)

@app.get("/templates/", response_model=List[schemas.RoadmapTemplate])
def read_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    templates = crud.get_roadmap_templates(db, skip=skip, limit=limit)
    return templates

@app.post("/templates/{template_id}/sections/", response_model=schemas.TemplateSection)
def create_section_for_template(
    template_id: uuid.UUID, section: schemas.TemplateSectionCreate, db: Session = Depends(get_db)
):
    return crud.create_template_section(db=db, section=section, template_id=template_id)

@app.get("/templates/{template_id}/sections/", response_model=List[schemas.TemplateSection])
def read_sections_for_template(template_id: uuid.UUID, db: Session = Depends(get_db)):
    sections = crud.get_template_sections(db=db, template_id=template_id)
    return sections

@app.patch("/templates/{template_id}", response_model=schemas.RoadmapTemplate)
def update_template(
    template_id: uuid.UUID, template_update: schemas.RoadmapTemplateUpdate, db: Session = Depends(get_db)
):
    updated_template = crud.update_roadmap_template(db, template_id, template_update)
    if updated_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return updated_template

@app.delete("/templates/{template_id}", response_model=schemas.RoadmapTemplate)
def delete_template(template_id: uuid.UUID, db: Session = Depends(get_db)):
    deleted_template = crud.delete_roadmap_template(db, template_id)
    if deleted_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return deleted_template


# --- BAŞLIK (SECTION) VE İÇERİK (ENTRY) ENDPOINT'LERİ ---
# Sıralama önemlidir: Daha spesifik yollar (/entry içerenler) önce gelmelidir.

@app.put("/sections/{section_id}/entry", response_model=schemas.UserEntry)
def update_entry_for_section(
    section_id: uuid.UUID, entry: schemas.UserEntryCreate, db: Session = Depends(get_db)
):
    return crud.create_or_update_user_entry(db=db, section_id=section_id, entry_data=entry)

@app.get("/sections/{section_id}/entry", response_model=schemas.UserEntry)
def read_entry_for_section(section_id: uuid.UUID, db: Session = Depends(get_db)):
    db_entry = crud.get_user_entry_for_section(db=db, section_id=section_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found for this section")
    return db_entry

@app.patch("/sections/{section_id}", response_model=schemas.TemplateSection)
def update_section(
    section_id: uuid.UUID, section_update: schemas.TemplateSectionUpdate, db: Session = Depends(get_db)
):
    updated_section = crud.update_template_section(
        db, section_id=section_id, section_update=section_update
    )
    if updated_section is None:
        raise HTTPException(status_code=404, detail="Section not found")
    return updated_section

@app.delete("/sections/{section_id}", response_model=schemas.TemplateSection)
def delete_section(section_id: uuid.UUID, db: Session = Depends(get_db)):
    deleted_section = crud.delete_template_section(db, section_id=section_id)
    if deleted_section is None:
        raise HTTPException(status_code=404, detail="Section not found")
    return deleted_section

@app.patch("/entries/{entry_id}/favorite", response_model=schemas.UserEntry)
def update_entry_favorite(entry_id: uuid.UUID, entry_update: schemas.UserEntryUpdate, db: Session = Depends(get_db)):
    """
    Bir içeriğin favori durumunu günceller.
    """
    updated_entry = crud.update_user_entry_favorite_status(db, entry_id=entry_id, is_favorite=entry_update.is_favorite)
    if updated_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return updated_entry

@app.get("/entries/favorites/", response_model=List[schemas.FavoriteEntry])
def read_favorite_entries(db: Session = Depends(get_db)):
    """
    Favori olarak işaretlenmiş tüm kullanıcı içeriklerini listeler.
    """
    return crud.get_favorite_user_entries(db=db)