# crud.py - TAM VE DÜZELTİLMİŞ VERSİYON

import uuid
from sqlalchemy.orm import Session
from . import models, schemas

# --- Roadmap Template CRUD ---

def create_roadmap_template(db: Session, template: schemas.RoadmapTemplateCreate):
    db_template = models.RoadmapTemplate(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

def get_roadmap_templates(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.RoadmapTemplate).offset(skip).limit(limit).all()

def update_roadmap_template(db: Session, template_id: uuid.UUID, template_update: schemas.RoadmapTemplateUpdate):
    db_template = db.query(models.RoadmapTemplate).filter(models.RoadmapTemplate.id == template_id).first()
    if not db_template:
        return None
    
    update_data = template_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_template, key, value)
    
    db.commit()
    db.refresh(db_template)
    return db_template

def delete_roadmap_template(db: Session, template_id: uuid.UUID):
    db_template = db.query(models.RoadmapTemplate).filter(models.RoadmapTemplate.id == template_id).first()
    if not db_template:
        return None
    db.delete(db_template)
    db.commit()
    return db_template

# --- Template Section CRUD ---

def create_template_section(db: Session, section: schemas.TemplateSectionCreate, template_id: uuid.UUID):
    db_section = models.TemplateSection(
        **section.model_dump(),
        template_id=template_id
    )
    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    return db_section

def get_template_sections(db: Session, template_id: uuid.UUID):
    return db.query(models.TemplateSection).filter(models.TemplateSection.template_id == template_id).order_by(models.TemplateSection.order_index).all()

def update_template_section(db: Session, section_id: uuid.UUID, section_update: schemas.TemplateSectionUpdate):
    db_section = db.query(models.TemplateSection).filter(models.TemplateSection.id == section_id).first()
    if not db_section:
        return None
    
    update_data = section_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_section, key, value)
    
    db.commit()
    db.refresh(db_section)
    return db_section

def delete_template_section(db: Session, section_id: uuid.UUID):
    db_section = db.query(models.TemplateSection).filter(models.TemplateSection.id == section_id).first()
    if not db_section:
        return None
    db.delete(db_section)
    db.commit()
    return db_section

# --- User Entry CRUD (DÜZELTİLMİŞ) ---

def get_user_entry_for_section(db: Session, section_id: uuid.UUID):
    return db.query(models.UserEntry).filter(models.UserEntry.section_id == section_id).first()

def create_or_update_user_entry(db: Session, section_id: uuid.UUID, entry_data: schemas.UserEntryCreate):
    db_entry = get_user_entry_for_section(db, section_id=section_id)

    # Gelen Pydantic modelini bir sözlüğe çeviriyoruz
    content_to_save = entry_data.content

    if db_entry:
        # Varsa: içeriğini güncelle
        db_entry.content = content_to_save
    else:
        # Yoksa: yeni bir tane oluştur
        db_entry = models.UserEntry(
            content=content_to_save,
            section_id=section_id
        )
        db.add(db_entry)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry