import os
from pypdf import PdfReader

# Build a clean valid PDF with full text stream for testing
pdf_content = """PHARMACEUTICAL DEVIATION INVESTIGATION REPORT
Document ID: DEV-2026-0881
Site: Vertex API Manufacturing Facility 2
Date: 2026-10-22
Batch Number: BZ-2026-881
Product: Benztropine Mesylate API
Process Step: Vacuum Tray Drying (Dryer VTD-03)
Severity: Major

DEVIATION DESCRIPTION:
During final quality release testing, Batch BZ-2026-881 exhibited residual Acetone of 0.72% w/w by gas chromatography, exceeding the finished API acceptance specification of <= 0.50% w/w. 

PROCESS OBSERVATIONS:
Drying was scheduled for 16 hours at 45C under 15 mbar vacuum in Dryer VTD-03. At hour 09:15, cooling water recirculator valve CV-102 failed closed, causing condenser cooling water temperature to spike to 28C against the maximum limit of 10C for 3.5 hours. Lower trays retained significant moisture and residual solvent.

POTENTIAL CONTRIBUTING FACTORS:
1. Equipment: Chilled water valve CV-102 actuator diaphragm fatigue.
2. Method: Absence of automatic audible interlock when condenser temperature exceeds 15C.
3. Measurement: Thermocouple TT-09 on lower shelf showed sluggish response during temperature ramp.

RECOMMENDED IMMEDIATE ACTION:
Quarantine Batch BZ-2026-881 in warehouse secure holding area.
"""

def generate_pdf(output_path: str):
    # Minimal standard PDF with text stream that PyPDF can read cleanly
    lines = pdf_content.strip().split("\n")
    stream_lines = ["BT", "/F1 10 Tf", "50 750 Td", "14 TL"]
    for i, line in enumerate(lines):
        # Escape parenthesis
        safe_line = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        if i == 0:
            stream_lines.append(f"({safe_line}) Tj")
        else:
            stream_lines.append(f"T* ({safe_line}) Tj")
    stream_lines.append("ET")
    stream_data = "\n".join(stream_lines).encode("latin-1")

    stream_len = len(stream_data)

    pdf_template = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        b"4 0 obj\n<< /Length " + str(stream_len).encode("ascii") + b" >>\nstream\n"
        + stream_data +
        b"\nendstream\nendobj\n"
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000350 00000 n \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n431\n%%EOF"
    )

    with open(output_path, "wb") as f:
        f.write(pdf_template)

    reader = PdfReader(output_path)
    text = reader.pages[0].extract_text()
    print(f"Generated {output_path} successfully. Extracted {len(text)} characters.")
    print("Sample extracted text:")
    print(text[:200])

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "samples")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "sample_deviation_report_bz2026_881.pdf")
    generate_pdf(out_file)
