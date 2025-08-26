import uuid
from sqlalchemy.orm import Session
from . import models, schemas

def create_roadmap_template(db: Session, template: schemas.RoadmapTemplateCreate):
    """
    Veritabanına yeni bir yol haritası şablonu ekler.
    """
    # 1. Gelen Pydantic şemasını SQLAlchemy modeline dönüştürüyoruz.
    db_template = models.RoadmapTemplate(
        name=template.name,
        description=template.description
    )
    # 2. Yeni oluşturulan nesneyi veritabanı oturumuna ekliyoruz.
    db.add(db_template)
    # 3. Değişiklikleri veritabanına işliyoruz (kaydediyoruz).
    db.commit()
    # 4. Veritabanı durumunu güncelleyerek ID gibi yeni bilgileri alıyoruz.
    db.refresh(db_template)
    # 5. Oluşturulan SQLAlchemy nesnesini geri döndürüyoruz.
    return db_template

def get_roadmap_templates(db: Session, skip: int = 0, limit: int = 100):
    """
    Veritabanındaki tüm yol haritası şablonlarını listeler.
    - skip: Kaç adet kaydı atlayacağını belirtir (sayfalandırma için).
    - limit: En fazla kaç adet kayıt döndüreceğini belirtir.
    """
    return db.query(models.RoadmapTemplate).offset(skip).limit(limit).all()

def update_roadmap_template(db: Session, template_id: uuid.UUID, template_update: schemas.RoadmapTemplateUpdate):
    """
    ID'si verilen bir şablonu günceller.
    """
    db_template = db.query(models.RoadmapTemplate).filter(models.RoadmapTemplate.id == template_id).first()
    if not db_template:
        return None # Eğer şablon bulunamazsa None döndür

    # Pydantic modelindeki verileri (None olmayanları) al
    update_data = template_update.dict(exclude_unset=True)
    
    # Alınan verilerle veritabanı nesnesini güncelle
    for key, value in update_data.items():
        setattr(db_template, key, value)
    
    db.commit()
    db.refresh(db_template)
    return db_template

def delete_roadmap_template(db: Session, template_id: uuid.UUID):
    """
    ID'si verilen bir şablonu siler.
    """
    db_template = db.query(models.RoadmapTemplate).filter(models.RoadmapTemplate.id == template_id).first()
    if not db_template:
        return None # Eğer şablon bulunamazsa None döndür
        
    db.delete(db_template)
    db.commit()
    return db_template

def create_template_section(db: Session, section: schemas.TemplateSectionCreate, template_id: uuid.UUID):
    """
    Belirli bir yol haritası şablonu için yeni bir bölüm (başlık) oluşturur.
    """
    db_section = models.TemplateSection(
        **section.dict(),  # Pydantic modelini sözlüğe çevirip tüm alanları otomatik eşler
        template_id=template_id
    )
    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    return db_section

def get_template_sections(db: Session, template_id: uuid.UUID):
    """
    Belirli bir yol haritası şablonuna ait tüm bölümleri listeler.
    """
    return db.query(models.TemplateSection).filter(models.TemplateSection.template_id == template_id).order_by(models.TemplateSection.order_index).all()

def update_template_section(db: Session, section_id: uuid.UUID, section_update: schemas.TemplateSectionUpdate):
    """
    ID'si verilen bir bölümü (başlığı) günceller.
    """
    db_section = db.query(models.TemplateSection).filter(models.TemplateSection.id == section_id).first()
    if not db_section:
        return None

    update_data = section_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_section, key, value)
    
    db.commit()
    db.refresh(db_section)
    return db_section

def delete_template_section(db: Session, section_id: uuid.UUID):
    """
    ID'si verilen bir bölümü (başlığı) siler.
    """
    db_section = db.query(models.TemplateSection).filter(models.TemplateSection.id == section_id).first()
    if not db_section:
        return None
    
    db.delete(db_section)
    db.commit()
    return db_section

def get_user_entry_for_section(db: Session, section_id: uuid.UUID):
    """
    Belirli bir bölüme ait kullanıcı içeriğini getirir.
    """
    return db.query(models.UserEntry).filter(models.UserEntry.section_id == section_id).first()

def create_or_update_user_entry(db: Session, section_id: uuid.UUID, entry: schemas.UserEntryCreate):
    """
    Bir bölüm için kullanıcı içeriği oluşturur veya mevcutsa günceller (Upsert).
    """
    db_entry = get_user_entry_for_section(db, section_id=section_id)

    if db_entry:
        # Varsa: içeriğini güncelle
        db_entry.content = entry.content
    else:
        # Yoksa: yeni bir tane oluştur
        db_entry = models.UserEntry(
            content=entry.content,
            section_id=section_id
        )
        db.add(db_entry)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry