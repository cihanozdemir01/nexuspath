import uuid
from sqlalchemy import Boolean, Column, String, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID # UUID tipini doğrudan kullanacağız
from .database import Base # Az önce oluşturduğumuz Base sınıfını import ediyoruz
from sqlalchemy import DateTime, JSON, func

class RoadmapTemplate(Base):
    __tablename__ = "roadmap_templates"

    # Sütunları tanımlıyoruz
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)

    # İlişkiyi tanımlıyoruz: Bir şablonun birden çok bölümü olabilir.
    sections = relationship("TemplateSection", back_populates="template", cascade="all, delete-orphan")
class TemplateSection(Base):
    __tablename__ = "template_sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    prompt = Column(Text)
    order_index = Column(Integer, nullable=False)
    
    # İlişkileri tanımlıyoruz
    template_id = Column(UUID(as_uuid=True), ForeignKey("roadmap_templates.id"), nullable=False)
    template = relationship("RoadmapTemplate", back_populates="sections")

    # Bir üst bölümün birden çok alt bölümü olabilir ilişkisi
    parent = relationship("TemplateSection", remote_side=[id], back_populates="children")
    children = relationship("TemplateSection", back_populates="parent")
    # Kendi kendine ilişki (hiyerarşi için)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("template_sections.id"), nullable=True) # nullable=True kök başlıklar için

    entry = relationship("UserEntry", back_populates="section", uselist=False, cascade="all, delete-orphan")
class UserEntry(Base):
    __tablename__ = "user_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    content = Column(JSON, nullable=True) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    section_id = Column(UUID(as_uuid=True), ForeignKey("template_sections.id"), unique=True, nullable=False)
    section = relationship("TemplateSection", back_populates="entry")