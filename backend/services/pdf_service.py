"""
services/pdf_service.py - ReportLab PDF report generator for GreenRoute AI
"""

from __future__ import annotations

import io
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# Brand colours
GREEN_DARK = colors.HexColor("#166534")
GREEN_MID = colors.HexColor("#22c55e")
GREEN_LIGHT = colors.HexColor("#dcfce7")
GREY_BG = colors.HexColor("#f9fafb")
GREY_TEXT = colors.HexColor("#6b7280")
WHITE = colors.white


def _styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "GRTitle",
            fontSize=22,
            textColor=GREEN_DARK,
            fontName="Helvetica-Bold",
            spaceAfter=4,
            alignment=TA_CENTER,
        ),
        "subtitle": ParagraphStyle(
            "GRSubtitle",
            fontSize=11,
            textColor=GREY_TEXT,
            fontName="Helvetica",
            spaceAfter=2,
            alignment=TA_CENTER,
        ),
        "section": ParagraphStyle(
            "GRSection",
            fontSize=13,
            textColor=GREEN_DARK,
            fontName="Helvetica-Bold",
            spaceBefore=14,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "GRBody",
            fontSize=10,
            textColor=colors.black,
            fontName="Helvetica",
            spaceAfter=4,
            leading=14,
        ),
        "small": ParagraphStyle(
            "GRSmall",
            fontSize=8,
            textColor=GREY_TEXT,
            fontName="Helvetica",
            alignment=TA_CENTER,
        ),
        "highlight": ParagraphStyle(
            "GRHighlight",
            fontSize=10,
            textColor=GREEN_DARK,
            fontName="Helvetica-Bold",
        ),
    }


def _header_table(user_name: str, generated_at: str, styles: dict) -> Table:
    """Build branded header with title and metadata."""
    data = [
        [Paragraph("🌿 GreenRoute AI", styles["title"]), ""],
        [Paragraph("Sustainable Route Report", styles["subtitle"]), ""],
        [
            Paragraph(f"Prepared for: <b>{user_name}</b>", styles["body"]),
            Paragraph(f"Generated: {generated_at}", styles["body"]),
        ],
    ]
    tbl = Table(data, colWidths=[10 * cm, 8 * cm])
    tbl.setStyle(
        TableStyle(
            [
                ("SPAN", (0, 0), (1, 0)),
                ("SPAN", (0, 1), (1, 1)),
                ("BACKGROUND", (0, 0), (1, 1), GREEN_LIGHT),
                ("ALIGN", (1, 2), (1, 2), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return tbl


def _route_details_table(trip: dict[str, Any], styles: dict) -> Table:
    """Build route details section."""
    data = [
        ["Field", "Value"],
        ["Origin", trip.get("source", "N/A")],
        ["Destination", trip.get("destination", "N/A")],
        ["Route Type", trip.get("route_type", "N/A").capitalize()],
        ["Vehicle Type", trip.get("vehicle_type", "N/A").replace("_", " ").title()],
        ["Distance", f"{trip.get('distance_km', 0):.2f} km"],
        ["Travel Time", f"{trip.get('travel_time_min', 0):.0f} minutes"],
    ]
    tbl = Table(data, colWidths=[7 * cm, 11 * cm])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (1, 0), GREEN_DARK),
                ("TEXTCOLOR", (0, 0), (1, 0), WHITE),
                ("FONTNAME", (0, 0), (1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GREEN_LIGHT]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1fae5")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return tbl


def _emissions_table(trip: dict[str, Any], styles: dict) -> Table:
    """Build emissions and savings breakdown table."""
    co2_saved = trip.get("co2_saved_kg", 0.0)
    fuel_saved = trip.get("fuel_saved_l", 0.0)
    trees = max(0, int(trip.get("co2_emissions_kg", 0) / 22))

    data = [
        ["Metric", "This Trip", "Saved vs Baseline"],
        [
            "CO₂ Emissions",
            f"{trip.get('co2_emissions_kg', 0):.3f} kg",
            f"✅ {co2_saved:.3f} kg",
        ],
        [
            "Fuel Consumed",
            f"{trip.get('fuel_consumption_l', 0):.3f} L",
            f"✅ {fuel_saved:.3f} L",
        ],
        [
            "EcoScore",
            f"{trip.get('ecoscore', 0):.1f} / 100",
            "—",
        ],
        [
            "Tree Equivalents",
            f"{trees} tree(s) / year",
            "—",
        ],
    ]
    tbl = Table(data, colWidths=[6 * cm, 6 * cm, 6 * cm])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN_MID),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GREEN_LIGHT]),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#bbf7d0")),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return tbl


def _ecoscore_visual(score: float, styles: dict) -> Table:
    """Render a simple text-based EcoScore gauge."""
    filled = int(score / 5)  # 20 slots → each 5 points
    bar = "█" * filled + "░" * (20 - filled)

    if score >= 75:
        label, colour = "Excellent ✅", GREEN_DARK
    elif score >= 55:
        label, colour = "Good 👍", colors.HexColor("#16a34a")
    elif score >= 35:
        label, colour = "Moderate ⚠️", colors.HexColor("#d97706")
    else:
        label, colour = "Poor ❌", colors.HexColor("#dc2626")

    score_para = Paragraph(
        f'<font color="#{colour.hexval()[1:]}"><b>{label}</b></font>  {score:.1f}/100',
        styles["body"],
    )
    bar_para = Paragraph(f'<font color="#22c55e">{bar}</font>', styles["body"])

    data = [["EcoScore", score_para], ["", bar_para]]
    tbl = Table(data, colWidths=[5 * cm, 13 * cm])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), GREEN_LIGHT),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#d1fae5")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return tbl


