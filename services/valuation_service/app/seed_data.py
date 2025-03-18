from sqlalchemy.orm import Session
from app.models.models import ValuationRule
from app.database.database import SessionLocal

def seed_default_rules(db: Session):
    """
    Seed default valuation rules
    """
    # Check if we already have rules
    existing_rules = db.query(ValuationRule).count()
    if existing_rules > 0:
        print("Database already contains valuation rules, skipping seed")
        return
    
    # Value Investing Rule
    value_rule = ValuationRule(
        name="Value Investing",
        description="Classic value investing metrics focused on finding undervalued stocks",
        is_default=True,  # This is the default rule
        user_id=None,  # System rule
        rule_config={
            "metrics": {
                "pe_ratio": {
                    "weight": 3,
                    "ideal_range": [5, 15],
                    "max_pe": 40
                },
                "pb_ratio": {
                    "weight": 2,
                    "ideal_range": [0.5, 2.0],
                    "max_pb": 7
                },
                "dividend_yield": {
                    "weight": 1,
                    "ideal_range": [2.0, 6.0],
                    "max_yield": 15.0
                },
                "debt_to_equity": {
                    "weight": 1,
                    "ideal_range": [0, 1.0],
                    "max_ratio": 2.0
                },
                "profit_margin": {
                    "weight": 1,
                    "ideal_range": [10.0, 25.0]
                }
            }
        }
    )
    
    # Growth Investing Rule
    growth_rule = ValuationRule(
        name="Growth Investing",
        description="Growth-oriented metrics focused on companies with high growth potential",
        is_default=False,
        user_id=None,  # System rule
        rule_config={
            "metrics": {
                "pe_ratio": {
                    "weight": 1,
                    "ideal_range": [15, 35],
                    "max_pe": 80
                },
                "roe": {
                    "weight": 3,
                    "ideal_range": [15.0, 30.0]
                },
                "profit_margin": {
                    "weight": 2,
                    "ideal_range": [8.0, 20.0]
                },
                "historical_volatility": {
                    "weight": 1,
                    "ideal_range": [15.0, 30.0],
                    "max_volatility": 50.0
                }
            }
        }
    )
    
    # Income Investing Rule
    income_rule = ValuationRule(
        name="Income Investing",
        description="Focused on dividends and stable income generation",
        is_default=False,
        user_id=None,  # System rule
        rule_config={
            "metrics": {
                "dividend_yield": {
                    "weight": 4,
                    "ideal_range": [3.0, 8.0],
                    "max_yield": 15.0
                },
                "debt_to_equity": {
                    "weight": 2,
                    "ideal_range": [0, 1.0],
                    "max_ratio": 2.0
                },
                "historical_volatility": {
                    "weight": 2,
                    "ideal_range": [5.0, 20.0],
                    "max_volatility": 40.0
                },
                "pe_ratio": {
                    "weight": 1,
                    "ideal_range": [8, 20],
                    "max_pe": 40
                }
            }
        }
    )
    
    # Add rules to database
    db.add(value_rule)
    db.add(growth_rule)
    db.add(income_rule)
    db.commit()
    
    print("Default valuation rules seeded successfully")

def run_seed():
    """
    Run seed function with database session
    """
    db = SessionLocal()
    try:
        seed_default_rules(db)
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()