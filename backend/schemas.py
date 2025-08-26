import uuid
from pydantic import BaseModel
from typing import Optional

# --- Roadmap Template Şemaları ---

# Temel özellikler (hem oluşturma hem de okuma için ortak)
class RoadmapTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None # Bu alan isteğe bağlı (None olabilir)

# Bir şablon oluştururken gereken şema (Base'den miras alır)
class RoadmapTemplateCreate(RoadmapTemplateBase):
    pass # Şimdilik ek bir alana ihtiyacımız yok

# API'den bir şablonu geri döndürürken kullanılacak şema
# Veritabanından okunan verilerle uyumlu olması için.
class RoadmapTemplate(RoadmapTemplateBase):
    id: uuid.UUID
    is_active: bool

    # Bu ayar, Pydantic'in ORM modelleriyle (SQLAlchemy modellerimiz gibi)
    # doğrudan konuşabilmesini sağlar.
    class Config:
        orm_mode = True