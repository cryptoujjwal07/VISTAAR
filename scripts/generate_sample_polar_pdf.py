import fitz  # PyMuPDF
from pathlib import Path

def create_sample_polar_pdf(output_path: str):
    """
    Generate an authentic multi-page scientific expedition report with
    headings, multi-column blocks, structured tables, and institutional footers.
    """
    doc = fitz.open()

    # Page 1: Title and Overview
    p1 = doc.new_page(width=595, height=842)  # A4: 595 x 842 points
    
    # Header
    p1.insert_text((50, 40), "GOVERNMENT OF INDIA • MINISTRY OF EARTH SCIENCES", fontsize=8, fontname="helv", color=(0.3, 0.3, 0.3))
    p1.insert_text((50, 52), "National Centre for Polar and Ocean Research (NCPOR), Vasco da Gama, Goa", fontsize=8, fontname="helv", color=(0.3, 0.3, 0.3))
    p1.draw_line((50, 58), (545, 58), color=(0.14, 0.38, 0.92), width=1.5)

    # Document Title
    p1.insert_text((50, 95), "41st Indian Scientific Expedition to Antarctica (41-ISEA)", fontsize=16, fontname="times-bold", color=(0.09, 0.24, 0.58))
    p1.insert_text((50, 115), "Operational Meteorological and Glaciological Field Observations at Maitri Station", fontsize=11, fontname="times-italic", color=(0.2, 0.2, 0.2))

    # Section 1.0
    p1.insert_text((50, 150), "1.0 Geographic Location and Environmental Regime", fontsize=13, fontname="times-bold", color=(0.09, 0.24, 0.58))
    body_text_1 = (
        "Maitri Station is India's second permanent research base in Antarctica, commissioned in 1989. "
        "The station is located in the ice-free rocky plateau of Schirmacher Oasis, Queen Maud Land, East Antarctica, "
        "at geographic coordinates 70°45'58\" S latitude and 11°44'09\" E longitude. The oasis extends across an area "
        "of approximately 35 square kilometers at an elevation of 117 meters above mean sea level.\n\n"
        "The microclimate of the Schirmacher Oasis is characterized by katabatic wind systems descending from the "
        "continental Antarctic polar ice cap. During winter months, blizzards with surface wind velocities exceeding "
        "35 m/s (approx. 126 km/h) are frequently registered by the automated weather station (AWS) array."
    )
    p1.insert_textbox(fitz.Rect(50, 160, 545, 270), body_text_1, fontsize=10, fontname="times-roman", lineheight=1.4)

    # Section 2.0 with Table
    p1.insert_text((50, 290), "2.0 Automated Weather Station (AWS) Monthly Observations", fontsize=13, fontname="times-bold", color=(0.09, 0.24, 0.58))
    
    # Draw Table on Page 1
    # Table headers and rows
    table_headers = ["Month", "Mean Temp (°C)", "Min Temp (°C)", "Mean RH (%)", "Wind (m/s)", "Pressure (hPa)"]
    table_rows = [
        ["January", "-2.4", "-8.1", "68.2", "7.8", "988.4"],
        ["February", "-5.9", "-14.3", "64.5", "8.9", "986.1"],
        ["March", "-11.8", "-22.6", "61.3", "11.2", "982.7"],
        ["April", "-16.4", "-28.2", "58.9", "12.8", "980.2"],
        ["May", "-19.1", "-31.7", "57.4", "14.1", "978.6"],
        ["June", "-21.5", "-34.9", "55.1", "15.6", "976.3"],
        ["July", "-23.2", "-36.4", "54.8", "16.2", "975.1"],
        ["August", "-22.8", "-35.8", "56.0", "15.9", "975.8"]
    ]

    x_start = 50
    y_start = 310
    col_widths = [90, 85, 80, 80, 75, 85]
    row_height = 20

    # Draw header row background
    p1.draw_rect(fitz.Rect(x_start, y_start, x_start + sum(col_widths), y_start + row_height), color=(0.09, 0.24, 0.58), fill=(0.09, 0.24, 0.58))
    
    # Draw header text
    cur_x = x_start
    for i, h in enumerate(table_headers):
        p1.insert_text((cur_x + 5, y_start + 14), h, fontsize=9, fontname="helv", color=(1.0, 1.0, 1.0))
        cur_x += col_widths[i]

    # Draw rows
    for r_idx, row in enumerate(table_rows):
        cur_y = y_start + (r_idx + 1) * row_height
        bg_color = (0.96, 0.97, 0.98) if r_idx % 2 == 1 else (1.0, 1.0, 1.0)
        p1.draw_rect(fitz.Rect(x_start, cur_y, x_start + sum(col_widths), cur_y + row_height), color=(0.85, 0.85, 0.85), fill=bg_color)
        
        cur_x = x_start
        for c_idx, val in enumerate(row):
            p1.insert_text((cur_x + 5, cur_y + 14), val, fontsize=8.5, fontname="helv", color=(0.1, 0.1, 0.1))
    # Draw explicit cell grid lines for robust PyMuPDF table detection
    total_w = sum(col_widths)
    total_h = (len(table_rows) + 1) * row_height
    for i in range(len(table_rows) + 2):
        y = y_start + i * row_height
        p1.draw_line((x_start, y), (x_start + total_w, y), color=(0.5, 0.5, 0.5), width=0.8)
    
    vx = x_start
    p1.draw_line((vx, y_start), (vx, y_start + total_h), color=(0.5, 0.5, 0.5), width=0.8)
    for w in col_widths:
        vx += w
        p1.draw_line((vx, y_start), (vx, y_start + total_h), color=(0.5, 0.5, 0.5), width=0.8)

    # Note
    p1.insert_text((50, y_start + (len(table_rows) + 1) * row_height + 18), "Source: NCPOR Indian Antarctic Research Data Centre calibrated sensors (WMO ID: 89514).", fontsize=7.5, fontname="times-italic", color=(0.4, 0.4, 0.4))

    # Section 3.0
    p1.insert_text((50, 530), "3.0 Lake Priyadarshini Glaciological Observations", fontsize=13, fontname="times-bold", color=(0.09, 0.24, 0.58))
    sec3_text = (
        "Lake Priyadarshini is a freshwater perennially ice-covered proglacial lake situated in the central sector "
        "of the Schirmacher Oasis. The lake has an approximate water volume of 0.85 million cubic meters and a maximum "
        "measured depth of 28 meters. Core sampling conducted during 41-ISEA revealed winter ice cover thickness "
        "ranging from 1.8 to 2.4 meters.\n\n"
        "Continuous water quality telemetry logged by the benthic probe showed stable dissolved oxygen levels "
        "of 11.4 mg/L and surface water conductivity of 142 micro-Siemens per centimeter."
    )
    p1.insert_textbox(fitz.Rect(50, 545, 545, 660), sec3_text, fontsize=10, fontname="times-roman", lineheight=1.4)

    # Footer
    p1.draw_line((50, 800), (545, 800), color=(0.8, 0.8, 0.8), width=0.5)
    p1.insert_text((50, 814), "NCPOR Technical Report No. 41-ISEA/MTR-2022 • Official Scientific Document", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))
    p1.insert_text((500, 814), "Page 1 of 2", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))


    # Page 2: Advanced Telemetry and Signatures
    p2 = doc.new_page(width=595, height=842)
    
    # Header
    p2.insert_text((50, 40), "NATIONAL CENTRE FOR POLAR AND OCEAN RESEARCH (NCPOR)", fontsize=8, fontname="helv", color=(0.3, 0.3, 0.3))
    p2.draw_line((50, 50), (545, 50), color=(0.14, 0.38, 0.92), width=1.5)

    p2.insert_text((50, 80), "4.0 Atmospheric Aerosols and Solar Radiation Measurements", fontsize=13, fontname="times-bold", color=(0.09, 0.24, 0.58))
    p2_text1 = (
        "Multi-wavelength radiometer (MWR) observations at Maitri station showed background aerosol optical depth (AOD) "
        "at 500 nm wavelength hovering between 0.025 and 0.042 during clean continental maritime wind episodes. "
        "These ultra-low aerosol loading baselines confirm the pristine nature of the East Antarctic atmosphere "
        "and provide invaluable reference data for global climate change simulations and satellite calibration."
    )
    p2.insert_textbox(fitz.Rect(50, 95, 545, 175), p2_text1, fontsize=10, fontname="times-roman", lineheight=1.4)

    # Table 2: Radiation metrics
    p2.insert_text((50, 195), "Table 2: Seasonal Solar Radiation and Net Flux Balance", fontsize=11, fontname="times-bold", color=(0.15, 0.15, 0.15))
    t2_headers = ["Season", "Direct Solar (W/m²)", "Diffuse Flux (W/m²)", "Albedo (%)", "Net Radiation (W/m²)"]
    t2_rows = [
        ["Austral Summer (Dec-Feb)", "780.4", "145.2", "22.4", "+142.6"],
        ["Austral Autumn (Mar-May)", "210.8", "68.4", "38.6", "-34.1"],
        ["Austral Winter (Jun-Aug)", "0.0", "0.0", "78.2", "-86.5"],
        ["Austral Spring (Sep-Nov)", "490.2", "112.5", "45.1", "+48.9"]
    ]
    
    y2_start = 215
    col2_widths = [140, 95, 85, 80, 95]
    
    p2.draw_rect(fitz.Rect(50, y2_start, 50 + sum(col2_widths), y2_start + row_height), color=(0.09, 0.24, 0.58), fill=(0.09, 0.24, 0.58))
    cx = 50
    for i, h in enumerate(t2_headers):
        p2.insert_text((cx + 5, y2_start + 14), h, fontsize=8.5, fontname="helv", color=(1.0, 1.0, 1.0))
        cx += col2_widths[i]

    for r_idx, row in enumerate(t2_rows):
        cy = y2_start + (r_idx + 1) * row_height
        bg = (0.96, 0.97, 0.98) if r_idx % 2 == 1 else (1.0, 1.0, 1.0)
        p2.draw_rect(fitz.Rect(50, cy, 50 + sum(col2_widths), cy + row_height), color=(0.85, 0.85, 0.85), fill=bg)
        cx = 50
        for c_idx, val in enumerate(row):
            p2.insert_text((cx + 5, cy + 14), val, fontsize=8.5, fontname="helv", color=(0.1, 0.1, 0.1))
            cx += col2_widths[c_idx]

    # Draw explicit cell grid lines for Table 2
    total_w2 = sum(col2_widths)
    total_h2 = (len(t2_rows) + 1) * row_height
    for i in range(len(t2_rows) + 2):
        y = y2_start + i * row_height
        p2.draw_line((50, y), (50 + total_w2, y), color=(0.5, 0.5, 0.5), width=0.8)
    
    vx2 = 50
    p2.draw_line((vx2, y2_start), (vx2, y2_start + total_h2), color=(0.5, 0.5, 0.5), width=0.8)
    for w in col2_widths:
        vx2 += w
        p2.draw_line((vx2, y2_start), (vx2, y2_start + total_h2), color=(0.5, 0.5, 0.5), width=0.8)

    # Section 5.0
    p2.insert_text((50, 360), "5.0 Institutional Provenance and Scientific Endorsement", fontsize=13, fontname="times-bold", color=(0.09, 0.24, 0.58))
    p2_text2 = (
        "This dataset was gathered under the aegis of the National Centre for Polar and Ocean Research (NCPOR), "
        "Ministry of Earth Sciences, New Delhi. All instruments comply with World Meteorological Organization (WMO) "
        "standards and were calibrated pre-expedition and post-deployment.\n\n"
        "Lead Investigator: Dr. S. K. Nair, Polar Atmosphere & Climate Science Group\n"
        "Expedition Leader: 41st Indian Scientific Expedition to Antarctica\n"
        "Digital DOI: 10.5067/NCPOR/41ISEA/MTR-MET-001"
    )
    p2.insert_textbox(fitz.Rect(50, 375, 545, 490), p2_text2, fontsize=10, fontname="times-roman", lineheight=1.4)

    # Footer
    p2.draw_line((50, 800), (545, 800), color=(0.8, 0.8, 0.8), width=0.5)
    p2.insert_text((50, 814), "NCPOR Technical Report No. 41-ISEA/MTR-2022 • Official Scientific Document", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))
    p2.insert_text((500, 814), "Page 2 of 2", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    doc.save(output_path)
    doc.close()
    print(f"Generated sample polar scientific PDF at: {output_path}")

def create_himansh_pdf(output_path: str):
    """Generate high-altitude Himalayan glacier telemetry report for Himansh Station"""
    doc = fitz.open()
    p1 = doc.new_page(width=595, height=842)

    # Header
    p1.insert_text((50, 40), "GOVERNMENT OF INDIA • MINISTRY OF EARTH SCIENCES", fontsize=8, fontname="helv", color=(0.3, 0.3, 0.3))
    p1.insert_text((50, 52), "National Centre for Polar and Ocean Research (NCPOR) • Cryosphere Science Division", fontsize=8, fontname="helv", color=(0.3, 0.3, 0.3))
    p1.draw_line((50, 58), (545, 58), color=(0.05, 0.45, 0.55), width=1.5)

    # Title
    p1.insert_text((50, 95), "Himansh High-Altitude Glaciological Research Station", fontsize=16, fontname="times-bold", color=(0.04, 0.35, 0.45))
    p1.insert_text((50, 115), "Annual Glacio-Hydrological Balance and Mass Budget Assessment — Chandra Basin", fontsize=11, fontname="times-italic", color=(0.2, 0.2, 0.2))

    # Section 1.0
    p1.insert_text((50, 150), "1.0 Cryospheric Setting and Hydrological Importance", fontsize=13, fontname="times-bold", color=(0.04, 0.35, 0.45))
    sec1 = (
        "Established in 2016 at an altitude of 4,080 meters (13,386 ft) in the Chandra River basin of the Spiti valley, "
        "Himansh ('a slice of ice') is India's dedicated high-altitude research station. It serves as an active hub "
        "for continuous monitoring of Himalayan benchmark glaciers including Sutri Dhaka, Batal, Samudra Tapu, "
        "and Gepang Gath.\n\n"
        "The Western Himalayan glaciers serve as crucial water towers for the Indus river network. In-situ mass balance "
        "stakes, automated acoustic depth sounders, and ground penetrating radar (GPR) arrays provide critical ground "
        "validation for satellite gravimetry (GRACE-FO) and radar altimetry missions."
    )
    p1.insert_textbox(fitz.Rect(50, 160, 545, 275), sec1, fontsize=10, fontname="times-roman", lineheight=1.4)

    # Section 2.0
    p1.insert_text((50, 295), "2.0 Benchmark Glacier Mass Balance & Snow Water Equivalent (SWE)", fontsize=13, fontname="times-bold", color=(0.04, 0.35, 0.45))
    headers = ["Glacier", "Area (km²)", "ELA (m a.s.l.)", "Winter Bal (m w.e.)", "Summer Bal (m w.e.)", "Net Balance"]
    rows = [
        ["Sutri Dhaka", "19.8", "5120", "+1.14", "-1.82", "-0.68"],
        ["Batal", "4.2", "5080", "+0.92", "-1.74", "-0.82"],
        ["Samudra Tapu", "65.4", "5240", "+1.28", "-1.96", "-0.68"],
        ["Gepang Gath", "14.1", "4980", "+1.05", "-1.62", "-0.57"]
    ]
    x0, y0 = 50, 315
    widths = [110, 75, 85, 95, 95, 80]
    rh = 20

    # Draw grid
    total_w = sum(widths)
    total_h = (len(rows) + 1) * rh
    for i in range(len(rows) + 2):
        p1.draw_line((x0, y0 + i * rh), (x0 + total_w, y0 + i * rh), color=(0.5, 0.5, 0.5), width=0.8)
    vx = x0
    p1.draw_line((vx, y0), (vx, y0 + total_h), color=(0.5, 0.5, 0.5), width=0.8)
    for w in widths:
        vx += w
        p1.draw_line((vx, y0), (vx, y0 + total_h), color=(0.5, 0.5, 0.5), width=0.8)

    # Headers
    cx = x0
    for i, h in enumerate(headers):
        p1.insert_text((cx + 4, y0 + 14), h, fontsize=8.5, fontname="helv", color=(0.04, 0.35, 0.45))
        cx += widths[i]

    # Rows
    for r_idx, r in enumerate(rows):
        cy = y0 + (r_idx + 1) * rh
        cx = x0
        for c_idx, val in enumerate(r):
            p1.insert_text((cx + 4, cy + 14), val, fontsize=8.5, fontname="helv", color=(0.1, 0.1, 0.1))
            cx += widths[c_idx]

    # Section 3.0
    p1.insert_text((50, 440), "3.0 Hydrological Meltwater Discharge Telemetry", fontsize=13, fontname="times-bold", color=(0.04, 0.35, 0.45))
    sec3 = (
        "Automated ultrasonic stage-level sensors installed at the Sutri Dhaka proglacial stream logged peak discharge "
        "during late July (18.4 cubic meters per second), coinciding with highest seasonal air temperatures. "
        "Suspended sediment concentration reached 3.8 g/L during peak ablation periods.\n\n"
        "These empirical observations provide essential baseline calibration for downstream hydropower installations "
        "and flood early warning models across the Himachal Pradesh mountain catchments."
    )
    p1.insert_textbox(fitz.Rect(50, 455, 545, 565), sec3, fontsize=10, fontname="times-roman", lineheight=1.4)

    # Footer
    p1.draw_line((50, 800), (545, 800), color=(0.8, 0.8, 0.8), width=0.5)
    p1.insert_text((50, 814), "NCPOR Technical Bulletin No. HIMANSH/GLAC-2023 • Cryosphere Provenance", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))
    p1.insert_text((500, 814), "Page 1 of 1", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    doc.save(output_path)
    doc.close()
    print(f"Generated sample Himansh glaciology PDF at: {output_path}")

async def seed_sample_documents():
    """Seed sample polar documents into MongoDB Atlas and process through intelligence pipeline"""
    import asyncio
    from apps.api.core.database import get_database
    from apps.api.core.storage import storage_service
    from apps.api.domains.documents.service import process_document_pipeline

    db = get_database()
    maitri_pdf = "./data/sample_documents/41st_ISEA_Maitri_Meteorology_Report.pdf"
    himansh_pdf = "./data/sample_documents/Himansh_Glacier_Monitoring_Annual_Bulletin.pdf"

    create_sample_polar_pdf(maitri_pdf)
    create_himansh_pdf(himansh_pdf)

    # Ingest Himansh
    with open(himansh_pdf, "rb") as f:
        him_bytes = f.read()

    him_id = "doc_himansh_glaciology_2023"
    him_path = await storage_service.save_file("documents", f"{him_id}.pdf", him_bytes)

    await db.documents.update_one(
        {"document_id": him_id},
        {"$set": {
            "document_id": him_id,
            "title": "Himansh Station Annual Glaciological Assessment",
            "original_filename": "Himansh_Glacier_Monitoring_Annual_Bulletin.pdf",
            "storage_path": him_path,
            "station_id": "himansh",
            "expedition": "Chandra Basin Cryospheric Mission",
            "page_count": 1,
            "status": "PENDING",
            "retry_count": 0
        }},
        upsert=True
    )
    await process_document_pipeline(him_id)
    print("Seeded and processed Himansh document.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_sample_documents())
