from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
import enum

from app.database.database import Base

class ReportType(enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    CUSTOM = "custom"

class AlertType(enum.Enum):
    PRICE = "price"
    PERCENTAGE_CHANGE = "percentage_change"
    VALUATION_SCORE = "valuation_score"
    NEWS = "news"

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    portfolio_id = Column(Integer, index=True, nullable=True)  # Null for basket reports
    basket_id = Column(Integer, index=True, nullable=True)  # Null for portfolio reports
    title = Column(String)
    description = Column(String, nullable=True)
    report_type = Column(String)
    file_path = Column(String)  # Path to the generated report file
    generated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    parameters = Column(JSON, nullable=True)  # Optional parameters used to generate the report

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    ticker = Column(String, index=True)
    alert_type = Column(String)  # price, percentage_change, valuation_score, news
    threshold = Column(Float, nullable=True)  # Numerical threshold (null for news alerts)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_triggered_at = Column(TIMESTAMP(timezone=True), nullable=True)
    parameters = Column(JSON, nullable=True)  # Optional additional parameters

class ReportSchedule(Base):
    __tablename__ = "report_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    portfolio_id = Column(Integer, index=True, nullable=True)  # Null for basket reports
    basket_id = Column(Integer, index=True, nullable=True)  # Null for portfolio reports
    title = Column(String)
    description = Column(String, nullable=True)
    report_type = Column(String)
    frequency = Column(String)  # daily, weekly, monthly, quarterly
    day_of_week = Column(Integer, nullable=True)  # 0-6 (Monday-Sunday) for weekly reports
    day_of_month = Column(Integer, nullable=True)  # 1-31 for monthly reports
    is_active = Column(Boolean, default=True)
    parameters = Column(JSON, nullable=True)  # Optional parameters for the report
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)
    notification_type = Column(String)  # email, sms, push, etc.
    status = Column(String)  # sent, failed, etc.
    message = Column(Text)
    sent_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    error_message = Column(String, nullable=True)
    
    # Relationships
    alert = relationship("Alert", backref="notifications")
    report = relationship("Report", backref="notifications")
