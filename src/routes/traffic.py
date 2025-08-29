from flask import Blueprint, jsonify, request
from src.models.traffic import TrafficCalculation, db

traffic_bp = Blueprint('traffic', __name__)

@traffic_bp.route('/calculations', methods=['GET'])
def get_calculations():
    """Get all traffic calculations with pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    calculations = TrafficCalculation.query.order_by(
        TrafficCalculation.created_at.desc()
    ).paginate(
        page=page, 
        per_page=per_page, 
        error_out=False
    )
    
    return jsonify({
        'calculations': [calc.to_dict() for calc in calculations.items],
        'total': calculations.total,
        'pages': calculations.pages,
        'current_page': page,
        'per_page': per_page
    })

@traffic_bp.route('/calculations', methods=['POST'])
def create_calculation():
    """Save a new traffic calculation"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['origin', 'destination', 'daily_loss_minutes', 
                          'monthly_loss_hours', 'annual_loss_days', 
                          'duration_in_traffic_minutes', 'normal_duration_minutes']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        calculation = TrafficCalculation(
            origin=data['origin'],
            waypoint=data.get('waypoint'),
            destination=data['destination'],
            daily_loss_minutes=data['daily_loss_minutes'],
            monthly_loss_hours=data['monthly_loss_hours'],
            annual_loss_days=data['annual_loss_days'],
            duration_in_traffic_minutes=data['duration_in_traffic_minutes'],
            normal_duration_minutes=data['normal_duration_minutes'],
            distance_km=data.get('distance_km')
        )
        
        db.session.add(calculation)
        db.session.commit()
        
        return jsonify(calculation.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@traffic_bp.route('/calculations/<int:calc_id>', methods=['GET'])
def get_calculation(calc_id):
    """Get a specific traffic calculation"""
    calculation = TrafficCalculation.query.get_or_404(calc_id)
    return jsonify(calculation.to_dict())

@traffic_bp.route('/calculations/<int:calc_id>', methods=['DELETE'])
def delete_calculation(calc_id):
    """Delete a traffic calculation"""
    calculation = TrafficCalculation.query.get_or_404(calc_id)
    db.session.delete(calculation)
    db.session.commit()
    return '', 204

@traffic_bp.route('/calculations/stats', methods=['GET'])
def get_stats():
    """Get statistics about all calculations"""
    total_calculations = TrafficCalculation.query.count()
    
    if total_calculations == 0:
        return jsonify({
            'total_calculations': 0,
            'average_daily_loss': 0,
            'average_monthly_loss': 0,
            'average_annual_loss': 0
        })
    
    # Calculate averages
    avg_daily = db.session.query(db.func.avg(TrafficCalculation.daily_loss_minutes)).scalar()
    avg_monthly = db.session.query(db.func.avg(TrafficCalculation.monthly_loss_hours)).scalar()
    avg_annual = db.session.query(db.func.avg(TrafficCalculation.annual_loss_days)).scalar()
    
    return jsonify({
        'total_calculations': total_calculations,
        'average_daily_loss': round(avg_daily, 2) if avg_daily else 0,
        'average_monthly_loss': round(avg_monthly, 2) if avg_monthly else 0,
        'average_annual_loss': round(avg_annual, 2) if avg_annual else 0
    })

