from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProvenanceSource(Base):
    __tablename__ = "provenance_sources"

    source_id: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    source_type: Mapped[str] = mapped_column(String(50), default="system")
    classical_public_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    pqc_public_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    tokens = relationship("ProvenanceToken", back_populates="source")


class ProvenanceToken(Base):
    __tablename__ = "provenance_tokens"
    __table_args__ = (UniqueConstraint("token_id", name="uq_provenance_tokens_token_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    token_id: Mapped[str] = mapped_column(String(80), index=True)
    content_hash: Mapped[str] = mapped_column(String(160), index=True)
    parent_token_id: Mapped[str | None] = mapped_column(
        String(80), ForeignKey("provenance_tokens.token_id"), nullable=True
    )
    source_id: Mapped[str] = mapped_column(
        String(120), ForeignKey("provenance_sources.source_id"), index=True
    )
    stage: Mapped[str] = mapped_column(String(80), index=True)
    asset_ref: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    related_entity_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    related_entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    transform_meta_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    sig_classical: Mapped[str | None] = mapped_column(Text, nullable=True)
    sig_pqc: Mapped[str | None] = mapped_column(Text, nullable=True)
    ledger_anchor: Mapped[str | None] = mapped_column(String(180), nullable=True)
    schema_version: Mapped[str] = mapped_column(String(20), default="1.0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    source = relationship("ProvenanceSource", back_populates="tokens")
    parent = relationship("ProvenanceToken", remote_side=[token_id])
    ledger_entry = relationship(
        "LedgerEntry", back_populates="token", uselist=False, cascade="all, delete-orphan"
    )


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    position: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    token_id: Mapped[str] = mapped_column(
        String(80), ForeignKey("provenance_tokens.token_id"), index=True
    )
    record_hash: Mapped[str] = mapped_column(String(160))
    previous_hash: Mapped[str | None] = mapped_column(String(160), nullable=True)
    entry_hash: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    batch_id: Mapped[str | None] = mapped_column(
        String(80), ForeignKey("merkle_batches.batch_id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    token = relationship("ProvenanceToken", back_populates="ledger_entry")
    batch = relationship("MerkleBatch", back_populates="entries")


class MerkleBatch(Base):
    __tablename__ = "merkle_batches"
    __table_args__ = (UniqueConstraint("batch_id", name="uq_merkle_batches_batch_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    batch_id: Mapped[str] = mapped_column(String(80), index=True)
    merkle_root: Mapped[str] = mapped_column(String(160), index=True)
    entry_count: Mapped[int] = mapped_column(Integer, default=0)
    anchor_status: Mapped[str] = mapped_column(String(40), default="pending")
    anchor_provider: Mapped[str | None] = mapped_column(String(80), nullable=True)
    anchor_tx_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    anchored_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    entries = relationship("LedgerEntry", back_populates="batch")
