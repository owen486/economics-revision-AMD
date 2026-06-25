from flask import Flask, render_template, request, redirect, url_for, flash
import sqlite3
import os

app = Flask(__name__)
app.secret_key = "change-this-secret"
DATABASE = os.path.join(os.path.abspath(os.path.dirname(__file__)), "accounting.db")

ACCOUNTING_TOPICS = [
    {
        "title": "Double-Entry Accounting",
        "content": "Every transaction affects at least two accounts: debits and credits must balance."
    },
    {
        "title": "Accrual Basis",
        "content": "Record revenue when earned and expenses when incurred, not when cash changes hands."
    },
    {
        "title": "Matching Principle",
        "content": "Match expenses to the revenue they help generate, even if actual payment occurs later."
    },
    {
        "title": "Financial Statements",
        "content": "Use balance sheets, income statements, and cash flow statements to measure business performance."
    }
]

ECONOMICS_TOPICS = [
    {
        "title": "Supply and Demand",
        "content": "Prices are determined by how much consumers want goods and how much producers supply."
    },
    {
        "title": "Opportunity Cost",
        "content": "The value of the best alternative forgone when making a decision."
    },
    {
        "title": "Market Equilibrium",
        "content": "The price at which quantity supplied equals quantity demanded."
    },
    {
        "title": "Elasticity",
        "content": "How sensitive demand or supply is to changes in price."
    }
]

GLOSSARY = [
    {"term": "Assets", "definition": "Resources owned by a business that provide future benefits."},
    {"term": "Liabilities", "definition": "Obligations or debts owed by the business."},
    {"term": "Equity", "definition": "The owner’s claim on business assets after liabilities."},
    {"term": "Revenue", "definition": "Income earned from sales of goods or services."},
    {"term": "Expenses", "definition": "Costs incurred to operate the business."},
    {"term": "Gross Profit", "definition": "Revenue minus cost of goods sold."}
]

RESOURCES = [
    {"name": "AccountingCoach", "url": "https://www.accountingcoach.com/"},
    {"name": "Investopedia", "url": "https://www.investopedia.com/"},
    {"name": "Khan Academy Economics", "url": "https://www.khanacademy.org/economics-finance-domain"},
    {"name": "Flask Documentation", "url": "https://flask.palletsprojects.com/"}
]


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    if not os.path.exists(DATABASE):
        conn = get_db_connection()
        conn.execute(
            """
            CREATE TABLE ledger (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                notes TEXT
            )
            """
        )
        conn.commit()
        conn.close()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/accounting")
def accounting():
    return render_template("accounting.html", topics=ACCOUNTING_TOPICS)


@app.route("/economics")
def economics():
    return render_template("economics.html", topics=ECONOMICS_TOPICS)


@app.route("/glossary")
def glossary():
    return render_template("glossary.html", glossary=GLOSSARY)


@app.route("/resources")
def resources():
    return render_template("resources.html", resources=RESOURCES)


@app.route("/calculator", methods=["GET", "POST"])
def calculator():
    result = None
    if request.method == "POST":
        calc_type = request.form.get("calc_type")
        try:
            if calc_type == "profit_margin":
                revenue = float(request.form.get("revenue", 0))
                cost = float(request.form.get("cost", 0))
                if revenue == 0:
                    raise ValueError("Revenue must be greater than zero.")
                result = {
                    "title": "Profit Margin",
                    "value": round((revenue - cost) / revenue * 100, 2),
                    "unit": "%"
                }
            elif calc_type == "break_even":
                fixed = float(request.form.get("fixed_costs", 0))
                price = float(request.form.get("price", 0))
                variable = float(request.form.get("variable_cost", 0))
                if price <= variable:
                    raise ValueError("Price must exceed variable cost.")
                result = {
                    "title": "Break-even Units",
                    "value": int(fixed / (price - variable)),
                    "unit": "units"
                }
            elif calc_type == "current_ratio":
                current_assets = float(request.form.get("current_assets", 0))
                current_liabilities = float(request.form.get("current_liabilities", 0))
                if current_liabilities == 0:
                    raise ValueError("Current liabilities must be greater than zero.")
                result = {
                    "title": "Current Ratio",
                    "value": round(current_assets / current_liabilities, 2),
                    "unit": ""
                }
        except ValueError as exc:
            flash(str(exc), "error")
    return render_template("calculator.html", result=result)


@app.route("/ledger", methods=["GET", "POST"])
def ledger():
    conn = get_db_connection()
    if request.method == "POST":
        date = request.form.get("date")
        description = request.form.get("description")
        category = request.form.get("category")
        entry_type = request.form.get("type")
        amount = request.form.get("amount")
        notes = request.form.get("notes")
        if not date or not description or not category or not entry_type or not amount:
            flash("Please fill in all required fields.", "error")
        else:
            try:
                amount_val = float(amount)
                conn.execute(
                    "INSERT INTO ledger (date, description, category, type, amount, notes) VALUES (?, ?, ?, ?, ?, ?)",
                    (date, description, category, entry_type, amount_val, notes),
                )
                conn.commit()
                flash("Ledger entry added successfully.", "success")
                return redirect(url_for("ledger"))
            except ValueError:
                flash("Amount must be a valid number.", "error")
    entries = conn.execute("SELECT * FROM ledger ORDER BY date DESC").fetchall()
    conn.close()
    total_debits = sum(e["amount"] for e in entries if e["type"] == "Debit")
    total_credits = sum(e["amount"] for e in entries if e["type"] == "Credit")
    return render_template(
        "ledger.html",
        entries=entries,
        total_debits=total_debits,
        total_credits=total_credits,
    )


@app.route("/ledger/delete/<int:entry_id>")
def delete_entry(entry_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM ledger WHERE id = ?", (entry_id,))
    conn.commit()
    conn.close()
    flash("Ledger entry deleted.", "success")
    return redirect(url_for("ledger"))


@app.route("/contact", methods=["GET", "POST"])
def contact():
    message_sent = False
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        message = request.form.get("message")
        if not name or not email or not message:
            flash("Please complete the contact form.", "error")
        else:
            message_sent = True
            flash("Thank you! Your message was submitted.", "success")
    return render_template("contact.html", message_sent=message_sent)


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
