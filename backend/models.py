import uuid
from sqlalchemy import Boolean, Column, String, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID # UUID tipini doğrudan kullanacağız
from .database import Base # Az önce oluşturduğumuz Base sınıfını import ediyoruz

class RoadmapTemplate(Base):
    __tablename__ = "roadmap_templates"

    # Sütunları tanımlıyoruz
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)

    # İlişkiyi tanımlıyoruz: Bir şablonun birden çok bölümü olabilir.
    sections = relationship("TemplateSection", back_populates="template")

class TemplateSection(Base):
    __tablename__ = "template_sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    prompt = Column(Text)
    order_index = Column(Integer, nullable=False)
    
    # İlişkileri tanımlıyoruz
    template_id = Column(UUID(as_uuid=True), ForeignKey("roadmap_templates.id"))
    template = relationship("RoadmapTemplate", back_populates="sections")

    # Kendi kendine ilişki (hiyerarşi için)
    # Şimdilik basit tutmak için bunu eklemeyelim, bir sonraki adımda ekleriz.
    # parent_id = Column(UUID(as_uuid=True), ForeignKey("template_sections.id"))