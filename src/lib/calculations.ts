import { CalculationResult } from './types';

/**
 * Calculates exact age from birth date string (YYYY-MM-DD)
 */
export function calculateAge(birthDateStr: string, referenceDateStr?: string): number {
  if (!birthDateStr) return 0;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return 0;

  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Calculates vertical jump in cm: reach_jumping - reach_standing
 */
export function calculateVerticalJump(standingReachCm: number, jumpingReachCm: number): number {
  if (!standingReachCm || !jumpingReachCm) return 0;
  const jump = jumpingReachCm - standingReachCm;
  return Math.max(0, Math.round(jump * 10) / 10);
}

/**
 * Calculates Body Mass Index (IMC) = weight (kg) / [height (m)]^2
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

/**
 * Returns IMC classification and color badge
 */
export function getBMICategory(bmi: number): { label: string; color: string; description: string } {
  if (bmi <= 0) return { label: 'Não calculado', color: 'text-gray-400 bg-gray-800/50 border-gray-700', description: '-' };
  if (bmi < 18.5) {
    return {
      label: 'Abaixo do peso',
      color: 'text-yellow-400 bg-yellow-950/40 border-yellow-700/50',
      description: 'Abaixo da faixa esperada para atletas.'
    };
  }
  if (bmi < 25.0) {
    return {
      label: 'Peso normal (Ideal)',
      color: 'text-emerald-400 bg-emerald-950/50 border-emerald-500/50',
      description: 'Faixa saudável e padrão de rendimento.'
    };
  }
  if (bmi < 30.0) {
    return {
      label: 'Sobrepeso / Massa Muscular Elevada',
      color: 'text-orange-400 bg-orange-950/40 border-orange-700/50',
      description: 'Pode representar massa muscular desenvolvida em atletas.'
    };
  }
  return {
    label: 'Obesidade',
    color: 'text-red-400 bg-red-950/40 border-red-700/50',
    description: 'Atenção ao condicionamento físico e sobrecarga articular.'
  };
}

/**
 * Returns jump performance classification
 */
export function getJumpCategory(verticalJumpCm: number): { label: string; color: string } {
  if (verticalJumpCm <= 0) return { label: 'Não calculado', color: 'text-gray-400 bg-gray-800/50 border-gray-700' };
  if (verticalJumpCm >= 80) {
    return { label: 'Elite / Pro', color: 'text-emerald-300 bg-emerald-900/60 border-emerald-400 shadow-neon' };
  }
  if (verticalJumpCm >= 65) {
    return { label: 'Excelente', color: 'text-emerald-400 bg-emerald-950/50 border-emerald-500/50' };
  }
  if (verticalJumpCm >= 50) {
    return { label: 'Bom', color: 'text-teal-400 bg-teal-950/40 border-teal-700/50' };
  }
  return { label: 'Em Desenvolvimento', color: 'text-blue-400 bg-blue-950/40 border-blue-700/50' };
}

/**
 * Returns full calculations bundle
 */
export function calculateAllMetrics(
  birthDate: string,
  weight: number,
  height: number,
  standingReach: number,
  jumpingReach: number,
  evaluationDate?: string
): CalculationResult {
  const age = calculateAge(birthDate, evaluationDate);
  const vertical_jump = calculateVerticalJump(standingReach, jumpingReach);
  const bmi = calculateBMI(weight, height);
  const bmi_category = getBMICategory(bmi);
  const jump_category = getJumpCategory(vertical_jump);

  return {
    age,
    vertical_jump,
    bmi,
    bmi_category,
    jump_category
  };
}
