import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render 'Page X of Y' page numbers,
    running headers, and running footers across all pages.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Skip header and footer on the title page
            return

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))

        # Running Header
        self.drawString(54, 750, "MINI ERP + CRM OPERATIONS PORTAL — TECHNICAL SPECIFICATION & ARCHITECTURE")
        self.setFont("Helvetica", 8)
        self.drawRightString(612 - 54, 750, "Basics to Advanced Guide")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.75)
        self.line(54, 742, 612 - 54, 742)

        # Running Footer
        self.line(54, 48, 612 - 54, 48)
        self.drawString(54, 34, "CONFIDENTIAL — FOR INTERNAL SYSTEM & DEVELOPER USE ONLY")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 34, page_text)

        self.restoreState()

def create_pdf(filename="ERP_CRM_Portal_Documentation.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Palette
    c_primary = colors.HexColor("#0F172A")    # Dark slate
    c_accent = colors.HexColor("#0284C7")     # Bright sky blue
    c_secondary = colors.HexColor("#334155")  # Mid slate
    c_dark = colors.HexColor("#1E293B")       # Card dark
    c_light_bg = colors.HexColor("#F8FAFC")   # Light background
    c_border = colors.HexColor("#E2E8F0")     # Border color
    c_code_bg = colors.HexColor("#1E1E2E")    # Code block background
    c_code_txt = colors.HexColor("#A6E3A1")   # Code text green

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=c_primary,
        alignment=0, # Left-aligned
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=14,
        leading=18,
        textColor=c_accent,
        spaceAfter=25
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_primary,
        spaceBefore=22,
        spaceAfter=10,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_accent,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=c_secondary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=c_code_txt,
        backColor=c_code_bg,
        borderPadding=8,
        spaceBefore=8,
        spaceAfter=8,
        borderRadius=4
    )

    callout_style = ParagraphStyle(
        'Callout_Custom',
        parent=body_style,
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E3A8A"),
        backColor=colors.HexColor("#EFF6FF"),
        borderColor=colors.HexColor("#3B82F6"),
        borderWidth=1,
        borderPadding=8,
        spaceBefore=8,
        spaceAfter=10,
        borderRadius=4
    )

    story = []

    # =========================================================================
    # TITLE & COVER SECTION
    # =========================================================================
    story.append(Spacer(1, 20))
    story.append(Paragraph("MINI ERP + CRM PORTAL", title_style))
    story.append(Paragraph("Full-Stack Enterprise System — Technical Architecture & Developer Specification (Basics to Advanced)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=3, color=c_accent, spaceBefore=0, spaceAfter=20))

    # Overview Card Box
    overview_text = (
        "<b>System Overview:</b> The Mini ERP + CRM Operations Portal is a production-ready, full-stack enterprise "
        "application engineered for wholesale and distribution operations. It combines customer relationship management (CRM), "
        "product catalog management with live inventory alerting, transactional stock movements, and multi-item sales order creation "
        "backed by atomic SQL stock deduction. The platform features a premium dark glassmorphism UI powered by React 18, Vite, and an interactive 3D WebGL particle graphics engine built with Three.js."
    )
    story.append(Paragraph(overview_text, callout_style))
    story.append(Spacer(1, 10))

    # Metadata Table
    meta_data = [
        [Paragraph("<b>Document Version:</b> 1.0.0", body_style), Paragraph("<b>Target Stack:</b> Node.js, Express, React, PostgreSQL", body_style)],
        [Paragraph("<b>Author:</b> Antigravity Engineering Team", body_style), Paragraph("<b>Database Engine:</b> PostgreSQL 15 + Dual In-Memory Fallback", body_style)],
        [Paragraph("<b>Repository:</b> Sonut05/mini-erp-crm-portal", body_style), Paragraph("<b>License:</b> MIT Enterprise License", body_style)]
    ]
    t_meta = Table(meta_data, colWidths=[250, 254])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_light_bg),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 20))

    # Table of Contents Summary
    story.append(Paragraph("Table of Contents", h2_style))
    toc_items = [
        "1. Executive Architecture & Core Principles (Basics)",
        "2. Relational Database Schema & Data Modeling",
        "3. Authentication, Security & Role-Based Access Control (RBAC)",
        "4. Deep-Dive: Core Business Modules & Transactional Engine (Advanced)",
        "5. Frontend Architecture, State & WebGL 3D Graphics Engine",
        "6. DevOps, Docker Containerization & Serverless Deployment",
        "7. Complete REST API Reference Specification & Test Credentials"
    ]
    for item in toc_items:
        story.append(Paragraph(f"• <b>{item}</b>", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 1: ARCHITECTURE & CORE PRINCIPLES
    # =========================================================================
    story.append(Paragraph("1. Executive Architecture & Core Principles", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "The system follows a modern 3-Tier Layered Software Architecture designed for scalability, zero-downtime serverless cold starts, and high data integrity.",
        body_style
    ))

    # Architecture Diagram Table
    arch_diagram = [
        [Paragraph("<b>Tier</b>", body_style), Paragraph("<b>Technology</b>", body_style), Paragraph("<b>Key Responsibilities</b>", body_style)],
        [
            Paragraph("<b>Presentation Tier</b>", body_style),
            Paragraph("React 18 + TypeScript<br/>Vite + Three.js<br/>Vanilla CSS Glassmorphism", body_style),
            Paragraph("Single Page Application (SPA), Client-side routing (React Router v6), Interactive 3D Canvas rendering, Auth Context state, Responsive drawer & modal forms.", body_style)
        ],
        [
            Paragraph("<b>Application Tier</b>", body_style),
            Paragraph("Node.js v18+<br/>Express.js<br/>JWT + Zod", body_style),
            Paragraph("Modular REST API (Router → Controller → Service → Schema), Request body validation, Stateless JWT auth verification, RBAC permission enforcement.", body_style)
        ],
        [
            Paragraph("<b>Data Tier</b>", body_style),
            Paragraph("PostgreSQL 15<br/><i>Dual Fallback:</i> pg-mem", body_style),
            Paragraph("ACID Compliant relational store, raw SQL execution with `pg` driver, explicit transaction blocks (`BEGIN/COMMIT/ROLLBACK`), auto-fallback to in-memory DB in serverless/offline environments.", body_style)
        ]
    ]
    t_arch = Table(arch_diagram, colWidths=[110, 140, 254])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 12))

    story.append(Paragraph("Key Architectural Principles:", h2_style))
    story.append(Paragraph("• <b>Raw SQL Driver over Heavy ORM:</b> Utilizes Node `pg` directly without heavy abstraction layers like Prisma or TypeORM. This guarantees exact control over SQL queries, subqueries, and transaction boundaries while maximizing throughput.", bullet_style))
    story.append(Paragraph("• <b>Modular Layered Pattern:</b> Each feature (Auth, Customers, Products, Stock, Orders) is strictly compartmentalized into four clean layers: <i>Router</i> (HTTP routes), <i>Controller</i> (Req/Res orchestration), <i>Service</i> (Business logic & SQL execution), and <i>Schema</i> (Zod validation).", bullet_style))
    story.append(Paragraph("• <b>Dual-Database Strategy:</b> Features a resilient initialization handler (`src/config/db.ts`) that automatically attempts to connect to PostgreSQL. If no local/remote PG instance is detected (or when running inside Netlify serverless lambdas), it seamless hot-swaps to `pg-mem` (a high-performance in-memory SQL database) and auto-seeds initial data. Zero configuration required to test!", bullet_style))

    story.append(Spacer(1, 15))

    # =========================================================================
    # SECTION 2: DATABASE SCHEMA & DATA MODELING
    # =========================================================================
    story.append(Paragraph("2. Relational Database Schema & Data Modeling", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "The relational data store consists of 6 structured tables enforcing referential integrity, unique constraints, and strict data types.",
        body_style
    ))

    schema_table_data = [
        [Paragraph("<b>Table Name</b>", body_style), Paragraph("<b>Primary Keys & Foreign Keys</b>", body_style), Paragraph("<b>Key Constraints & Description</b>", body_style)],
        [
            Paragraph("<b>users</b>", body_style),
            Paragraph("id (PK)", body_style),
            Paragraph("`email` UNIQUE NOT NULL. Stores user accounts with role constraints: `CHECK (role IN ('Admin', 'Sales', 'Warehouse', 'Accounts'))`.", body_style)
        ],
        [
            Paragraph("<b>customers</b>", body_style),
            Paragraph("id (PK)", body_style),
            Paragraph("CRM contacts. `type` CHECK ('Retail', 'Wholesale', 'Distributor'). `status` CHECK ('Lead', 'Active', 'Inactive'). Follow-up dates & timestamped text notes.", body_style)
        ],
        [
            Paragraph("<b>products</b>", body_style),
            Paragraph("id (PK)", body_style),
            Paragraph("Catalog items. `sku` UNIQUE NOT NULL. `unit_price` NUMERIC(10,2). `current_stock` and `min_stock_alert` threshold for inventory warnings.", body_style)
        ],
        [
            Paragraph("<b>stock_movements</b>", body_style),
            Paragraph("id (PK)<br/>product_id (FK -> products.id)<br/>created_by (FK -> users.id)", body_style),
            Paragraph("Audit trail log. `movement_type` CHECK ('IN', 'OUT'). `quantity_changed` INTEGER. Captures stock entry/deduction reason and user attribution.", body_style)
        ],
        [
            Paragraph("<b>orders</b>", body_style),
            Paragraph("id (PK)<br/>customer_id (FK -> customers.id)<br/>created_by (FK -> users.id)", body_style),
            Paragraph("Sales Orders. `order_number` UNIQUE (Format: ORD-YYYYMMDD-XXXX). `status` CHECK ('Draft', 'Confirmed', 'Cancelled'). Total quantity counter.", body_style)
        ],
        [
            Paragraph("<b>order_items</b>", body_style),
            Paragraph("id (PK)<br/>order_id (FK -> orders.id ON DELETE CASCADE)<br/>product_id (FK -> products.id)", body_style),
            Paragraph("Order line items. Includes <b>Financial Snapshot Fields</b> (`product_name_snapshot`, `product_price_snapshot`) to preserve price history.", body_style)
        ],
    ]
    t_schema = Table(schema_table_data, colWidths=[100, 150, 254])
    t_schema.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_dark),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_schema)

    story.append(Spacer(1, 10))
    story.append(Paragraph("SQL DDL Schema Excerpt:", h3_style))
    code_sql = (
        "CREATE TABLE orders (\n"
        "  id SERIAL PRIMARY KEY,\n"
        "  order_number VARCHAR(50) UNIQUE NOT NULL,\n"
        "  customer_id INTEGER NOT NULL REFERENCES customers(id),\n"
        "  status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),\n"
        "  total_quantity INTEGER NOT NULL DEFAULT 0,\n"
        "  created_by INTEGER NOT NULL REFERENCES users(id),\n"
        "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n"
        ");"
    )
    story.append(Paragraph(code_sql.replace('\n', '<br/>').replace(' ', '&nbsp;'), code_style))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 3: AUTHENTICATION & SECURITY MODEL
    # =========================================================================
    story.append(Paragraph("3. Authentication, Security & RBAC Model", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "Security is implemented at both the HTTP layer and API endpoint layer using industry-standard JSON Web Tokens (JWT) and granular Role-Based Access Control (RBAC).",
        body_style
    ))

    story.append(Paragraph("Core Security Mechanisms:", h2_style))
    story.append(Paragraph("• <b>Password Cryptography:</b> Password inputs are hashed using `bcryptjs` with a cost factor of 12. Plaintext passwords are never stored or logged.", bullet_style))
    story.append(Paragraph("• <b>Stateless JWT Bearer Auth:</b> Upon successful login via `/api/auth/login`, the server returns a signed JWT containing user `id`, `email`, and `role`. Clients store this token and attach it to subsequent requests via header `Authorization: Bearer <token>`.", bullet_style))
    story.append(Paragraph("• <b>Strict Payload Validation:</b> All incoming request bodies (POST/PUT) are strictly validated before hitting controllers using `Zod` schemas. Invalid data returns automatic HTTP 400 with field error details.", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Role Access Permission Matrix:", h2_style))

    rbac_data = [
        [Paragraph("<b>Module / Action</b>", body_style), Paragraph("<b>Admin</b>", body_style), Paragraph("<b>Sales</b>", body_style), Paragraph("<b>Warehouse</b>", body_style), Paragraph("<b>Accounts</b>", body_style)],
        [Paragraph("<b>Authentication & Profile</b>", body_style), Paragraph("Full Access", body_style), Paragraph("Full Access", body_style), Paragraph("Full Access", body_style), Paragraph("Full Access", body_style)],
        [Paragraph("<b>CRM Customers (Read)</b>", body_style), Paragraph("✅ Allowed", body_style), Paragraph("✅ Allowed", body_style), Paragraph("❌ Forbidden", body_style), Paragraph("✅ Allowed", body_style)],
        [Paragraph("<b>CRM Customers (Create/Update)</b>", body_style), Paragraph("✅ Allowed", body_style), Paragraph("✅ Allowed", body_style), Paragraph("❌ Forbidden", body_style), Paragraph("❌ Forbidden", body_style)],
        [Paragraph("<b>Product Catalog (Read)</b>", body_style), Paragraph("✅ Allowed", body_style), Paragraph("✅ Allowed", body_style), Paragraph("✅ Allowed", body_style), Paragraph("✅ Allowed", body_style)],
        [Paragraph("<b>Product Catalog (Create/Update)</b>", body_style), Paragraph("✅ Allowed", body_style), Paragraph("❌ Forbidden", body_style), Paragraph("✅ Allowed", body_style), Paragraph("❌ Forbidden", body_style)],
        [Paragraph("<b>Stock Movements (IN/OUT)</b>", body_style), Paragraph("✅ Allowed", body_style), Paragraph("❌ Forbidden", body_style), Paragraph("✅ Allowed", body_style), Paragraph("❌ Forbidden", body_style)],
        [Paragraph("<b>Sales Orders (Create/Update)</b>", body_style), Paragraph("✅ Allowed", body_style), Paragraph("✅ Allowed", body_style), Paragraph("❌ Forbidden", body_style), Paragraph("❌ Forbidden", body_style)],
        [Paragraph("<b>Sales Orders (View)</b>", body_style), Paragraph("✅ Allowed", body_style), Paragraph("✅ Allowed", body_style), Paragraph("❌ Forbidden", body_style), Paragraph("✅ Allowed", body_style)],
    ]
    t_rbac = Table(rbac_data, colWidths=[154, 85, 85, 90, 90])
    t_rbac.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
    ]))
    story.append(t_rbac)

    story.append(Spacer(1, 15))

    # =========================================================================
    # SECTION 4: CORE BUSINESS MODULES & TRANSACTIONAL ENGINE
    # =========================================================================
    story.append(Paragraph("4. Core Business Modules & Transactional Engine (Advanced)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("4.1 Sales Order Lifecycle & Price Snapshot Architecture", h2_style))
    story.append(Paragraph(
        "A critical problem in enterprise ERP design is price mutation: if a product's price changes in the product catalog next month, "
        "historical orders generated today must NOT change their totals. To solve this, our system uses the <b>Price & Name Snapshot Pattern</b>.",
        body_style
    ))
    story.append(Paragraph(
        "When an order is created, the system queries product records and inserts lines into `order_items` with `product_name_snapshot` and "
        "`product_price_snapshot`. This guarantees historical financial accuracy regardless of future product catalog updates.",
        body_style
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("4.2 Transactional Stock Deduction & ACID Guarantees", h2_style))
    story.append(Paragraph(
        "Order confirmation and cancellation involve atomic multi-table updates. To prevent race conditions, dirty reads, and negative stock levels, "
        "the service layer uses explicit SQL transactions with row-level locking (`FOR UPDATE`).",
        body_style
    ))

    code_trx = (
        "// Excerpt from backend/src/modules/orders/service.ts\n"
        "await client.query('BEGIN');\n"
        "// 1. Lock product row to prevent concurrent race conditions\n"
        "const product = await client.query('SELECT current_stock FROM products WHERE id = $1 FOR UPDATE', [id]);\n"
        "if (product.current_stock < requestedQty) {\n"
        "    await client.query('ROLLBACK');\n"
        "    throw new Error('Insufficient stock');\n"
        "}\n"
        "// 2. Deduct stock atomically\n"
        "await client.query('UPDATE products SET current_stock = current_stock - $1 WHERE id = $2', [qty, id]);\n"
        "// 3. Create stock movement audit trail entry (OUT)\n"
        "await client.query('INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by) ...');\n"
        "// 4. Update order status to Confirmed\n"
        "await client.query('UPDATE orders SET status = \\'Confirmed\\' WHERE id = $1', [orderId]);\n"
        "await client.query('COMMIT');"
    )
    story.append(Paragraph(code_trx.replace('\n', '<br/>').replace(' ', '&nbsp;'), code_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("4.3 Automatic Stock Restoration on Order Cancellation", h2_style))
    story.append(Paragraph(
        "If a `Confirmed` order is transitioned to `Cancelled`, the system opens a new SQL transaction, iterates over all `order_items`, "
        "increments product `current_stock` by the ordered quantities, and creates an audit movement log with type `IN` and reason `'Order ORD-XXX cancelled - stock restored'`. "
        "If an order is in `Draft` state, cancellation modifies the status without affecting stock.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 5: FRONTEND ARCHITECTURE & 3D GRAPHICS ENGINE
    # =========================================================================
    story.append(Paragraph("5. Frontend Architecture & WebGL 3D Graphics Engine", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "The client application is built with React 18, TypeScript, Vite, and Vanilla CSS utilizing a custom Glassmorphism design system.",
        body_style
    ))

    story.append(Paragraph("5.1 Client Architecture & Component Hierarchy", h2_style))
    story.append(Paragraph("• <b>AuthContext (`src/context/AuthContext.tsx`):</b> Manages global user authentication state, token persistence in `localStorage`, and automated Axios header injection via request interceptors.", bullet_style))
    story.append(Paragraph("• <b>ProtectedRoute (`src/components/ProtectedRoute.tsx`):</b> Higher-order component wrapper enforcing token presence and matching user roles before rendering secured page routes.", bullet_style))
    story.append(Paragraph("• <b>Sidebar Navigation (`src/components/Sidebar.tsx`):</b> Dynamic sidebar filtering navigation links based on current user role permissions.", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("5.2 Three.js WebGL Interactive 3D Canvas Engine", h2_style))
    story.append(Paragraph(
        "A defining visual feature of the portal is the custom 3D background component (`src/components/ThreeBackground.tsx`). "
        "It initializes a WebGL context using `Three.js` and renders a futuristic multi-layered environment:",
        body_style
    ))

    three_features = [
        [Paragraph("<b>Graphics Component</b>", body_style), Paragraph("<b>Technical Implementation</b>", body_style)],
        [Paragraph("<b>Particle Universe</b>", body_style), Paragraph("Renders 1,200 particle instances with randomized (x, y, z) coordinates, custom size attenuation, and dynamic color blending.", body_style)],
        [Paragraph("<b>Cybernetic Wave Grid</b>", body_style), Paragraph("Uses `PlaneGeometry` with custom vertex math to construct a undulating 3D wireframe mesh representing real-time data streams.", body_style)],
        [Paragraph("<b>Quantum Data Crystals</b>", body_style), Paragraph("Floating `IcosahedronGeometry` shapes rotating along (x, y, z) axes with metallic standard materials reactive to lighting.", body_style)],
        [Paragraph("<b>Mouse Parallax Camera</b>", body_style), Paragraph("Listens to client mouse movement (`mousemove`) and applies smooth lerp interpolation to the camera position for immersive depth.", body_style)]
    ]
    t_three = Table(three_features, colWidths=[150, 354])
    t_three.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_dark),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_three)

    story.append(Spacer(1, 15))

    # =========================================================================
    # SECTION 6: DEVOPS, DOCKER & SERVERLESS DEPLOYMENT
    # =========================================================================
    story.append(Paragraph("6. DevOps, Docker Containerization & Serverless Deployment", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "The repository is configured for both full-stack Docker orchestration and multi-cloud serverless deployment.",
        body_style
    ))

    story.append(Paragraph("6.1 Multi-Container Docker Architecture (`docker-compose.yml`)", h2_style))
    story.append(Paragraph("• <b>frontend service:</b> Built with multi-stage Dockerfile serving optimized Vite build via NGINX on port `3000`.", bullet_style))
    story.append(Paragraph("• <b>backend service:</b> Node.js TypeScript container running Express server on port `5000` with health checks.", bullet_style))
    story.append(Paragraph("• <b>postgres service:</b> PostgreSQL 15 official alpine image bound to port `5432` with persistent named volume `postgres_data`.", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("6.2 Netlify Serverless Functions Integration", h2_style))
    story.append(Paragraph(
        "For serverless hosting (e.g. Netlify / AWS Lambda), the backend incorporates `serverless-http` wrapper in `netlify/functions/api.js`. "
        "A custom Express URL normalization middleware automatically strips serverless function prefixes (`/.netlify/functions/api` -> `/api`) "
        "allowing the exact same Express codebase to run seamlessly in both traditional Docker containers and serverless lambdas.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 7: API REFERENCE & TEST CREDENTIALS
    # =========================================================================
    story.append(Paragraph("7. Complete REST API Reference Specification", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("Base API Endpoint URL: `http://localhost:5000/api` (All protected routes require `Authorization: Bearer <token>`)", body_style))

    api_endpoints = [
        [Paragraph("<b>Method</b>", body_style), Paragraph("<b>Endpoint Path</b>", body_style), Paragraph("<b>Access Roles</b>", body_style), Paragraph("<b>Description</b>", body_style)],
        [Paragraph("POST", body_style), Paragraph("/auth/login", body_style), Paragraph("Public", body_style), Paragraph("Authenticate user with email & password. Returns JWT token.", body_style)],
        [Paragraph("GET", body_style), Paragraph("/auth/me", body_style), Paragraph("All Roles", body_style), Paragraph("Retrieve current authenticated user profile & permissions.", body_style)],
        [Paragraph("GET", body_style), Paragraph("/customers", body_style), Paragraph("Admin, Sales, Accounts", body_style), Paragraph("List customers with search, status/type filters, and pagination.", body_style)],
        [Paragraph("POST", body_style), Paragraph("/customers", body_style), Paragraph("Admin, Sales", body_style), Paragraph("Create a new customer contact with business & GST details.", body_style)],
        [Paragraph("POST", body_style), Paragraph("/customers/:id/notes", body_style), Paragraph("Admin, Sales", body_style), Paragraph("Append timestamped follow-up note to customer record.", body_style)],
        [Paragraph("GET", body_style), Paragraph("/products", body_style), Paragraph("All Roles", body_style), Paragraph("List product catalog. Includes low-stock alert filter.", body_style)],
        [Paragraph("POST", body_style), Paragraph("/products", body_style), Paragraph("Admin, Warehouse", body_style), Paragraph("Create new product SKU with stock threshold parameters.", body_style)],
        [Paragraph("POST", body_style), Paragraph("/stock/movement", body_style), Paragraph("Admin, Warehouse", body_style), Paragraph("Record manual IN or OUT stock movement with audit reason.", body_style)],
        [Paragraph("GET", body_style), Paragraph("/orders", body_style), Paragraph("Admin, Sales, Accounts", body_style), Paragraph("List sales orders with status filters and customer join.", body_style)],
        [Paragraph("POST", body_style), Paragraph("/orders", body_style), Paragraph("Admin, Sales", body_style), Paragraph("Create multi-item order in Draft or Confirmed state.", body_style)],
        [Paragraph("PUT", body_style), Paragraph("/orders/:id/status", body_style), Paragraph("Admin, Sales", body_style), Paragraph("Update order status (Draft -> Confirmed, Confirmed -> Cancelled).", body_style)],
        [Paragraph("GET", body_style), Paragraph("/dashboard/stats", body_style), Paragraph("All Roles", body_style), Paragraph("Aggregated metrics: total customers, low stock count, recent orders.", body_style)],
    ]
    t_api = Table(api_endpoints, colWidths=[55, 120, 110, 219])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 4.5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_api)

    story.append(Spacer(1, 15))
    story.append(Paragraph("System Test Credentials:", h2_style))

    creds_data = [
        [Paragraph("<b>Role</b>", body_style), Paragraph("<b>Email Address</b>", body_style), Paragraph("<b>Default Password</b>", body_style), Paragraph("<b>Scope / Focus Area</b>", body_style)],
        [Paragraph("<b>Admin</b>", body_style), Paragraph("admin@erp.com", body_style), Paragraph("Admin@123", body_style), Paragraph("Unrestricted system superuser access", body_style)],
        [Paragraph("<b>Sales</b>", body_style), Paragraph("sales@erp.com", body_style), Paragraph("Sales@123", body_style), Paragraph("Customer CRM, follow-ups & Sales Orders", body_style)],
        [Paragraph("<b>Warehouse</b>", body_style), Paragraph("warehouse@erp.com", body_style), Paragraph("Warehouse@123", body_style), Paragraph("Product catalog, SKU creation & Stock IN/OUT", body_style)],
        [Paragraph("<b>Accounts</b>", body_style), Paragraph("accounts@erp.com", body_style), Paragraph("Accounts@123", body_style), Paragraph("Read-only financial view of orders & customers", body_style)],
    ]
    t_creds = Table(creds_data, colWidths=[90, 130, 100, 184])
    t_creds.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_dark),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_creds)

    story.append(Spacer(1, 25))
    story.append(HRFlowable(width="100%", thickness=1, color=c_accent, spaceBefore=10, spaceAfter=15))
    story.append(Paragraph("<i>End of Mini ERP + CRM Portal Technical Documentation — Generated for Sonut05/mini-erp-crm-portal</i>", ParagraphStyle('FooterNote', parent=body_style, alignment=1, fontName='Helvetica-Oblique', textColor=colors.HexColor("#64748B"))))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] Documentation PDF successfully created: {filename}")

if __name__ == "__main__":
    create_pdf()
