"""
Creates a clean, realistic pharmaceutical deviation report PDF for PharmaLens demo.
"""
from fpdf import FPDF
import os

class PDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 14)
        self.set_text_color(26, 26, 26)
        self.cell(0, 8, 'PHARMACEUTICAL DEVIATION INCIDENT REPORT', align='C', new_x='LMARGIN', new_y='NEXT')
        self.set_font('Helvetica', '', 9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, 'Quality Assurance Department | GMP Manufacturing Operations | Form QA-DEV-04', align='C', new_x='LMARGIN', new_y='NEXT')
        self.ln(4)
        self.set_draw_color(20, 184, 166)
        self.set_line_width(0.8)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(6)

    def section_title(self, title):
        self.set_fill_color(240, 245, 245)
        self.set_text_color(15, 23, 42)
        self.set_font('Helvetica', 'B', 10)
        self.cell(0, 7, f'  {title}', fill=True, new_x='LMARGIN', new_y='NEXT')
        self.ln(2)

    def field_row(self, label, value):
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(70, 70, 70)
        self.cell(45, 5, label + ':', new_x='RIGHT', new_y='TOP')
        self.set_font('Helvetica', '', 9)
        self.set_text_color(20, 20, 20)
        self.multi_cell(0, 5, value, new_x='LMARGIN', new_y='NEXT')
        self.ln(1)

def generate():
    pdf = PDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.section_title('1. INCIDENT IDENTIFICATION & CLASSIFICATION')
    pdf.field_row('Deviation Number', 'DEV-2026-019')
    pdf.field_row('Title', 'Out-of-Specification (OOS) Dissolution Failure in Metformin HCl 500mg Tablets')
    pdf.field_row('Date of Occurrence', '2026-10-14')
    pdf.field_row('Date Reported', '2026-10-15')
    pdf.field_row('Reported By', 'Sarah Jenkins (QC Senior Analyst)')
    pdf.field_row('Facility / Site', 'Building 4, Solid Oral Dosage Manufacturing Facility')
    pdf.field_row('Severity Classification', 'Critical Deviation (Potential Patient Efficacy Impact)')
    pdf.ln(3)

    pdf.section_title('2. PRODUCT & BATCH TRACEABILITY')
    pdf.field_row('Product Name', 'Metformin Hydrochloride Extended-Release Tablets USP 500mg')
    pdf.field_row('Batch / Lot Number', 'MET-2026-B849')
    pdf.field_row('Manufacturing Date', '2026-10-10')
    pdf.field_row('Expiry Date', '2028-10-09')
    pdf.field_row('Batch Size', '450,000 Tablets (Drum lots 01 through 09)')
    pdf.field_row('Equipment Involved', 'Fette 2090 Rotary Tablet Press (TP-04), Glatt Fluid Bed Granulator (FBG-02)')
    pdf.ln(3)

    pdf.section_title('3. DESCRIPTION OF DEVIATION')
    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(30, 30, 30)
    desc = (
        "During finished product release testing of batch MET-2026-B849, Stage 1 (S1) dissolution testing "
        "yielded a mean result of 68.4% release at Q=45 minutes against the USP monograph specification of NLT 80% (Q). "
        "Two individual units tested below 65% (Unit #3: 63.1%, Unit #5: 64.8%). Re-testing in Stage 2 (S2) confirmed "
        "the failure with an overall 12-unit mean of 71.2%.\n\n"
        "Immediate Containment Actions: Quarantine Hold Notice QHN-2026-118 was issued. All 9 drums of lot MET-2026-B849 "
        "were physically locked in Quarantine Warehouse Bay C. No product was released to market."
    )
    pdf.multi_cell(0, 5, desc, new_x='LMARGIN', new_y='NEXT')
    pdf.ln(4)

    pdf.section_title('4. PRELIMINARY INVESTIGATION & OBSERVATIONS')
    obs = (
        "- Raw Materials: Metformin API batch API-M-902 passed all chemical and particle size (d90=42um) specifications.\n"
        "- Granulation: Fluid bed granulation drying temperature logged at 58C, within the 55-62C target range.\n"
        "- Compression Stage: Tablet compression log for Fette 2090 indicates main compression force was operated at "
        "28.5 kN, which significantly exceeds the validated master batch record range of 18.0 - 22.0 kN. "
        "Tablet breaking force (hardness) was recorded at 14.8 kp (specification: 7.0 - 10.5 kp).\n"
        "- Tooling & Operator: Senior compression operator was on emergency leave; replacement relief operator "
        "adjusted compression force manually after observing slight tablet capping during initial startup without QA supervisor sign-off."
    )
    pdf.multi_cell(0, 5, obs, new_x='LMARGIN', new_y='NEXT')
    pdf.ln(4)

    pdf.section_title('5. SCOPE & REGULATORY IMPACT')
    scope = (
        "- Impact Assessment: Batch is rejected and slated for destruction. Sister batch MET-2026-B850 manufactured on the same "
        "shift has been quarantined pending validation check.\n"
        "- Regulatory Reporting: Triggered 3-day notification requirement under 21 CFR 211.192 and EU GMP Chapter 1.\n"
        "- Investigation Target Date: 2026-10-28 (Within standard 30-day deviation closure window)."
    )
    pdf.multi_cell(0, 5, scope, new_x='LMARGIN', new_y='NEXT')

    desktop_dir = r"C:\Users\Chinmay Joshi\OneDrive\Desktop"
    desktop_path = os.path.join(desktop_dir, "pharmalens_demo_incident.pdf")
    workspace_path = r"C:\PharmaLens\sample_deviation_report.pdf"
    
    pdf.output(workspace_path)
    if os.path.exists(desktop_dir):
        pdf.output(desktop_path)
        print(f"Generated successfully at: {desktop_path}")
    print(f"Generated successfully at: {workspace_path}")

if __name__ == '__main__':
    generate()
