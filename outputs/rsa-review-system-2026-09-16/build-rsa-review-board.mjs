import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/yong/Documents/siamrooftech/outputs/rsa-review-system-2026-09-16";
const font = "Arial";
const navy = "#123B5D";
const blue = "#008AD7";
const lightBlue = "#EAF6FC";
const border = "#CFD8E3";
const inputFill = "#FFF4CC";
const statuses = [
  "Proposed",
  "Needs Edit",
  "Rejected",
  "Accepted",
  "QA Approved",
  "API Validated",
  "Posted",
];

await fs.mkdir(outputDir, { recursive: true });
const workbook = Workbook.create();

function baseSheet(name, title, note, lastColumn) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  sheet.getRange(`A1:${lastColumn}120`).format.font = { name: font, size: 10, color: "#1F2937" };
  sheet.getRange("A2").values = [[title]];
  sheet.getRange("A2").format.font = { name: font, size: 15, bold: true, color: navy };
  sheet.getRange(`A3:${lastColumn}3`).format.borders = {
    bottom: { style: "thin", color: blue },
  };
  sheet.getRange("A4").values = [[note]];
  sheet.getRange("A4").format.font = { name: font, size: 9, italic: true, color: "#52606D" };
  sheet.getRange("A4").format.wrapText = false;
  sheet.freezePanes.freezeRows(5);
  return sheet;
}

function styleHeader(range) {
  range.format = {
    fill: navy,
    font: { name: font, size: 10, bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: "#FFFFFF" },
  };
  range.format.rowHeight = 30;
}

function styleBody(range) {
  range.format.verticalAlignment = "center";
  range.format.borders = {
    insideHorizontal: { style: "thin", color: border },
    bottom: { style: "thin", color: border },
  };
}

const queue = baseSheet(
  "Review Queue",
  "RSA Review Queue",
  "แก้เฉพาะช่องสีเหลือง แล้วใช้คำสั่ง Accept, Edit, Expand, Similar, Reject หรือ Approve for QA ใน Codex",
  "O",
);
const queueHeaders = [[
  "Proposal ID", "Batch ID", "Campaign", "Ad group", "Asset Type", "Text",
  "Character Count", "Angle", "Intent", "Evidence IDs", "Status", "Parent ID",
  "Version", "Action", "Feedback",
]];
queue.getRange("A5:O5").values = queueHeaders;
styleHeader(queue.getRange("A5:O5"));
styleBody(queue.getRange("A6:O105"));
queue.getRange("A6:F105").format.fill = inputFill;
queue.getRange("H6:O105").format.fill = inputFill;
queue.getRange("G6").formulasR1C1 = [["=LEN(RC[-1])"]];
queue.getRange("G6:G105").fillDown();
queue.getRange("G6:G105").format.numberFormat = "0";
queue.getRange("K6:K105").dataValidation = { rule: { type: "list", values: statuses } };
queue.getRange("E6:E105").dataValidation = { rule: { type: "list", values: ["headline", "description"] } };
queue.getRange("N6:N105").dataValidation = { rule: { type: "list", values: ["", "Accept", "Edit", "Expand", "Similar", "Reject", "Approve for QA"] } };
queue.getRange("K6:K105").conditionalFormats.add("containsText", { text: "Rejected", format: { fill: "#FDECEC", font: { color: "#B42318", bold: true } } });
queue.getRange("K6:K105").conditionalFormats.add("containsText", { text: "Accepted", format: { fill: "#EAF7EF", font: { color: "#1A6B3C", bold: true } } });
queue.getRange("K6:K105").conditionalFormats.add("containsText", { text: "Needs Edit", format: { fill: "#FFF4CC", font: { color: "#8A5A00", bold: true } } });
queue.getRange("A5:O105").format.autofitColumns();
queue.getRange("C:C").format.columnWidth = 34;
queue.getRange("F:F").format.columnWidth = 42;
queue.getRange("J:J").format.columnWidth = 20;
queue.getRange("O:O").format.columnWidth = 32;
queue.getRange("A5:O105").format.autofitRows();
queue.getRange("A6:O105").format.rowHeight = 22;
queue.tables.add("A5:O105", true, "ReviewQueueTable").style = "TableStyleMedium2";
queue.tabColor = navy;

