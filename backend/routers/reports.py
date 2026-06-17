"""
routers/reports.py - PDF report generation router for GreenRoute AI
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.trip import Trip
from models.user import User
from routers.auth import get_current_user
from services.pdf_service import generate_route_report, generate_sustainability_report, generate_ai_summary_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class GenerateReportRequest(BaseModel):
    trip_id: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/generate")
def generate_trip_report(
    payload: GenerateReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """
    Generate a PDF report for a specific trip and return it as a file download.

    Returns:
        PDF bytes with Content-Disposition: attachment header.
    """
    trip = (
        db.query(Trip)
        .filter(Trip.id == payload.trip_id, Trip.user_id == current_user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")

    trip_data: dict[str, Any] = {
        "source": trip.source,
        "destination": trip.destination,
        "route_type": trip.route_type,
        "vehicle_type": trip.vehicle_type,
        "distance_km": trip.distance_km,
        "travel_time_min": trip.travel_time_min,
        "fuel_consumption_l": trip.fuel_consumption_l,
        "co2_emissions_kg": trip.co2_emissions_kg,
        "ecoscore": trip.ecoscore,
        "co2_saved_kg": trip.co2_saved_kg,
        "fuel_saved_l": trip.fuel_saved_l,
    }

    pdf_bytes = generate_route_report(trip_data, current_user.username)
    filename = f"greenroute_trip_{trip.id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/sustainability")
def sustainability_report(
    current_user: User = Depends(get_current_user),
) -> Response:
    """
    Generate a sustainability summary PDF for the authenticated user's profile.

    Returns:
        PDF bytes with Content-Disposition: attachment header.
    """
    user_stats: dict[str, Any] = {
        "total_trips": current_user.total_trips,
        "total_co2_saved": current_user.total_co2_saved,
        "total_fuel_saved": current_user.total_fuel_saved,
        "avg_ecoscore": current_user.avg_ecoscore,
    }

    pdf_bytes = generate_sustainability_report(user_stats, current_user.username)
    filename = f"greenroute_sustainability_{current_user.username}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


class AISummaryReportRequest(BaseModel):
    ai_advice: dict[str, Any]
    trip_info: dict[str, Any]


@router.post("/ai-summary")
def generate_ai_report(
    payload: AISummaryReportRequest,
    current_user: User = Depends(get_current_user),
) -> Response:
    """
    Generate a PDF report summarizing the Gemini AI route advice and return it as a download.
    """
    pdf_bytes = generate_ai_summary_report(payload.ai_advice, payload.trip_info, current_user.username)
    filename = f"greenroute_ai_summary_{current_user.username}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

