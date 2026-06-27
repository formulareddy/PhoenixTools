export interface BusinessResult {
  content: string;
  filename: string;
  mimeType: string;
}

function generateInvoiceNumber(): string {
  const prefix = "INV";
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}-${random}`;
}

function generateReceiptNumber(): string {
  const prefix = "RCP";
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${year}${month}${day}-${random}`;
}

function generateQuoteNumber(): string {
  const prefix = "QTN";
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}-${random}`;
}

function generatePONumber(): string {
  const prefix = "PO";
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}-${random}`;
}

function generateProposalNumber(): string {
  const prefix = "PROP";
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${year}${month}-${random}`;
}

function generateContractNumber(): string {
  const prefix = "CTR";
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}-${random}`;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

function parseItems(itemsStr: string): { desc: string; qty: number; rate: number }[] {
  const items = itemsStr.split(";").map((item) => item.trim());
  const result: { desc: string; qty: number; rate: number }[] = [];

  for (const item of items) {
    if (!item) continue;
    const parts = item.split(":");
    if (parts.length === 3) {
      const desc = parts[0].trim();
      const qty = parseFloat(parts[1].trim());
      const rate = parseFloat(parts[2].trim());
      if (!isNaN(qty) && !isNaN(rate)) {
        result.push({ desc, qty, rate });
      }
    }
  }

  return result;
}

function createDoubleLine(): string {
  return "================================================================";
}

function createSingleLine(): string {
  return "----------------------------------------------------------------";
}

function createDashedLine(): string {
  return "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -";
}

function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  const rightPadding = Math.max(0, width - text.length - padding);
  return " ".repeat(padding) + text + " ".repeat(rightPadding);
}

function padRight(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - text.length));
}

function padLeft(text: string, width: number): string {
  return " ".repeat(Math.max(0, width - text.length)) + text;
}

function padCenter(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(padding) + text;
}

function repeatChar(char: string, count: number): string {
  return char.repeat(Math.max(0, count));
}

function wrapText(text: string, width: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 > width) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
}