const bundles = baseSheet(
  "RSA Bundles",
  "RSA Bundles",
  "บันทึกเฉพาะชุดที่ผ่าน Accepted แล้ว; QA Approved ต้องมี hash ก่อนส่ง API validate_only",
  "K",
);
bundles.getRange("A5:K5").values = [[
  "Bundle ID", "Campaign", "Ad group", "Final URL", "Headline IDs",
  "Description IDs", "Status", "SHA-256", "Validation Date", "API Mode", "Notes",
]];
styleHeader(bundles.getRange("A5:K5"));
styleBody(bundles.getRange("A6:K55"));
bundles.getRange("A6:K55").format.fill = inputFill;
bundles.getRange("G6:G55").dataValidation = { rule: { type: "list", values: ["QA Approved", "API Validated", "Posted"] } };
bundles.getRange("J6:J55").dataValidation = { rule: { type: "list", values: ["validate_only", "apply"] } };
bundles.getRange("A5:K55").format.autofitColumns();
bundles.getRange("B:B").format.columnWidth = 34;
bundles.getRange("D:D").format.columnWidth = 46;
bundles.getRange("H:H").format.columnWidth = 34;
bundles.getRange("K:K").format.columnWidth = 30;
bundles.tables.add("A5:K55", true, "RsaBundlesTable").style = "TableStyleMedium2";
bundles.tabColor = blue;

const library = baseSheet(
  "Approved Library",
  "Approved Asset Library",
  "มุมมองสำหรับตรวจงานเท่านั้น Source of truth คือ docs/google-ads/ad-copy/approved-ad-assets.yaml",
  "K",
);
library.getRange("A5:K5").values = [[
  "Asset ID", "Text", "Asset Type", "Angle", "Intent", "Evidence IDs",
  "Source Batch", "Source Proposal", "Approved On", "Active", "Notes",
]];
styleHeader(library.getRange("A5:K5"));
styleBody(library.getRange("A6:K105"));
library.getRange("A6:K105").format.fill = lightBlue;
library.getRange("J6:J105").dataValidation = { rule: { type: "list", values: ["Yes", "No"] } };
library.getRange("A5:K105").format.autofitColumns();
library.getRange("B:B").format.columnWidth = 44;
library.getRange("F:F").format.columnWidth = 20;
library.getRange("K:K").format.columnWidth = 30;
library.tables.add("A5:K105", true, "ApprovedLibraryTable").style = "TableStyleMedium2";
library.tabColor = "#4EA6D8";

const log = baseSheet(
  "Change Log",
  "Review and API Change Log",
  "เก็บเหตุผลการตัดสินใจและ request ID โดยไม่เก็บ OAuth token หรือข้อมูลลับ",
  "J",
);
log.getRange("A5:J5").values = [[
  "Timestamp", "Action", "Batch", "Proposal ID", "Previous Status", "New Status",
  "Actor", "Reason", "Bundle Hash", "API Request ID",
]];
styleHeader(log.getRange("A5:J5"));
styleBody(log.getRange("A6:J205"));
log.getRange("A6:J205").format.fill = lightBlue;
log.getRange("A5:J205").format.autofitColumns();
log.getRange("H:H").format.columnWidth = 36;
log.getRange("I:I").format.columnWidth = 34;
log.getRange("J:J").format.columnWidth = 24;
log.tables.add("A5:J205", true, "ChangeLogTable").style = "TableStyleMedium2";
log.tabColor = "#82BEDF";

const gaps = baseSheet(
  "Business Gaps",
  "Business Evidence Gaps",
  "ใช้เมื่อ AI ต้องการข้อเท็จจริงที่ยังไม่มีสถานะ approved; ห้ามนำ gap ไปเขียนโฆษณา",
  "H",
);
gaps.getRange("A5:H5").values = [[
  "Gap ID", "Category", "Requested Claim", "Reason Needed", "Status",
  "Evidence Source", "Owner Response", "Last Updated",
]];
styleHeader(gaps.getRange("A5:H5"));
styleBody(gaps.getRange("A6:H105"));
gaps.getRange("A6:H105").format.fill = inputFill;
gaps.getRange("E6:E105").dataValidation = { rule: { type: "list", values: ["Open", "Approved", "Rejected", "Needs Evidence"] } };
gaps.getRange("A5:H105").format.autofitColumns();
gaps.getRange("C:C").format.columnWidth = 36;
gaps.getRange("D:D").format.columnWidth = 34;
gaps.getRange("F:G").format.columnWidth = 34;
gaps.tables.add("A5:H105", true, "BusinessGapsTable").style = "TableStyleMedium2";
gaps.tabColor = "#B6D9EB";

workbook.recalculate();
const inspection = await workbook.inspect({
  kind: "sheet,table",
  maxChars: 8000,
  tableMaxRows: 8,
  tableMaxCols: 15,
});
console.log(inspection.ndjson);
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

for (const sheetName of ["Review Queue", "RSA Bundles", "Approved Library", "Change Log", "Business Gaps"]) {
  const preview = await workbook.render({ sheetName, range: sheetName === "Review Queue" ? "A1:O18" : "A1:K18", scale: 1.25, format: "png" });
  const safeName = sheetName.toLowerCase().replaceAll(" ", "-");
  await fs.writeFile(`${outputDir}/${safeName}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/RSA Review Board.xlsx`);
