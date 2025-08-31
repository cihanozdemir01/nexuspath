import uuid
from pydantic import BaseModel
from typing import Optional
import datetime
from typing import Any, Dict

# --- Roadmap Template Şemaları ---

# Temel özellikler (hem oluşturma hem de okuma için ortak)
class RoadmapTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None # Bu alan isteğe bağlı (None olabilir)

# Bir şablon oluştururken gereken şema (Base'den miras alır)
class RoadmapTemplateCreate(RoadmapTemplateBase):
    pass # Şimdilik ek bir alana ihtiyacımız yok

class TemplateSectionUpdate(BaseModel):
    title: Optional[str] = None
    prompt: Optional[str] = None
    order_index: Optional[int] = None
    parent_id: Optional[uuid.UUID] = None

class RoadmapTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

# API'den bir şablonu geri döndürürken kullanılacak şema
# Veritabanından okunan verilerle uyumlu olması için.
class RoadmapTemplate(RoadmapTemplateBase):
    id: uuid.UUID
    is_active: bool

    # Bu ayar, Pydantic'in ORM modelleriyle (SQLAlchemy modellerimiz gibi)
    # doğrudan konuşabilmesini sağlar.
    class Config:
        orm_mode = True

# --- Template Section Şemaları ---

class TemplateSectionBase(BaseModel):
    title: str
    prompt: Optional[str] = None
    order_index: int
    parent_id: Optional[uuid.UUID] = None # Üst başlık ID'si, isteğe bağlı

class TemplateSectionCreate(TemplateSectionBase):
    pass

class TemplateSection(TemplateSectionBase):
    id: uuid.UUID
    template_id: uuid.UUID
    
    # Bu şemayı API'den döndürdüğümüzde, alt başlıkları da göstermek isteyebiliriz.
    # Bu yüzden children alanını ekliyoruz. Şimdilik boş bir liste olacak.
    children: list['TemplateSection'] = [] 

    class Config:
        orm_mode = True
        
# Pydantic v2'de recursive modeller için bu gerekli değil, ama v1 için önemli
TemplateSection.update_forward_refs()

class UserEntryBase(BaseModel):
    # İçerik, herhangi bir geçerli JSON yapısı olabilir (sözlük)
    content: Optional[Dict[str, Any]] = None

class UserEntryCreate(UserEntryBase):
    pass

class UserEntry(UserEntryBase):
    id: uuid.UUID
    section_id: uuid.UUID
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    class Config:
        # Pydantic v2 için bu 'from_attributes = True' olmalı,
        # ama şimdilik 'orm_mode' da çalışır.
        orm_mode = True

# YENİ ŞEMA: Bir içeriği güncellemek (sadece favori durumunu) için
class UserEntryUpdate(BaseModel):
    is_favorite: bool

class UserEntry(UserEntryBase):
    id: uuid.UUID
    section_id: uuid.UUID
    is_favorite: bool # <-- YENİ SATIR
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    class Config:
        orm_mode = True

# YENİ ŞEMA: Favorileri listelerken başlık bilgisini de göndermek için
class FavoriteEntry(UserEntry):
    section_title: str # Hangi başlığa ait olduğunu göstermek için