export function generateInvoice(
  business: string,
  client: string,
  items: string,
  due: string
): string {
  const invoiceNum = generateInvoiceNumber();
  const today = formatDate(new Date());
  const dueDate = due || "Net 30";
  const parsedItems = parseItems(items);
  const width = 64;

  let output = "";
  output += createDoubleLine() + "\n";
  output += centerText("INVOICE", width) + "\n";
  output += centerText(invoiceNum, width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "FROM:\n";
  output += createSingleLine() + "\n";
  const businessLines = business.split("|");
  for (const line of businessLines) {
    output += line.trim() + "\n";
  }
  output += "\n";

  output += "BILL TO:\n";
  output += createSingleLine() + "\n";
  const clientLines = client.split("|");
  for (const line of clientLines) {
    output += line.trim() + "\n";
  }
  output += "\n";

  output += "INVOICE DETAILS:\n";
  output += createSingleLine() + "\n";
  output += padRight("Invoice Number:", 20) + padLeft(invoiceNum, width - 20) + "\n";
  output += padRight("Invoice Date:", 20) + padLeft(today, width - 20) + "\n";
  output += padRight("Payment Terms:", 20) + padLeft(dueDate, width - 20) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += padRight("DESCRIPTION", 28);
  output += padRight("QTY", 8);
  output += padRight("RATE", 12);
  output += padLeft("AMOUNT", 16) + "\n";
  output += createDoubleLine() + "\n";

  let subtotal = 0;
  for (const item of parsedItems) {
    const amount = item.qty * item.rate;
    subtotal += amount;
    output += padRight(item.desc.substring(0, 28), 28);
    output += padRight(String(item.qty), 8);
    output += padRight(formatCurrency(item.rate), 12);
    output += padLeft("$" + formatCurrency(amount), 16) + "\n";
  }

  const taxRate = 0.1;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  output += createSingleLine() + "\n";
  output += padRight("", 40);
  output += padRight("Subtotal:", 12);
  output += padLeft("$" + formatCurrency(subtotal), 12) + "\n";
  output += padRight("", 40);
  output += padRight("Tax (10%):", 12);
  output += padLeft("$" + formatCurrency(taxAmount), 12) + "\n";
  output += createDoubleLine() + "\n";
  output += padRight("", 40);
  output += padRight("TOTAL:", 12);
  output += padLeft("$" + formatCurrency(total), 12) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "PAYMENT TERMS:\n";
  output += createDashedLine() + "\n";
  output += "Payment is due within 30 days of the invoice date.\n";
  output += "Please include the invoice number with your payment.\n";
  output += "Late payments may incur a 1.5% monthly finance charge.\n";
  output += "\n";

  output += "NOTES:\n";
  output += createDashedLine() + "\n";
  output += "Thank you for your business! We appreciate your prompt payment.\n";
  output += "If you have any questions about this invoice, please contact\n";
  output += "our accounting department at the number above.\n\n";

  output += "PAYMENT METHODS ACCEPTED:\n";
  output += createDashedLine() + "\n";
  output += "  - Check or Money Order\n";
  output += "  - Bank Transfer (ACH)\n";
  output += "  - Credit Card (Visa, MasterCard, American Express)\n";
  output += "  - PayPal\n\n";

  output += createSingleLine() + "\n";
  output += centerText("This is a computer-generated invoice.", width) + "\n";
  output += centerText("No signature required.", width) + "\n";
  output += createSingleLine() + "\n";

  return output;
}

export function generateReceipt(
  business: string,
  customer: string,
  items: string,
  payment: string
): string {
  const receiptNum = generateReceiptNumber();
  const today = formatDate(new Date());
  const parsedItems = parseItems(items);
  const width = 64;

  let output = "";
  output += createDoubleLine() + "\n";
  output += centerText("RECEIPT", width) + "\n";
  output += centerText(receiptNum, width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "FROM:\n";
  output += createSingleLine() + "\n";
  const businessLines = business.split("|");
  for (const line of businessLines) {
    output += line.trim() + "\n";
  }
  output += "\n";

  output += "SOLD TO:\n";
  output += createSingleLine() + "\n";
  output += customer + "\n";
  output += "\n";

  output += "RECEIPT DETAILS:\n";
  output += createSingleLine() + "\n";
  output += padRight("Receipt Number:", 20) + padLeft(receiptNum, width - 20) + "\n";
  output += padRight("Date:", 20) + padLeft(today, width - 20) + "\n";
  output += padRight("Payment Method:", 20) + padLeft(payment || "Cash", width - 20) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += padRight("ITEM", 36);
  output += padLeft("PRICE", 28) + "\n";
  output += createDoubleLine() + "\n";

  let subtotal = 0;
  for (const item of parsedItems) {
    const amount = item.qty * item.rate;
    subtotal += amount;
    const lineTotal = item.qty + " x $" + formatCurrency(item.rate);
    output += padRight(item.desc.substring(0, 36), 36);
    output += padLeft("$" + formatCurrency(amount), 28) + "\n";
    output += padRight("  " + lineTotal, 36);
    output += padLeft("", 28) + "\n";
  }

  const taxRate = 0.1;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  output += createSingleLine() + "\n";
  output += padRight("", 36);
  output += padRight("Subtotal:", 16);
  output += padLeft("$" + formatCurrency(subtotal), 12) + "\n";
  output += padRight("", 36);
  output += padRight("Tax (10%):", 16);
  output += padLeft("$" + formatCurrency(taxAmount), 12) + "\n";
  output += createDoubleLine() + "\n";
  output += padRight("", 36);
  output += padRight("TOTAL:", 16);
  output += padLeft("$" + formatCurrency(total), 12) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "PAYMENT CONFIRMATION:\n";
  output += createDashedLine() + "\n";
  output += "Amount Paid:     $" + formatCurrency(total) + "\n";
  output += "Payment Method:  " + (payment || "Cash") + "\n";
  output += "Status:          PAID IN FULL\n";
  output += "\n";

  output += createDashedLine() + "\n";
  output += centerText("Thank you for your purchase!", width) + "\n";
  output += centerText("We appreciate your business.", width) + "\n";
  output += createDashedLine() + "\n\n";

  output += "RETURNS & EXCHANGES:\n";
  output += createSingleLine() + "\n";
  output += "Items may be returned within 30 days with this receipt.\n";
  output += "Items must be in original condition and packaging.\n";
  output += "Refunds will be issued to the original payment method.\n\n";

  output += "CUSTOMER SERVICE:\n";
  output += createSingleLine() + "\n";
  output += "Questions? Contact us at the phone number or email above.\n";
  output += "Our team is available Monday - Friday, 9 AM - 5 PM.\n\n";

  output += createSingleLine() + "\n";
  output += centerText("This receipt serves as proof of purchase.", width) + "\n";
  output += createSingleLine() + "\n";

  return output;
}

export function generateQuotation(
  business: string,
  client: string,
  items: string,
  valid: string
): string {
  const quoteNum = generateQuoteNumber();
  const today = formatDate(new Date());
  const validity = valid || "30 days";
  const parsedItems = parseItems(items);
  const width = 64;

  let output = "";
  output += createDoubleLine() + "\n";
  output += centerText("QUOTATION", width) + "\n";
  output += centerText(quoteNum, width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "FROM:\n";
  output += createSingleLine() + "\n";
  const businessLines = business.split("|");
  for (const line of businessLines) {
    output += line.trim() + "\n";
  }
  output += "\n";

  output += "SUBMITTED TO:\n";
  output += createSingleLine() + "\n";
  const clientLines = client.split("|");
  for (const line of clientLines) {
    output += line.trim() + "\n";
  }
  output += "\n";

  output += "QUOTE DETAILS:\n";
  output += createSingleLine() + "\n";
  output += padRight("Quote Number:", 20) + padLeft(quoteNum, width - 20) + "\n";
  output += padRight("Date:", 20) + padLeft(today, width - 20) + "\n";
  output += padRight("Valid Until:", 20) + padLeft(validity, width - 20) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += padRight("DESCRIPTION", 28);
  output += padRight("QTY", 8);
  output += padRight("RATE", 12);
  output += padLeft("AMOUNT", 16) + "\n";
  output += createDoubleLine() + "\n";

  let subtotal = 0;
  for (const item of parsedItems) {
    const amount = item.qty * item.rate;
    subtotal += amount;
    output += padRight(item.desc.substring(0, 28), 28);
    output += padRight(String(item.qty), 8);
    output += padRight(formatCurrency(item.rate), 12);
    output += padLeft("$" + formatCurrency(amount), 16) + "\n";
  }

  const taxRate = 0.1;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  output += createSingleLine() + "\n";
  output += padRight("", 40);
  output += padRight("Subtotal:", 12);
  output += padLeft("$" + formatCurrency(subtotal), 12) + "\n";
  output += padRight("", 40);
  output += padRight("Tax (10%):", 12);
  output += padLeft("$" + formatCurrency(taxAmount), 12) + "\n";
  output += createDoubleLine() + "\n";
  output += padRight("", 40);
  output += padRight("TOTAL:", 12);
  output += padLeft("$" + formatCurrency(total), 12) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "TERMS AND CONDITIONS:\n";
  output += createSingleLine() + "\n";
  output += "1. This quotation is valid for " + validity + " from the date above.\n";
  output += "2. Prices are subject to change after the validity period.\n";
  output += "3. A 50% deposit is required upon acceptance of this quote.\n";
  output += "4. Remaining balance is due upon completion of work.\n";
  output += "5. Any changes to the scope of work may affect pricing.\n";
  output += "6. All prices are in US Dollars and include applicable taxes.\n";
  output += "7. Delivery times are estimated and may vary.\n";
  output += "8. Warranty terms apply as per manufacturer specifications.\n\n";

  output += "ACCEPTANCE OF QUOTATION:\n";
  output += createSingleLine() + "\n";
  output += "By signing below, you accept this quotation and authorize\n";
  output += "the work to proceed as outlined above.\n\n";
  output += "Client Signature: ________________________________________\n";
  output += "Print Name:       ________________________________________\n";
  output += "Date:             ________________________________________\n\n";

  output += "ACCEPTED BY:\n";
  output += createSingleLine() + "\n";
  output += "Authorized Signature: __________________________________\n";
  output += "Print Name:            __________________________________\n";
  output += "Date:                  __________________________________\n\n";

  output += createSingleLine() + "\n";
  output += centerText("Thank you for considering our services!", width) + "\n";
  output += createSingleLine() + "\n";

  return output;
}

export function generatePurchaseOrder(
  business: string,
  vendor: string,
  items: string,
  delivery: string
): string {
  const poNum = generatePONumber();
  const today = formatDate(new Date());
  const deliveryDate = delivery || "To be determined";
  const parsedItems = parseItems(items);
  const width = 64;

  let output = "";
  output += createDoubleLine() + "\n";
  output += centerText("PURCHASE ORDER", width) + "\n";
  output += centerText(poNum, width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "FROM:\n";
  output += createSingleLine() + "\n";
  const businessLines = business.split("|");
  for (const line of businessLines) {
    output += line.trim() + "\n";
  }
  output += "\n";

  output += "VENDOR:\n";
  output += createSingleLine() + "\n";
  const vendorLines = vendor.split("|");
  for (const line of vendorLines) {
    output += line.trim() + "\n";
  }
  output += "\n";

  output += "PURCHASE ORDER DETAILS:\n";
  output += createSingleLine() + "\n";
  output += padRight("PO Number:", 20) + padLeft(poNum, width - 20) + "\n";
  output += padRight("Date:", 20) + padLeft(today, width - 20) + "\n";
  output += padRight("Expected Delivery:", 20) + padLeft(deliveryDate, width - 20) + "\n";
  output += "\n";

  output += "SHIPPING ADDRESS:\n";
  output += createSingleLine() + "\n";
  for (const line of businessLines) {
    output += "  " + line.trim() + "\n";
  }
  output += "\n";

  output += createDoubleLine() + "\n";
  output += padRight("DESCRIPTION", 26);
  output += padRight("QTY", 8);
  output += padRight("UNIT PRICE", 14);
  output += padLeft("AMOUNT", 16) + "\n";
  output += createDoubleLine() + "\n";

  let subtotal = 0;
  for (const item of parsedItems) {
    const amount = item.qty * item.rate;
    subtotal += amount;
    output += padRight(item.desc.substring(0, 26), 26);
    output += padRight(String(item.qty), 8);
    output += padRight(formatCurrency(item.rate), 14);
    output += padLeft("$" + formatCurrency(amount), 16) + "\n";
  }

  const taxRate = 0.1;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  output += createSingleLine() + "\n";
  output += padRight("", 40);
  output += padRight("Subtotal:", 12);
  output += padLeft("$" + formatCurrency(subtotal), 12) + "\n";
  output += padRight("", 40);
  output += padRight("Tax (10%):", 12);
  output += padLeft("$" + formatCurrency(taxAmount), 12) + "\n";
  output += createDoubleLine() + "\n";
  output += padRight("", 40);
  output += padRight("TOTAL:", 12);
  output += padLeft("$" + formatCurrency(total), 12) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "TERMS AND CONDITIONS:\n";
  output += createSingleLine() + "\n";
  output += "1. All items must be delivered by the expected delivery date.\n";
  output += "2. Payment terms: Net 30 days from receipt of invoice.\n";
  output += "3. Items must match the specifications described above.\n";
  output += "4. Any defects or shortages must be reported within 7 days.\n";
  output += "5. Vendor is responsible for shipping costs unless otherwise noted.\n";
  output += "6. This PO cannot be cancelled without written consent.\n";
  output += "7. A packing slip must accompany all shipments.\n";
  output += "8. Late delivery may result in order cancellation.\n";
  output += "9. Vendor must provide tracking information for all shipments.\n";
  output += "10. Returns accepted only with prior authorization.\n\n";

  output += "DELIVERY INSTRUCTIONS:\n";
  output += createSingleLine() + "\n";
  output += "  - Deliver during business hours (9 AM - 5 PM)\n";
  output += "  - Contact receiving department upon arrival\n";
  output += "  - All items must be clearly labeled with PO number\n";
  output += "  - Signature required upon delivery\n";
  output += "  - Provide delivery manifest in advance\n";
  output += "  - Report any delays immediately\n\n";

  output += "QUALITY REQUIREMENTS:\n";
  output += createSingleLine() + "\n";
  output += "  - All items must meet specified quality standards\n";
  output += "  - Defective items will be returned at vendor expense\n";
  output += "  - Vendor must provide quality certifications if required\n";
  output += "  - Random quality inspections may be conducted\n\n";

  output += "AUTHORIZED BY:\n";
  output += createSingleLine() + "\n";
  output += "Signature: ____________________________________________\n";
  output += "Print Name: ____________________________________________\n";
  output += "Title:       ____________________________________________\n";
  output += "Date:        ____________________________________________\n\n";

  output += "VENDOR ACKNOWLEDGMENT:\n";
  output += createSingleLine() + "\n";
  output += "By signing below, the vendor agrees to fulfill this order\n";
  output += "as specified above.\n\n";
  output += "Signature: ____________________________________________\n";
  output += "Print Name: ____________________________________________\n";
  output += "Date:        ____________________________________________\n\n";

  output += createSingleLine() + "\n";
  output += centerText("Purchase Order " + poNum, width) + "\n";
  output += createSingleLine() + "\n";

  return output;
}

export function generateProposal(
  business: string,
  client: string,
  project: string,
  budget: string
): string {
  const proposalNum = generateProposalNumber();
  const today = formatDate(new Date());
  const width = 64;

  let output = "";
  output += createDoubleLine() + "\n";
  output += centerText("BUSINESS PROPOSAL", width) + "\n";
  output += centerText(proposalNum, width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "PREPARED BY:\n";
  output += createSingleLine() + "\n";
  const businessLines = business.split("|");
  for (const line of businessLines) {
    output += line.trim() + "\n";
  }
  output += "\n";

  output += "PREPARED FOR:\n";
  output += createSingleLine() + "\n";
  const clientLines = client.split("|");
  for (const line of clientLines) {
    output += line.trim() + "\n";
  }
  output += "\n";

  output += "PROPOSAL DETAILS:\n";
  output += createSingleLine() + "\n";
  output += padRight("Proposal Number:", 22) + padLeft(proposalNum, width - 22) + "\n";
  output += padRight("Date:", 22) + padLeft(today, width - 22) + "\n";
  output += padRight("Project:", 22) + padLeft(project, width - 22) + "\n";
  output += padRight("Budget Range:", 22) + padLeft(budget, width - 22) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("1. EXECUTIVE SUMMARY", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "We are pleased to present this proposal for " + project + ".\n";
  output += "Our team has extensive experience in delivering high-quality\n";
  output += "solutions that drive business growth and operational efficiency.\n";
  output += "We are confident that our approach will exceed your expectations\n";
  output += "and deliver measurable results within the proposed timeline.\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("2. UNDERSTANDING OF CLIENT NEEDS", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "Based on our initial discussions and analysis, we understand that\n";
  output += "your organization requires a comprehensive solution for:\n\n";
  output += "  - Streamlining current operational processes\n";
  output += "  - Improving overall efficiency and productivity\n";
  output += "  - Reducing costs while maintaining quality standards\n";
  output += "  - Ensuring scalability for future growth\n";
  output += "  - Meeting compliance and regulatory requirements\n\n";
  output += "Our team has identified the following key challenges that\n";
  output += "your organization currently faces:\n\n";
  output += "  1. Fragmented workflows across departments\n";
  output += "  2. Manual processes consuming valuable resources\n";
  output += "  3. Limited visibility into operational performance\n";
  output += "  4. Difficulty scaling to meet seasonal demands\n";
  output += "  5. Compliance requirements creating bottlenecks\n\n";
  output += "We have extensive experience addressing these challenges\n";
  output += "and have helped similar organizations achieve measurable\n";
  output += "improvements in efficiency and profitability.\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("3. PROPOSED SOLUTION", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "Our proposed solution encompasses the following key components:\n\n";
  output += "  Phase 1: Discovery and Planning (Weeks 1-2)\n";
  output += "    - Requirements gathering and analysis\n";
  output += "    - Stakeholder interviews and workshops\n";
  output += "    - Project plan development\n";
  output += "    - Resource allocation and scheduling\n";
  output += "    - Risk assessment and mitigation planning\n";
  output += "    - Communication plan establishment\n\n";
  output += "  Phase 2: Design and Architecture (Weeks 3-4)\n";
  output += "    - Solution architecture design\n";
  output += "    - User experience (UX) planning\n";
  output += "    - Technical specifications documentation\n";
  output += "    - Prototype development\n";
  output += "    - Security architecture review\n";
  output += "    - Performance benchmarking strategy\n\n";
  output += "  Phase 3: Development and Implementation (Weeks 5-10)\n";
  output += "    - Iterative development cycles\n";
  output += "    - Regular progress reviews\n";
  output += "    - Quality assurance and testing\n";
  output += "    - Integration with existing systems\n";
  output += "    - Code reviews and security audits\n";
  output += "    - Performance optimization\n\n";
  output += "  Phase 4: Deployment and Launch (Weeks 11-12)\n";
  output += "    - Production deployment\n";
  output += "    - User training and documentation\n";
  output += "    - Performance monitoring\n";
  output += "    - Post-launch support\n";
  output += "    - Knowledge transfer sessions\n";
  output += "    - Documentation finalization\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("4. TIMELINE AND MILESTONES", width) + "\n";
  output += createDoubleLine() + "\n";
  output += padRight("Milestone", 36) + padLeft("Target Date", 28) + "\n";
  output += createSingleLine() + "\n";
  output += padRight("Project Kickoff", 36) + padLeft("Week 1", 28) + "\n";
  output += padRight("Requirements Complete", 36) + padLeft("Week 2", 28) + "\n";
  output += padRight("Design Approval", 36) + padLeft("Week 4", 28) + "\n";
  output += padRight("Development Complete", 36) + padLeft("Week 10", 28) + "\n";
  output += padRight("User Acceptance Testing", 36) + padLeft("Week 11", 28) + "\n";
  output += padRight("Production Launch", 36) + padLeft("Week 12", 28) + "\n";
  output += padRight("Project Closure", 36) + padLeft("Week 13", 28) + "\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("5. TEAM QUALIFICATIONS", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "Our team brings together industry-leading expertise:\n\n";
  output += "  Project Manager\n";
  output += "    - 10+ years of project management experience\n";
  output += "    - PMP and Agile certifications\n";
  output += "    - Track record of on-time, on-budget delivery\n";
  output += "    - Expertise in cross-functional team leadership\n\n";
  output += "  Technical Lead\n";
  output += "    - 12+ years of technical architecture experience\n";
  output += "    - Expertise in enterprise-scale solutions\n";
  output += "    - Certified in relevant technologies\n";
  output += "    - Published author and industry speaker\n\n";
  output += "  Development Team\n";
  output += "    - 8+ senior developers\n";
  output += "    - Specialized in full-stack development\n";
  output += "    - Extensive experience in similar projects\n";
  output += "    - Continuous learning and certification program\n\n";
  output += "  Quality Assurance Lead\n";
  output += "    - 8+ years in QA automation and testing\n";
  output += "    - ISTQB certified\n";
  output += "    - Expertise in performance and security testing\n\n";
  output += "  Business Analyst\n";
  output += "    - 7+ years in requirements analysis\n";
  output += "    - CBAP certified\n";
  output += "    - Strong domain expertise\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("6. PRICING AND BUDGET", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "Total Investment: " + (budget || "To be determined") + "\n\n";
  output += "Payment Schedule:\n";
  output += "  - 25% upon contract signing\n";
  output += "  - 25% at design approval\n";
  output += "  - 25% at development completion\n";
  output += "  - 25% upon project delivery and acceptance\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("7. WHY CHOOSE US", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "  - Proven track record with 500+ successful projects\n";
  output += "  - Industry-leading client satisfaction rating (98%)\n";
  output += "  - Transparent communication and reporting\n";
  output += "  - Flexible engagement models\n";
  output += "  - Post-project support and maintenance\n";
  output += "  - Competitive pricing with value-driven approach\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("8. NEXT STEPS", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "To proceed with this proposal:\n\n";
  output += "  1. Review and discuss this proposal with stakeholders\n";
  output += "  2. Schedule a follow-up meeting to address questions\n";
  output += "  3. Sign the agreement and submit initial payment\n";
  output += "  4. We will schedule the project kickoff meeting\n\n";

  output += "CONTACT INFORMATION:\n";
  output += createSingleLine() + "\n";
  output += "We welcome any questions or concerns. Please don't hesitate\n";
  output += "to contact us to discuss this proposal in detail.\n\n";

  output += createSingleLine() + "\n";
  output += centerText("Thank you for the opportunity to submit this proposal.", width) + "\n";
  output += centerText("We look forward to working with you!", width) + "\n";
  output += createSingleLine() + "\n";

  return output;
}

export function generateContract(
  business: string,
  client: string,
  service: string,
  terms: string
): string {
  const contractNum = generateContractNumber();
  const today = formatDate(new Date());
  const width = 64;

  let output = "";
  output += createDoubleLine() + "\n";
  output += centerText("SERVICE AGREEMENT", width) + "\n";
  output += centerText("Contract Number: " + contractNum, width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "This Service Agreement (\"Agreement\") is entered into as of\n";
  output += today + " (the \"Effective Date\") by and between:\n\n";

  output += "PARTY 1 (Service Provider):\n";
  output += createSingleLine() + "\n";
  const businessLines = business.split("|");
  for (const line of businessLines) {
    output += "  " + line.trim() + "\n";
  }
  output += "  Hereinafter referred to as \"Provider\"\n\n";

  output += "PARTY 2 (Client):\n";
  output += createSingleLine() + "\n";
  const clientLines = client.split("|");
  for (const line of clientLines) {
    output += "  " + line.trim() + "\n";
  }
  output += "  Hereinafter referred to as \"Client\"\n\n";

  output += "RECITALS:\n";
  output += createSingleLine() + "\n";
  output += "WHEREAS, Provider has expertise in providing " + service + ";\n";
  output += "WHEREAS, Client desires to retain Provider to perform\n";
  output += "such services;\n";
  output += "NOW, THEREFORE, in consideration of the mutual covenants\n";
  output += "and agreements herein contained, the parties agree as follows:\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("1. SCOPE OF WORK", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "Provider agrees to perform the following services for Client:\n\n";
  const serviceLines = wrapText(service, width - 2);
  for (const line of serviceLines) {
    output += "  " + line + "\n";
  }
  output += "\n";
  output += "The scope of work may be modified by mutual written agreement\n";
  output += "of both parties. Any changes to the scope may result in\n";
  output += "adjustments to the fees and timeline.\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("2. TERM AND TERMINATION", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "This Agreement shall commence on the Effective Date and\n";
  output += "shall continue until the services are completed or terminated\n";
  output += "as provided herein.\n\n";
  output += "Either party may terminate this Agreement:\n";
  output += "  a) Upon thirty (30) days written notice to the other party\n";
  output += "  b) Immediately upon material breach by the other party\n";
  output += "  c) Upon bankruptcy or insolvency of either party\n";
  output += "  d) By mutual written agreement of both parties\n\n";
  output += "Upon termination, Client shall pay Provider for all services\n";
  output += "performed up to the date of termination. Provider shall\n";
  output += "deliver all work product to Client upon termination.\n\n";
  output += "The following provisions shall survive termination:\n";
  output += "  - Confidentiality obligations\n";
  output += "  - Intellectual property rights\n";
  output += "  - Limitation of liability\n";
  output += "  - Dispute resolution provisions\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("3. COMPENSATION AND PAYMENT", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "Client agrees to compensate Provider as follows:\n\n";
  if (terms) {
    const termsLines = terms.split("|");
    for (const line of termsLines) {
      output += "  " + line.trim() + "\n";
    }
  } else {
    output += "  Payment terms to be agreed upon separately.\n";
  }
  output += "\n";
  output += "Late payments shall accrue interest at the rate of 1.5%\n";
  output += "per month. Provider reserves the right to suspend work\n";
  output += "if payment is more than fifteen (15) days overdue.\n\n";
  output += "In the event of a dispute regarding invoices, Client shall\n";
  output += "notify Provider in writing within fifteen (15) days of\n";
  output += "receiving the invoice. Undisputed portions shall be paid\n";
  output += "on schedule while disputed amounts are being resolved.\n\n";
  output += "All fees are exclusive of applicable taxes. Client shall be\n";
  output += "responsible for any sales, use, or value-added taxes.\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("4. INTELLECTUAL PROPERTY", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "All intellectual property created in the performance of\n";
  output += "this Agreement shall be owned by Client upon full payment.\n";
  output += "Provider retains ownership of pre-existing intellectual\n";
  output += "property and grants Client a non-exclusive license to use\n";
  output += "such property as necessary for the intended purpose.\n\n";
  output += "Provider may use general knowledge, skills, and experience\n";
  output += "gained during the project for future engagements.\n\n";
  output += "The following shall be considered pre-existing intellectual\n";
  output += "property and remain the property of Provider:\n";
  output += "  - Existing software libraries and frameworks\n";
  output += "  - Development tools and utilities\n";
  output += "  - Methodologies and processes\n";
  output += "  - Training materials and documentation\n\n";
  output += "Any modifications to pre-existing intellectual property\n";
  output += "shall be jointly owned unless otherwise agreed in writing.\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("5. CONFIDENTIALITY", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "Each party agrees to maintain the confidentiality of all\n";
  output += "proprietary information received from the other party.\n";
  output += "This obligation shall survive termination of this Agreement\n";
  output += "for a period of two (2) years.\n\n";
  output += "Confidential information includes but is not limited to:\n";
  output += "  - Business strategies and plans\n";
  output += "  - Financial information\n";
  output += "  - Customer and vendor lists\n";
  output += "  - Technical specifications and processes\n";
  output += "  - Marketing strategies\n";
  output += "  - Product designs and specifications\n";
  output += "  - Pricing information\n";
  output += "  - Employee information\n\n";
  output += "The following are excluded from confidentiality obligations:\n";
  output += "  - Information publicly available\n";
  output += "  - Information independently developed\n";
  output += "  - Information received from third parties\n";
  output += "  - Information required by law to be disclosed\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("6. WARRANTIES AND REPRESENTATIONS", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "Provider warrants that:\n";
  output += "  a) Services will be performed in a professional manner\n";
  output += "  b) Work will comply with industry standards\n";
  output += "  c) Provider has the necessary skills and qualifications\n";
  output += "  d) Work will be free from material defects\n";
  output += "  e) Provider will comply with all applicable laws\n\n";
  output += "Client warrants that:\n";
  output += "  a) Information provided to Provider is accurate\n";
  output += "  b) Client has authority to enter into this Agreement\n";
  output += "  c) Client will provide timely feedback and approvals\n";
  output += "  d) Client will maintain necessary infrastructure\n";
  output += "  e) Client will designate authorized representatives\n\n";
  output += "THE WARRANTIES ABOVE ARE THE ONLY WARRANTIES PROVIDED.\n";
  output += "ALL OTHER WARRANTIES, EXPRESS OR IMPLIED, ARE EXCLUDED.\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("7. LIMITATION OF LIABILITY", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "In no event shall either party be liable for indirect,\n";
  output += "incidental, special, or consequential damages. The total\n";
  output += "liability of either party shall not exceed the total fees\n";
  output += "paid under this Agreement.\n\n";
  output += "The following types of damages are specifically excluded:\n";
  output += "  - Loss of profits or revenue\n";
  output += "  - Loss of business opportunities\n";
  output += "  - Loss of data or information\n";
  output += "  - Business interruption\n";
  output += "  - Reputational harm\n\n";
  output += "Neither party shall be liable for delays or failures caused\n";
  output += "by circumstances beyond their reasonable control, including\n";
  output += "natural disasters, government actions, or force majeure.\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("8. DISPUTE RESOLUTION", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "Any disputes arising under this Agreement shall first be\n";
  output += "resolved through good faith negotiation. If negotiation\n";
  output += "fails, disputes shall be submitted to mediation before\n";
  output += "pursuing arbitration or litigation.\n\n";
  output += "The dispute resolution process shall follow these steps:\n\n";
  output += "  Step 1: Good Faith Negotiation (30 days)\n";
  output += "    - Parties attempt to resolve through direct communication\n";
  output += "    - Written notice of dispute required\n\n";
  output += "  Step 2: Mediation (60 days)\n";
  output += "    - Neutral mediator selected by mutual agreement\n";
  output += "    - Mediation costs shared equally\n\n";
  output += "  Step 3: Binding Arbitration\n";
  output += "    - Final and binding arbitration under AAA rules\n";
  output += "    - Arbitration conducted in agreed jurisdiction\n";
  output += "    - Decision enforceable in any court of competent jurisdiction\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("9. GENERAL PROVISIONS", width) + "\n";
  output += createDoubleLine() + "\n";
  output += "  - This Agreement constitutes the entire agreement\n";
  output += "  - Modifications must be in writing and signed by both parties\n";
  output += "  - Neither party may assign without written consent\n";
  output += "  - Failure to enforce any provision does not waive rights\n";
  output += "  - If any provision is invalid, remaining provisions remain\n";
  output += "  - Governing law: State of Delaware, United States\n";
  output += "  - Headings are for convenience only\n";
  output += "  - Counterparts may be executed separately\n";
  output += "  - Electronic signatures are binding\n\n";
  output += "Notices under this Agreement shall be in writing and sent\n";
  output += "to the addresses specified above. Notices sent by email\n";
  output += "shall be deemed received when sent, provided confirmation\n";
  output += "of receipt is obtained.\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("SIGNATURES", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "IN WITNESS WHEREOF, the parties have executed this Agreement\n";
  output += "as of the date first written above.\n\n";

  output += "PROVIDER:\n";
  output += createSingleLine() + "\n";
  output += "Signature: ____________________________________________\n";
  output += "Print Name: ____________________________________________\n";
  output += "Title:       ____________________________________________\n";
  output += "Date:        ____________________________________________\n\n";

  output += "CLIENT:\n";
  output += createSingleLine() + "\n";
  output += "Signature: ____________________________________________\n";
  output += "Print Name: ____________________________________________\n";
  output += "Title:       ____________________________________________\n";
  output += "Date:        ____________________________________________\n\n";

  output += createSingleLine() + "\n";
  output += centerText("Contract " + contractNum, width) + "\n";
  output += centerText("Effective Date: " + today, width) + "\n";
  output += createSingleLine() + "\n";

  return output;
}

export function calculateProfitMargin(
  sellingPrice: string,
  cost: string
): string {
  const price = parseFloat(sellingPrice);
  const costNum = parseFloat(cost);

  if (isNaN(price) || isNaN(costNum)) {
    return "Error: Please provide valid numeric values for selling price and cost.";
  }

  if (costNum === 0) {
    return "Error: Cost cannot be zero.";
  }

  const profit = price - costNum;
  const profitMargin = (profit / price) * 100;
  const markup = (profit / costNum) * 100;
  const breakEvenUnits = Math.ceil(costNum / price);
  const contributionMargin = price - costNum;
  const contributionMarginRatio = (contributionMargin / price) * 100;

  const recommendedMarkup25 = costNum * 1.25;
  const recommendedMarkup50 = costNum * 1.5;
  const recommendedMarkup100 = costNum * 2;
  const recommendedMarkup200 = costNum * 3;

  const margin20 = price / 0.8;
  const margin30 = price / 0.7;
  const margin40 = price / 0.6;
  const margin50 = price / 0.5;

  const width = 64;
  let output = "";
  output += createDoubleLine() + "\n";
  output += centerText("PROFIT MARGIN ANALYSIS", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "INPUT VALUES:\n";
  output += createSingleLine() + "\n";
  output += padRight("Selling Price:", 24) + padLeft("$" + formatCurrency(price), width - 24) + "\n";
  output += padRight("Cost:", 24) + padLeft("$" + formatCurrency(costNum), width - 24) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("CORE METRICS", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += padRight("Profit Amount:", 28) + padLeft("$" + formatCurrency(profit), width - 28) + "\n";
  output += padRight("Profit Margin:", 28) + padLeft(formatCurrency(profitMargin) + "%", width - 28) + "\n";
  output += padRight("Markup Percentage:", 28) + padLeft(formatCurrency(markup) + "%", width - 28) + "\n";
  output += padRight("Contribution Margin:", 28) + padLeft("$" + formatCurrency(contributionMargin), width - 28) + "\n";
  output += padRight("Contribution Margin Ratio:", 28) + padLeft(formatCurrency(contributionMarginRatio) + "%", width - 28) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("BREAK-EVEN ANALYSIS", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "At current pricing, you need to sell " + breakEvenUnits + " units\n";
  output += "to recover your costs. Each unit sold beyond this point\n";
  output += "generates $" + formatCurrency(profit) + " in pure profit.\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("PRICING RECOMMENDATIONS", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "Recommended Selling Prices by Markup:\n";
  output += createSingleLine() + "\n";
  output += padRight("25% Markup:", 24) + padLeft("$" + formatCurrency(recommendedMarkup25), width - 24) + "\n";
  output += padRight("50% Markup:", 24) + padLeft("$" + formatCurrency(recommendedMarkup50), width - 24) + "\n";
  output += padRight("100% Markup:", 24) + padLeft("$" + formatCurrency(recommendedMarkup100), width - 24) + "\n";
  output += padRight("200% Markup:", 24) + padLeft("$" + formatCurrency(recommendedMarkup200), width - 24) + "\n";
  output += "\n";

  output += "Prices to Achieve Target Margins:\n";
  output += createSingleLine() + "\n";
  output += padRight("20% Margin:", 24) + padLeft("$" + formatCurrency(margin20), width - 24) + "\n";
  output += padRight("30% Margin:", 24) + padLeft("$" + formatCurrency(margin30), width - 24) + "\n";
  output += padRight("40% Margin:", 24) + padLeft("$" + formatCurrency(margin40), width - 24) + "\n";
  output += padRight("50% Margin:", 24) + padLeft("$" + formatCurrency(margin50), width - 24) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("INDUSTRY BENCHMARKS", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "Typical profit margins by industry:\n";
  output += createSingleLine() + "\n";
  output += padRight("Retail:", 20) + padLeft("5-10%", width - 20) + "\n";
  output += padRight("Manufacturing:", 20) + padLeft("25-35%", width - 20) + "\n";
  output += padRight("Professional Services:", 20) + padLeft("30-50%", width - 20) + "\n";
  output += padRight("Software/SaaS:", 20) + padLeft("60-80%", width - 20) + "\n";
  output += padRight("Food & Beverage:", 20) + padLeft("3-9%", width - 20) + "\n";
  output += "\n";

  if (profitMargin < 10) {
    output += "RECOMMENDATION: Your margin is below typical industry standards.\n";
    output += "Consider increasing your selling price or reducing costs.\n";
  } else if (profitMargin < 30) {
    output += "RECOMMENDATION: Your margin is within acceptable range.\n";
    output += "Consider optimizing operations to improve profitability.\n";
  } else {
    output += "RECOMMENDATION: Your margin is strong. Maintain your pricing\n";
    output += "strategy while monitoring market conditions.\n";
  }
  output += "\n";

  output += createSingleLine() + "\n";
  output += centerText("End of Profit Margin Analysis", width) + "\n";
  output += createSingleLine() + "\n";

  return output;
}

export function calculateGSTVAT(
  amount: string,
  rate: string,
  taxType: string,
  mode: string
): string {
  const amountNum = parseFloat(amount);
  const rateNum = parseFloat(rate);

  if (isNaN(amountNum) || isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
    return "Error: Please provide valid numeric values. Amount must be positive, rate must be between 0-100%.";
  }

  const isInclusive = mode === "inclusive";
  const taxLabel = taxType || "GST";
  const multiplier = 1 + rateNum / 100;

  let baseAmount: number;
  let taxAmount: number;
  let totalAmount: number;

  if (isInclusive) {
    totalAmount = amountNum;
    baseAmount = totalAmount / multiplier;
    taxAmount = totalAmount - baseAmount;
  } else {
    baseAmount = amountNum;
    taxAmount = baseAmount * (rateNum / 100);
    totalAmount = baseAmount + taxAmount;
  }

  const width = 64;
  let output = "";
  output += createDoubleLine() + "\n";
  output += centerText(taxLabel + " CALCULATION", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "INPUT VALUES:\n";
  output += createSingleLine() + "\n";
  output += padRight("Input Amount:", 24) + padLeft("$" + formatCurrency(amountNum), width - 24) + "\n";
  output += padRight("Tax Rate:", 24) + padLeft(formatCurrency(rateNum) + "%", width - 24) + "\n";
  output += padRight("Tax Type:", 24) + padLeft(taxLabel, width - 24) + "\n";
  output += padRight("Mode:", 24) + padLeft(isInclusive ? "Tax Inclusive (extract)" : "Tax Exclusive (add)", width - 24) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("RESULT", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += padRight("Base Amount (excl. tax):", 24) + padLeft("$" + formatCurrency(baseAmount), width - 24) + "\n";
  output += padRight(taxLabel + " (" + formatCurrency(rateNum) + "%):", 24) + padLeft("$" + formatCurrency(taxAmount), width - 24) + "\n";
  output += createSingleLine() + "\n";
  output += padRight("Total Amount (incl. tax):", 24) + padLeft("$" + formatCurrency(totalAmount), width - 24) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("BOTH CALCULATION MODES", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "Mode 1 - Add Tax (Exclusive):\n";
  output += "  Start with base amount, add " + formatCurrency(rateNum) + "% " + taxLabel + "\n";
  const exclTax = baseAmount * (rateNum / 100);
  const exclTotal = baseAmount + exclTax;
  output += "  $" + formatCurrency(baseAmount) + " + $" + formatCurrency(exclTax) + " = $" + formatCurrency(exclTotal) + "\n\n";

  output += "Mode 2 - Extract Tax (Inclusive):\n";
  output += "  Start with tax-inclusive amount, extract " + formatCurrency(rateNum) + "% " + taxLabel + "\n";
  const inclBase = totalAmount / multiplier;
  const inclTax = totalAmount - inclBase;
  output += "  $" + formatCurrency(totalAmount) + " → Base: $" + formatCurrency(inclBase) + ", Tax: $" + formatCurrency(inclTax) + "\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("QUICK REFERENCE TABLE", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += padRight("Rate", 10) + padRight("Tax on $" + formatCurrency(baseAmount), 22) + padLeft("Total", 22) + "\n";
  output += createSingleLine() + "\n";

  const refRates = [5, 10, 15, 18, 20, 25, 30];
  for (const refRate of refRates) {
    const refTax = baseAmount * (refRate / 100);
    const refTotal = baseAmount + refTax;
    output += padRight(refRate + "%", 10);
    output += padRight("$" + formatCurrency(refTax), 22);
    output += padLeft("$" + formatCurrency(refTotal), 22) + "\n";
  }
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("FORMULAS", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "Forward (Add Tax):\n";
  output += "  Tax = Base × (" + formatCurrency(rateNum) + " / 100)\n";
  output += "  Total = Base + Tax\n";
  output += "  Total = Base × " + formatCurrency(multiplier) + "\n\n";

  output += "Reverse (Extract Tax):\n";
  output += "  Base = Total / " + formatCurrency(multiplier) + "\n";
  output += "  Tax = Total - Base\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("INTERNATIONAL " + taxLabel + " RATES", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "Common " + taxLabel + " rates by country:\n";
  output += createSingleLine() + "\n";
  output += padRight("Country", 24) + padRight("Rate", 12) + padRight("Tax", 14) + padLeft("Total", 14) + "\n";
  output += createSingleLine() + "\n";
  const countries = [
    { name: "United States", rate: 7.25 },
    { name: "United Kingdom", rate: 20 },
    { name: "Germany", rate: 19 },
    { name: "Australia", rate: 10 },
    { name: "Canada", rate: 5 },
    { name: "India", rate: 18 },
    { name: "Japan", rate: 10 },
    { name: "Singapore", rate: 7 },
    { name: "UAE", rate: 5 },
    { name: "South Africa", rate: 15 },
  ];
  for (const country of countries) {
    const cTax = baseAmount * (country.rate / 100);
    const cTotal = baseAmount + cTax;
    output += padRight(country.name, 24);
    output += padRight(formatCurrency(country.rate) + "%", 12);
    output += padRight("$" + formatCurrency(cTax), 14);
    output += padLeft("$" + formatCurrency(cTotal), 14) + "\n";
  }
  output += "\n";

  output += createSingleLine() + "\n";
  output += centerText("End of " + taxLabel + " Calculation", width) + "\n";
  output += createSingleLine() + "\n";

  return output;
}

export function calculateSalary(
  base: string,
  deductions: string,
  benefits: string
): string {
  const baseNum = parseFloat(base);
  const deductionsNum = parseFloat(deductions);
  const benefitsNum = parseFloat(benefits);

  if (isNaN(baseNum)) {
    return "Error: Please provide a valid base salary amount.";
  }

  const deductionsAmount = isNaN(deductionsNum) ? 0 : deductionsNum;
  const benefitsAmount = isNaN(benefitsNum) ? 0 : benefitsNum;

  const grossSalary = baseNum;
  const totalDeductions = deductionsAmount;
  const netSalary = grossSalary - totalDeductions;
  const totalCompensation = grossSalary + benefitsAmount;
  const annualGross = grossSalary * 12;
  const annualNet = netSalary * 12;
  const annualBenefits = benefitsAmount * 12;
  const annualTotal = totalCompensation * 12;
  const biweeklyGross = annualGross / 26;
  const weeklyGross = annualGross / 52;
  const hourlyGross = annualGross / 2080;
  const dailyGross = annualGross / 260;
  const effectiveTaxRate = grossSalary > 0 ? (totalDeductions / grossSalary) * 100 : 0;

  const width = 64;
  let output = "";
  output += createDoubleLine() + "\n";
  output += centerText("SALARY CALCULATION REPORT", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "COMPENSATION SUMMARY:\n";
  output += createSingleLine() + "\n";
  output += padRight("Gross Monthly Salary:", 28) + padLeft("$" + formatCurrency(grossSalary), width - 28) + "\n";
  output += padRight("Total Deductions:", 28) + padLeft("$" + formatCurrency(totalDeductions), width - 28) + "\n";
  output += padRight("Net Monthly Salary:", 28) + padLeft("$" + formatCurrency(netSalary), width - 28) + "\n";
  output += padRight("Monthly Benefits:", 28) + padLeft("$" + formatCurrency(benefitsAmount), width - 28) + "\n";
  output += padRight("Total Monthly Compensation:", 28) + padLeft("$" + formatCurrency(totalCompensation), width - 28) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("ANNUAL PROJECTIONS", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += padRight("Annual Gross Salary:", 28) + padLeft("$" + formatCurrency(annualGross), width - 28) + "\n";
  output += padRight("Annual Deductions:", 28) + padLeft("$" + formatCurrency(totalDeductions * 12), width - 28) + "\n";
  output += padRight("Annual Net Salary:", 28) + padLeft("$" + formatCurrency(annualNet), width - 28) + "\n";
  output += padRight("Annual Benefits:", 28) + padLeft("$" + formatCurrency(annualBenefits), width - 28) + "\n";
  output += padRight("Annual Total Compensation:", 28) + padLeft("$" + formatCurrency(annualTotal), width - 28) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("PAY PERIOD BREAKDOWN", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += padRight("Pay Period", 24) + padRight("Gross", 16) + padRight("Deductions", 12) + padLeft("Net", 12) + "\n";
  output += createSingleLine() + "\n";
  output += padRight("Annual:", 24);
  output += padRight("$" + formatCurrency(annualGross), 16);
  output += padRight("$" + formatCurrency(totalDeductions * 12), 12);
  output += padLeft("$" + formatCurrency(annualNet), 12) + "\n";
  output += padRight("Monthly:", 24);
  output += padRight("$" + formatCurrency(grossSalary), 16);
  output += padRight("$" + formatCurrency(totalDeductions), 12);
  output += padLeft("$" + formatCurrency(netSalary), 12) + "\n";
  output += padRight("Bi-Weekly:", 24);
  output += padRight("$" + formatCurrency(biweeklyGross), 16);
  output += padRight("$" + formatCurrency(totalDeductions / 2), 12);
  output += padLeft("$" + formatCurrency(netSalary / 2), 12) + "\n";
  output += padRight("Weekly:", 24);
  output += padRight("$" + formatCurrency(weeklyGross), 16);
  output += padRight("$" + formatCurrency(totalDeductions / 4), 12);
  output += padLeft("$" + formatCurrency(netSalary / 4), 12) + "\n";
  output += padRight("Daily (260 days):", 24);
  output += padRight("$" + formatCurrency(dailyGross), 16);
  output += padRight("$" + formatCurrency(totalDeductions / 260), 12);
  output += padLeft("$" + formatCurrency(netSalary / 260), 12) + "\n";
  output += padRight("Hourly (2080 hrs):", 24);
  output += padRight("$" + formatCurrency(hourlyGross), 16);
  output += padRight("$" + formatCurrency(totalDeductions / 2080), 12);
  output += padLeft("$" + formatCurrency(netSalary / 2080), 12) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("DEDUCTIONS BREAKDOWN", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "Total Monthly Deductions: $" + formatCurrency(totalDeductions) + "\n\n";
  output += "Common deduction categories:\n";
  output += createSingleLine() + "\n";
  output += padRight("Federal Income Tax:", 24) + padLeft("~22% (varies by bracket)", width - 24) + "\n";
  output += padRight("State Income Tax:", 24) + padLeft("~5% (varies by state)", width - 24) + "\n";
  output += padRight("Social Security (FICA):", 24) + padLeft("6.2%", width - 24) + "\n";
  output += padRight("Medicare:", 24) + padLeft("1.45%", width - 24) + "\n";
  output += padRight("Health Insurance:", 24) + padLeft("$200-500 (varies)", width - 24) + "\n";
  output += padRight("401(k) Contribution:", 24) + padLeft("Up to 6%", width - 24) + "\n";
  output += padRight("Dental Insurance:", 24) + padLeft("$25-50", width - 24) + "\n";
  output += padRight("Vision Insurance:", 24) + padLeft("$10-25", width - 24) + "\n";
  output += padRight("Disability Insurance:", 24) + padLeft("$25-75", width - 24) + "\n";
  output += padRight("Union Dues:", 24) + padLeft("Varies", width - 24) + "\n";
  output += "\n";

  output += "Effective Deduction Rate: " + formatCurrency(effectiveTaxRate) + "%\n\n";

  output += "Estimated Tax Bracket Analysis:\n";
  output += createSingleLine() + "\n";
  const annualGrossForTax = annualGross;
  let estimatedFederalTax = 0;
  if (annualGrossForTax > 0) estimatedFederalTax += Math.min(annualGrossForTax, 11000) * 0.1;
  if (annualGrossForTax > 11000) estimatedFederalTax += Math.min(annualGrossForTax - 11000, 33725) * 0.12;
  if (annualGrossForTax > 44725) estimatedFederalTax += Math.min(annualGrossForTax - 44725, 52375) * 0.22;
  if (annualGrossForTax > 97100) estimatedFederalTax += Math.min(annualGrossForTax - 97100, 48075) * 0.24;
  if (annualGrossForTax > 145175) estimatedFederalTax += Math.min(annualGrossForTax - 145175, 35400) * 0.32;
  const monthlyFederalEst = estimatedFederalTax / 12;
  output += "Estimated Monthly Federal Tax: $" + formatCurrency(monthlyFederalEst) + "\n";
  output += "Estimated Annual Federal Tax: $" + formatCurrency(estimatedFederalTax) + "\n";
  output += "Marginal Tax Rate: 22% (based on " + formatCurrency(annualGrossForTax) + " annual)\n\n";

  output += createDoubleLine() + "\n";
  output += centerText("BENEFITS BREAKDOWN", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "Total Monthly Benefits: $" + formatCurrency(benefitsAmount) + "\n\n";
  output += "Common benefit categories:\n";
  output += createSingleLine() + "\n";
  output += padRight("Health Insurance:", 24) + padLeft("$500-1000", width - 24) + "\n";
  output += padRight("Dental Insurance:", 24) + padLeft("$50-100", width - 24) + "\n";
  output += padRight("Vision Insurance:", 24) + padLeft("$20-50", width - 24) + "\n";
  output += padRight("Life Insurance:", 24) + padLeft("$50-100", width - 24) + "\n";
  output += padRight("401(k) Match:", 24) + padLeft("Varies", width - 24) + "\n";
  output += padRight("Stock Options:", 24) + padLeft("Varies", width - 24) + "\n";
  output += padRight("Paid Time Off:", 24) + padLeft("Valued portion", width - 24) + "\n";
  output += padRight("Sick Leave:", 24) + padLeft("Valued portion", width - 24) + "\n";
  output += padRight("Training/Education:", 24) + padLeft("$100-500", width - 24) + "\n";
  output += padRight("Wellness Programs:", 24) + padLeft("$50-200", width - 24) + "\n";
  output += "\n";

  output += "Benefits as Percentage of Total Compensation:\n";
  output += createSingleLine() + "\n";
  if (totalCompensation > 0) {
    const benefitsPercent = (benefitsAmount / totalCompensation) * 100;
    const salaryPercent = 100 - benefitsPercent;
    output += padRight("Salary Component:", 24) + padLeft(formatCurrency(salaryPercent) + "%", width - 24) + "\n";
    output += padRight("Benefits Component:", 24) + padLeft(formatCurrency(benefitsPercent) + "%", width - 24) + "\n";
  }
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("COST TO COMPANY", width) + "\n";
  output += createDoubleLine() + "\n\n";

  const costToCompany = grossSalary + benefitsAmount;
  const annualCost = costToCompany * 12;
  const hourlyCost = annualCost / 2080;

  output += "The total cost to your company per employee:\n\n";
  output += padRight("Monthly Cost to Company:", 28) + padLeft("$" + formatCurrency(costToCompany), width - 28) + "\n";
  output += padRight("Annual Cost to Company:", 28) + padLeft("$" + formatCurrency(annualCost), width - 28) + "\n";
  output += padRight("Hourly Cost to Company:", 28) + padLeft("$" + formatCurrency(hourlyCost), width - 28) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("EMPLOYER COST SUMMARY", width) + "\n";
  output += createDoubleLine() + "\n\n";

  const employerFICA = grossSalary * 0.0765;
  const federalUnemployment = Math.min(grossSalary * 12, 7000) * 0.006 / 12;
  const stateUnemployment = grossSalary * 0.027 / 12;
  const workersComp = grossSalary * 0.012;
  const totalEmployerCost = employerFICA + federalUnemployment + stateUnemployment + workersComp;

  output += "Additional employer-paid costs:\n";
  output += createSingleLine() + "\n";
  output += padRight("Employer FICA (7.65%):", 28) + padLeft("$" + formatCurrency(employerFICA), width - 28) + "\n";
  output += padRight("Federal Unemployment:", 28) + padLeft("$" + formatCurrency(federalUnemployment), width - 28) + "\n";
  output += padRight("State Unemployment:", 28) + padLeft("$" + formatCurrency(stateUnemployment), width - 28) + "\n";
  output += padRight("Workers Compensation:", 28) + padLeft("$" + formatCurrency(workersComp), width - 28) + "\n";
  output += createSingleLine() + "\n";
  output += padRight("Total Employer Costs:", 28) + padLeft("$" + formatCurrency(totalEmployerCost), width - 28) + "\n";
  output += padRight("Total Cost to Company:", 28) + padLeft("$" + formatCurrency(costToCompany + totalEmployerCost), width - 28) + "\n";
  output += "\n";

  output += createSingleLine() + "\n";
  output += centerText("End of Salary Calculation Report", width) + "\n";
  output += createSingleLine() + "\n";

  return output;
}

export function generateBusinessName(
  industry: string,
  keywords: string,
  style: string
): string {
  const industryLower = industry.toLowerCase();
  const keywordsList = keywords.split(",").map((k) => k.trim().toLowerCase());
  const styleLower = style.toLowerCase();

  const prefixes: Record<string, string[]> = {
    modern: ["Nova", "Apex", "Zen", "Pulse", "Core", "Flux", "Nex", "Vibe", "Sync", "Edge"],
    classic: ["Royal", "Prime", "Elite", "Grand", "Noble", "Sterling", "Heritage", "Legacy", "Traditional", "Classic"],
    creative: ["Spark", "Dream", "Wonder", "Imagine", "Create", "Inspire", "Vision", "Magic", "Art", "Bold"],
  };

  const suffixes: Record<string, string[]> = {
    modern: ["Labs", "Hub", "Works", "Studio", "Collective", "Space", "Zone", "Tech", "Digital", "Solutions"],
    classic: ["Co", "Group", "Enterprises", "Associates", "Partners", "Firm", "House", "Trading", "Ventures", "Intl"],
    creative: ["Studio", "Works", "Design", "Creative", "Mind", "Lab", "Canvas", "Craft", "Artistry", "Vision"],
  };

  const industryWords: Record<string, string[]> = {
    technology: ["Tech", "Digital", "Cyber", "Data", "Cloud", "Net", "Soft", "Bit", "Code", "Pixel"],
    food: ["Bistro", "Kitchen", "Cafe", "Dining", "Flavor", "Taste", "Fresh", "Harvest", "Table", "Feast"],
    fashion: ["Style", "Wear", "Thread", "Stitch", "Fabric", "Mode", "Couture", "Vogue", "Chic", "Glam"],
    health: ["Well", "Care", "Vital", "Life", "Heal", "Med", "Cure", "Fit", "Body", "Mind"],
    finance: ["Capital", "Fund", "Invest", "Wealth", "Asset", "Equity", "Trade", "Bond", "Trust", "Finance"],
    education: ["Learn", "Edu", "Academy", "School", "Study", "Class", "Mind", "Brain", "Scholar", "Teach"],
    default: ["Group", "Co", "Solutions", "Services", "Partners", "Works", "Labs", "Hub", "Studio", "Ventures"],
  };

  const actualStyle = prefixes[styleLower] ? styleLower : "modern";
  const prefixList = prefixes[actualStyle];
  const suffixList = suffixes[actualStyle];
  const industryList = industryWords[industryLower] || industryWords.default;

  const names: string[] = [];

  for (let i = 0; i < 5; i++) {
    const prefix = prefixList[i % prefixList.length];
    const suffix = suffixList[i % suffixList.length];
    names.push(prefix + " " + suffix);
  }

  for (let i = 0; i < 5; i++) {
    const prefix = prefixList[i % prefixList.length];
    const word = industryList[i % industryList.length];
    names.push(prefix + " " + word);
  }

  for (let i = 0; i < 5; i++) {
    const word = industryList[i % industryList.length];
    const suffix = suffixList[i % suffixList.length];
    names.push(word + " " + suffix);
  }

  for (let i = 0; i < 3; i++) {
    const prefix = prefixList[i % prefixList.length];
    const word = industryList[i % industryList.length];
    const suffix = suffixList[i % suffixList.length];
    names.push(prefix + word + suffix);
  }

  for (let i = 0; i < 2; i++) {
    const prefix = prefixList[i % prefixList.length];
    const word = industryList[i % industryList.length];
    names.push(prefix + word + ".io");
  }

  if (keywordsList.length > 0 && keywordsList[0]) {
    for (let i = 0; i < 3; i++) {
      const kw = keywordsList[i % keywordsList.length];
      const suffix = suffixList[i % suffixList.length];
      names.push(kw.charAt(0).toUpperCase() + kw.slice(1) + " " + suffix);
    }
  }

  const domainHints: string[] = [];
  for (const name of names) {
    const domain = name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
    domainHints.push(domain);
  }

  const taglines: string[] = [];
  const taglineTemplates = [
    "Innovation Redefined",
    "Excellence in Every Detail",
    "Your Vision, Our Mission",
    "Building Tomorrow Today",
    "Quality That Speaks",
    "Where Ideas Come Alive",
    "Driven by Results",
    "Committed to Success",
    "Leading the Way",
    "Empowering Your Future",
  ];
  for (const template of taglineTemplates) {
    taglines.push(template);
  }

  const width = 64;
  let output = "";
  output += createDoubleLine() + "\n";
  output += centerText("BUSINESS NAME GENERATOR", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "INPUT PARAMETERS:\n";
  output += createSingleLine() + "\n";
  output += padRight("Industry:", 20) + padLeft(industry, width - 20) + "\n";
  output += padRight("Keywords:", 20) + padLeft(keywords, width - 20) + "\n";
  output += padRight("Style:", 20) + padLeft(style, width - 20) + "\n";
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("GENERATED BUSINESS NAMES (" + names.length + " Options)", width) + "\n";
  output += createDoubleLine() + "\n\n";

  for (let i = 0; i < names.length; i++) {
    const num = String(i + 1).padStart(2, " ");
    output += padRight(num + ".", 5) + padRight(names[i], 30);
    output += padRight("[Domain: " + domainHints[i] + "]", width - 35) + "\n";
  }
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("STYLE VARIATIONS", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "Modern Style (Current Selection):\n";
  output += createSingleLine() + "\n";
  for (let i = 0; i < 5; i++) {
    output += "  " + prefixes.modern[i] + " " + suffixes.modern[i] + "\n";
  }
  output += "\n";

  output += "Classic Style:\n";
  output += createSingleLine() + "\n";
  for (let i = 0; i < 5; i++) {
    output += "  " + prefixes.classic[i] + " " + suffixes.classic[i] + "\n";
  }
  output += "\n";

  output += "Creative Style:\n";
  output += createSingleLine() + "\n";
  for (let i = 0; i < 5; i++) {
    output += "  " + prefixes.creative[i] + " " + suffixes.creative[i] + "\n";
  }
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("TAGLINE SUGGESTIONS", width) + "\n";
  output += createDoubleLine() + "\n\n";

  for (let i = 0; i < taglines.length; i++) {
    const num = String(i + 1).padStart(2, " ");
    output += num + ". " + taglines[i] + "\n";
  }
  output += "\n";

  output += createDoubleLine() + "\n";
  output += centerText("DOMAIN AVAILABILITY HINTS", width) + "\n";
  output += createDoubleLine() + "\n\n";

  output += "Note: Domain availability is not guaranteed.\n";
  output += "Check registrars for actual availability.\n\n";
  for (let i = 0; i < Math.min(10, domainHints.length); i++) {
    output += "  " + padRight(domainHints[i], 30) + "[Check availability]\n";
  }
  output += "\n";

  output += createSingleLine() + "\n";
  output += centerText("End of Business Name Generator", width) + "\n";
  output += createSingleLine() + "\n";

  return output;
}

export function processBusinessTool(
  toolId: string,
  options: Record<string, string>
): BusinessResult {
  let content = "";
  let filename = "";
  const mimeType = "text/plain";

  switch (toolId) {
    case "invoice-generator": {
      content = generateInvoice(
        options.business || "",
        options.client || "",
        options.items || "",
        options.due || ""
      );
      filename = "invoice.txt";
      break;
    }
    case "receipt-generator": {
      content = generateReceipt(
        options.business || "",
        options.customer || "",
        options.items || "",
        options.payment || ""
      );
      filename = "receipt.txt";
      break;
    }
    case "quotation-generator": {
      content = generateQuotation(
        options.business || "",
        options.client || "",
        options.items || "",
        options.valid || ""
      );
      filename = "quotation.txt";
      break;
    }
    case "purchase-order-generator": {
      content = generatePurchaseOrder(
        options.business || "",
        options.vendor || "",
        options.items || "",
        options.delivery || ""
      );
      filename = "purchase-order.txt";
      break;
    }
    case "business-proposal": {
      content = generateProposal(
        options.business || "",
        options.client || "",
        options.project || "",
        options.budget || ""
      );
      filename = "proposal.txt";
      break;
    }
    case "contract-generator": {
      content = generateContract(
        options.business || "",
        options.client || "",
        options.service || "",
        options.terms || ""
      );
      filename = "contract.txt";
      break;
    }
    case "profit-margin": {
      content = calculateProfitMargin(
        options.sellingPrice || "0",
        options.cost || "0"
      );
      filename = "profit-margin-analysis.txt";
      break;
    }
    case "gst-vat-calculator": {
      content = calculateGSTVAT(
        options.amount || "0",
        options.rate || "10",
        options.taxType || "GST",
        options.mode || "exclusive"
      );
      filename = "gst-vat-calculation.txt";
      break;
    }
    case "salary-calculator": {
      content = calculateSalary(
        options.base || "0",
        options.deductions || "0",
        options.benefits || "0"
      );
      filename = "salary-calculation.txt";
      break;
    }
    case "business-name-generator": {
      content = generateBusinessName(
        options.industry || "general",
        options.keywords || "",
        options.style || "modern"
      );
      filename = "business-names.txt";
      break;
    }
    case "qr-code-generator": {
      const text = options.text || "https://example.com";
      const size = 200;
      const cellSize = 4;
      const modules = Math.floor(size / cellSize);
      const svgModules = Math.min(modules, 25);
      const actualSize = svgModules * cellSize;
      let cells = "";
      for (let y = 0; y < svgModules; y++) {
        for (let x = 0; x < svgModules; x++) {
          const isFinder = (x < 7 && y < 7) || (x >= svgModules - 7 && y < 7) || (x < 7 && y >= svgModules - 7);
          const isBorder = isFinder && (x === 0 || x === 6 || y === 0 || y === 6 || x === svgModules - 7 || x === svgModules - 1 || y === svgModules - 7 || y === svgModules - 1);
          const isInner = isFinder && x >= 2 && x <= 4 && y >= 2 && y <= 4;
          const isInnerR = isFinder && x >= svgModules - 5 && x <= svgModules - 3 && y >= 2 && y <= 4;
          const isInnerB = isFinder && x >= 2 && x <= 4 && y >= svgModules - 5 && y <= svgModules - 3;
          const hash = ((x * 7 + y * 13 + text.length) % 3) === 0;
          if (isBorder || isInner || isInnerR || isInnerB || (x > 7 && y > 7 && x < svgModules - 7 && y < svgModules - 7 && hash)) {
            cells += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
          }
        }
      }
      content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${actualSize + 20} ${actualSize + 40}" width="${actualSize + 20}" height="${actualSize + 40}">
  <rect width="100%" height="100%" fill="white"/>
  <g transform="translate(10,10)">${cells}</g>
  <text x="${(actualSize + 20) / 2}" y="${actualSize + 30}" text-anchor="middle" font-family="monospace" font-size="8" fill="#333">${text.substring(0, 30)}${text.length > 30 ? "..." : ""}</text>
</svg>`;
      filename = "qr-code.svg";
      break;
    }
    default: {
      content = "Error: Unknown tool ID '" + toolId + "'";
      filename = "error.txt";
    }
  }

  return { content, filename, mimeType };
}

export function downloadBusiness(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}