import { Project } from './firestore';

export type NormalizedProjectProof = {
  serviceType: string;
  customerType: string;
  serviceArea: string;
  location: string;
  category: string;
  type: string;
  dimensions: string;
  material: string;
  problem: string;
  solution: string;
  outcome: string;
  notes: string[];
};

export function getProjectProof(project: Project): NormalizedProjectProof {
  const proof = project.proof;
  const serviceType = proof?.serviceType || inferServiceType(project.type);
  const dimensions = formatDimensions(project.width, project.extension);
  const customerType = proof?.customerType || project.category || 'ลูกค้า';
  const serviceArea = proof?.serviceArea || inferServiceArea(project.location);
  const location = project.location || serviceArea || 'ไม่ระบุพื้นที่';
  const category = project.category || customerType || 'ผลงานติดตั้ง';
  const type = project.type || serviceType;
  const material = project.canvas_material || 'วัสดุตามหน้างาน';

  return {
    serviceType,
    customerType,
    serviceArea,
    location,
    category,
    type,
    dimensions,
    material,
    problem: firstUsefulText(
      proof?.problem,
      buildFallbackProblem(category, location)
    ),
    solution: firstUsefulText(
      proof?.solution,
      buildFallbackSolution(type, material, dimensions)
    ),
    outcome: firstUsefulText(
      proof?.outcome,
      buildFallbackOutcome(type, material)
    ),
    notes: Array.isArray(proof?.proofNotes)
      ? proof.proofNotes.filter((note) => note.trim())
      : [],
  };
}

export function hasManualProjectProof(project: Project): boolean {
  const proof = project.proof;
  return Boolean(
    proof?.problem?.trim() &&
      proof?.solution?.trim() &&
      proof?.outcome?.trim()
  );
}

function inferServiceType(type?: string): string {
  if (type?.includes('มอเตอร์') || type?.includes('ไฟฟ้า')) {
    return type?.includes('สองระบบ') ? 'กันสาดพับเก็บได้สองระบบ' : 'กันสาดพับไฟฟ้า';
  }

  return 'กันสาดพับเก็บได้';
}

function inferServiceArea(location = ''): string {
  const normalized = location.toLowerCase();
  if (normalized.includes('กรุงเทพ') || normalized.includes('bangkok')) return 'กรุงเทพ';
  if (normalized.includes('นนทบุรี') || normalized.includes('nonthaburi')) return 'นนทบุรี';
  if (normalized.includes('ปทุมธานี') || normalized.includes('pathum')) return 'ปทุมธานี';
  if (normalized.includes('สมุทรปราการ')) return 'สมุทรปราการ';
  if (normalized.includes('นครปฐม')) return 'นครปฐม';
  if (normalized.includes('สมุทรสาคร')) return 'สมุทรสาคร';
  if (normalized.includes('อยุธยา') || normalized.includes('อยุทธยา')) return 'อยุธยา';
  return location || 'ไม่ระบุพื้นที่';
}

function formatDimensions(width?: number, extension?: number): string {
  if (!width || !extension) return 'ระบุขนาดตามหน้างาน';
  return `${width} x ${extension} เมตร`;
}

function firstUsefulText(preferred: string | undefined, fallback: string): string {
  const cleaned = preferred?.trim();
  return cleaned || fallback;
}

function buildFallbackProblem(category: string, location: string): string {
  return `${category} ที่ ${location} ต้องการร่มเงาและพื้นที่ใช้งานที่เปิดปิดได้ โดยไม่ทำหลังคาถาวรให้พื้นที่ดูทึบ`;
}

function buildFallbackSolution(type: string, material: string, dimensions: string): string {
  return `ติดตั้ง${type} ขนาด ${dimensions} เลือกใช้${material} ตามสภาพหน้างานและการใช้งานจริง`;
}

function buildFallbackOutcome(type: string, material: string): string {
  return `ติดตั้ง${type} พร้อม${material} ให้ใช้งานกันแดดฝนและพับเก็บได้ตามสถานการณ์จริง`;
}