def generate_route_report(trip_data: dict[str, Any], user_name: str) -> bytes:
    """
    Generate a professional PDF route report.

    Args:
        trip_data: Trip dict with all route and emission fields.
        user_name: Display name of the user.

    Returns:
        PDF file content as bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = _styles()
    generated_at = datetime.now().strftime("%d %b %Y, %H:%M")
    story = []

    # Header
    story.append(_header_table(user_name, generated_at, styles))
    story.append(Spacer(1, 0.4 * cm))
    story.append(HRFlowable(width="100%", thickness=2, color=GREEN_MID))
    story.append(Spacer(1, 0.3 * cm))

    # Route Details
    story.append(Paragraph("📍 Route Details", styles["section"]))
    story.append(_route_details_table(trip_data, styles))
    story.append(Spacer(1, 0.3 * cm))

    # Emissions
    story.append(Paragraph("🌍 Emissions & Sustainability", styles["section"]))
    story.append(_emissions_table(trip_data, styles))
    story.append(Spacer(1, 0.3 * cm))

    # EcoScore gauge
    story.append(Paragraph("📊 EcoScore", styles["section"]))
    story.append(_ecoscore_visual(trip_data.get("ecoscore", 0), styles))
    story.append(Spacer(1, 0.4 * cm))

    # Sustainability Insights
    story.append(Paragraph("💡 Sustainability Insights", styles["section"]))
    story.append(
        Paragraph(
            "By choosing an eco-friendly route you are actively reducing your carbon footprint. "
            f"This trip avoided <b>{trip_data.get('co2_saved_kg', 0):.3f} kg</b> of CO₂ emissions "
            "compared to taking the most carbon-intensive option.",
            styles["body"],
        )
    )
    story.append(Spacer(1, 0.2 * cm))
    story.append(
        Paragraph(
            "Every eco-route choice matters: switching to greener routes just 3 times per week "
            "can save over 50 kg of CO₂ per year — equivalent to planting 2+ trees annually.",
            styles["body"],
        )
    )
    story.append(Spacer(1, 0.6 * cm))

    # Footer
    story.append(HRFlowable(width="100%", thickness=1, color=GREEN_LIGHT))
    story.append(Spacer(1, 0.2 * cm))
    story.append(
        Paragraph(
            "Generated by GreenRoute AI  ·  Sustainable Transport Intelligence  ·  greenroute.ai",
            styles["small"],
        )
    )

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def generate_sustainability_report(user_stats: dict[str, Any], user_name: str) -> bytes:
    """
    Generate a summary sustainability PDF for the user's profile.

    Args:
        user_stats: Aggregate stats dict.
        user_name:  Display name of the user.

    Returns:
        PDF content as bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = _styles()
    generated_at = datetime.now().strftime("%d %b %Y, %H:%M")
    story = []

    story.append(_header_table(user_name, generated_at, styles))
    story.append(Spacer(1, 0.4 * cm))
    story.append(HRFlowable(width="100%", thickness=2, color=GREEN_MID))
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph("📈 Sustainability Summary", styles["section"]))

    trees = max(0, int(user_stats.get("total_co2_saved", 0) / 22))
    data = [
        ["Metric", "Value"],
        ["Total Trips", str(user_stats.get("total_trips", 0))],
        ["Total CO₂ Saved", f"{user_stats.get('total_co2_saved', 0):.2f} kg"],
        ["Total Fuel Saved", f"{user_stats.get('total_fuel_saved', 0):.2f} L"],
        ["Average EcoScore", f"{user_stats.get('avg_ecoscore', 0):.1f} / 100"],
        ["Tree Equivalents Offset", f"{trees} trees / year"],
    ]
    tbl = Table(data, colWidths=[9 * cm, 9 * cm])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN_DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GREEN_LIGHT]),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#bbf7d0")),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(tbl)
    story.append(Spacer(1, 0.6 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=GREEN_LIGHT))
    story.append(Spacer(1, 0.2 * cm))
    story.append(
        Paragraph(
            "Generated by GreenRoute AI  ·  Sustainable Transport Intelligence  ·  greenroute.ai",
            styles["small"],
        )
    )

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def generate_ai_summary_report(
    ai_advice: dict[str, Any],
    trip_info: dict[str, Any],
    user_name: str
) -> bytes:
    """
    Generate a ReportLab PDF document containing the structured Gemini AI advisor advice.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = _styles()
    generated_at = datetime.now().strftime("%d %b %Y, %H:%M")
    story = []

    # Header
    story.append(_header_table(user_name, generated_at, styles))
    story.append(Spacer(1, 0.4 * cm))
    story.append(HRFlowable(width="100%", thickness=2, color=GREEN_MID))
    story.append(Spacer(1, 0.3 * cm))

    # Route Recommendation
    story.append(Paragraph("🤖 AI Route Recommendation", styles["section"]))
    story.append(Paragraph(ai_advice.get("route_recommendation", "N/A"), styles["body"]))
    story.append(Spacer(1, 0.3 * cm))

    # Trip Information Table
    story.append(Paragraph("📍 Trip Parameters", styles["section"]))
    trip_data = [
        ["Field", "Value"],
        ["Origin", trip_info.get("source", "N/A")],
        ["Destination", trip_info.get("destination", "N/A")],
        ["Vehicle Type", trip_info.get("vehicle_type", "N/A").replace("_", " ").title()],
        ["Selected Route Distance", f"{trip_info.get('distance_km', 0):.2f} km"],
        ["EcoScore", f"{trip_info.get('ecoscore', 0):.1f} / 100"],
    ]
    tbl = Table(trip_data, colWidths=[7 * cm, 11 * cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (1, 0), GREEN_DARK),
        ("TEXTCOLOR", (0, 0), (1, 0), WHITE),
        ("FONTNAME", (0, 0), (1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GREEN_LIGHT]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1fae5")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 0.3 * cm))

    # Insights and Suggestions
    def add_bullet_points(title: str, points: list[str]):
        if not points:
            return
        story.append(Paragraph(title, styles["section"]))
        for pt in points:
            story.append(Paragraph(f"• {pt}", styles["body"]))
        story.append(Spacer(1, 0.2 * cm))

    add_bullet_points("💡 Sustainability Insights", ai_advice.get("sustainability_insights", []))
    add_bullet_points("🌱 Carbon Reduction Actions", ai_advice.get("carbon_reduction_suggestions", []))
    add_bullet_points("⛽ Fuel Saving Tips", ai_advice.get("fuel_saving_suggestions", []))
    add_bullet_points("🚇 Alternative Transportation Suggestions", ai_advice.get("alternative_transportation", []))

    # Environmental Summary
    story.append(Paragraph("🌍 Environmental Summary", styles["section"]))
    story.append(Paragraph(ai_advice.get("environmental_impact_summary", "N/A"), styles["body"]))
    story.append(Spacer(1, 0.4 * cm))

    # Footer
    story.append(HRFlowable(width="100%", thickness=1, color=GREEN_LIGHT))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph("Generated by GreenRoute AI  ·  Sustainable Transport Intelligence  ·  greenroute.ai", styles["small"]))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
