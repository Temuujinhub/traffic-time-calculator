from src.models.user import db
from datetime import datetime

class TrafficCalculation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    origin = db.Column(db.String(255), nullable=False)
    waypoint = db.Column(db.String(255), nullable=True)
    destination = db.Column(db.String(255), nullable=False)
    daily_loss_minutes = db.Column(db.Float, nullable=False)
    monthly_loss_hours = db.Column(db.Float, nullable=False)
    annual_loss_days = db.Column(db.Float, nullable=False)
    duration_in_traffic_minutes = db.Column(db.Float, nullable=False)
    normal_duration_minutes = db.Column(db.Float, nullable=False)
    distance_km = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<TrafficCalculation {self.id}: {self.origin} -> {self.destination}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'origin': self.origin,
            'waypoint': self.waypoint,
            'destination': self.destination,
            'daily_loss_minutes': self.daily_loss_minutes,
            'monthly_loss_hours': self.monthly_loss_hours,
            'annual_loss_days': self.annual_loss_days,
            'duration_in_traffic_minutes': self.duration_in_traffic_minutes,
            'normal_duration_minutes': self.normal_duration_minutes,
            'distance_km': self.distance_km,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

