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