import io
from pypdf import PdfWriter
from pypdf.generic import NameObject, DictionaryObject, TextStringObject

def create_sample_pdf_bytes(text_content: str) -> bytes:
    """Create a minimal valid in-memory PDF with text stream for test extraction."""
    from pypdf import PdfWriter, PageObject
    writer = PdfWriter()
    # Add a blank page
    page = writer.add_blank_page(width=612, height=792)
    
    # We can write a simple PDF structure or use basic canvas
    # PyPDF allows writing empty page, or we can use a basic raw PDF string
    # A standard minimal valid PDF with a text string:
    pdf_raw = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        b"4 0 obj\n<< /Length 55 >>\nstream\nBT /F1 12 Tf 72 712 Td (" + text_content.encode("latin-1") + b") Tj ET\nendstream\nendobj\n"
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000350 00000 n \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n431\n%%EOF"
    )
    return pdf_raw

def test_pasted_text_intake(client):
    payload = {
        "text": "Deviation observed in drying oven #4. Temperature spiked to 65C for 22 minutes.",
        "title_hint": "Drying Oven Temp Spike"
    }
    res = client.post("/api/sources/text", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["source_id"].startswith("SRC-TXT-")
    assert data["source_type"] == "pasted_text"
    assert "Deviation observed" in data["extracted_text"]
    assert data["extraction_status"] == "success"

def test_pasted_text_validation_failure(client):
    # Too short text (< 5 chars)
    res = client.post("/api/sources/text", json={"text": "hi"})
    assert res.status_code == 422

def test_email_intake(client):
    payload = {
        "subject": "URGENT: Batch API-2026-014 Out of Specification Notice",
        "sender": "quality.assurance@pharma-api.com",
        "received_date": "2026-10-23 09:30 AM",
        "body": "Please be advised that QC has reported a residual solvent result of 0.65% for batch API-2026-014. Acceptance limit is 0.50%."
    }
    res = client.post("/api/sources/email", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["source_id"].startswith("SRC-EML-")
    assert data["source_type"] == "email"
    assert "Subject: URGENT:" in data["extracted_text"]
    assert "quality.assurance@pharma-api.com" in data["extracted_text"]

def test_pdf_intake_success(client):
    pdf_bytes = create_sample_pdf_bytes("Batch API-2026-014 drying solvent exceeded limit")
    files = {"file": ("deviation_report.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    res = client.post("/api/sources/pdf", files=files)
    assert res.status_code == 201
    data = res.json()
    assert data["source_id"].startswith("SRC-PDF-")
    assert data["source_type"] == "pdf"
    assert data["original_filename"] == "deviation_report.pdf"
    assert data["extraction_status"] in ["success", "partial"]

def test_pdf_intake_invalid_extension(client):
    files = {"file": ("test.txt", io.BytesIO(b"Plain text"), "text/plain")}
    res = client.post("/api/sources/pdf", files=files)
    assert res.status_code == 400
    assert "Only standard PDF" in res.json()["detail"]

def test_pdf_intake_empty_file(client):
    files = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    res = client.post("/api/sources/pdf", files=files)
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()

def test_attach_source_to_investigation(client):
    # 1. Create investigation
    inv_res = client.post("/api/investigations", json={"title": "Investigation for Linking"})
    inv_id = inv_res.json()["id"]

    # 2. Create source
    src_res = client.post("/api/sources/text", json={"text": "Incident report context for linkage."})
    src_id = src_res.json()["id"]

    # 3. Attach
    attach_res = client.patch(f"/api/sources/{src_id}/attach?investigation_id={inv_id}")
    assert attach_res.status_code == 200
    assert attach_res.json()["investigation_id"] == inv_id

    # 4. Verify investigation now lists source document
    check_inv = client.get(f"/api/investigations/{inv_id}")
    assert check_inv.status_code == 200
    linked_docs = check_inv.json()["source_documents"]
    assert len(linked_docs) == 1
    assert linked_docs[0]["id"] == src_id
