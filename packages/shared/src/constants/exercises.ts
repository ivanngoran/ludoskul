import type { ExerciseCategory, ExerciseCode } from '../types/index.js';

export interface ExerciseMeta {
    code: ExerciseCode;
    name: string;
    category: ExerciseCategory;
    icon: string;
    color: string;
    order: number;
    isPilot: boolean;
}

export const PILOT_CODES: ExerciseCode[] = ['ADD', 'SUB', 'TAB', 'SHAPE_2D', 'TIME', 'SUITE'];

export const EXERCISES: ExerciseMeta[] = [
    { code: 'ADD', name: 'Addition Rapide', category: 'CALCUL', icon: 'plus', color: '#ec6f1a', order: 1, isPilot: true },
    { code: 'SUB', name: 'Soustraction Rapide', category: 'CALCUL', icon: 'minus', color: '#ec6f1a', order: 2, isPilot: true },
    { code: 'MUL', name: 'Multiplication Rapide', category: 'CALCUL', icon: 'x', color: '#ec6f1a', order: 3, isPilot: false },
    { code: 'DIV', name: 'Division Rapide', category: 'CALCUL', icon: 'divide', color: '#ec6f1a', order: 4, isPilot: false },
    { code: 'MIX', name: 'Calcul Mental Mixte', category: 'CALCUL', icon: 'shuffle', color: '#ec6f1a', order: 5, isPilot: false },
    { code: 'TAB', name: 'Tables de Multiplication', category: 'CALCUL', icon: 'table', color: '#ec6f1a', order: 6, isPilot: true },
    { code: 'COMP10', name: 'Compléments', category: 'CALCUL', icon: 'target', color: '#ec6f1a', order: 7, isPilot: false },
    { code: 'DOUBLE', name: 'Doubles et Moitiés', category: 'CALCUL', icon: 'copy', color: '#ec6f1a', order: 8, isPilot: false },
    { code: 'CMP', name: 'Comparaison', category: 'NOMBRES', icon: 'scale', color: '#8b5cf6', order: 9, isPilot: false },
    { code: 'FRAC', name: 'Fractions Simples', category: 'NOMBRES', icon: 'pie', color: '#8b5cf6', order: 10, isPilot: false },
    { code: 'DECI', name: 'Nombres Décimaux', category: 'NOMBRES', icon: 'decimal', color: '#8b5cf6', order: 11, isPilot: false },
    { code: 'POURC', name: 'Pourcentages', category: 'NOMBRES', icon: 'percent', color: '#8b5cf6', order: 12, isPilot: false },
    { code: 'TIME', name: 'Heures et Durées', category: 'MESURES', icon: 'clock', color: '#22c55e', order: 13, isPilot: true },
    { code: 'MES', name: 'Longueurs et Masses', category: 'MESURES', icon: 'ruler', color: '#22c55e', order: 14, isPilot: false },
    { code: 'MONEY', name: 'Monnaie Euro', category: 'MESURES', icon: 'coins', color: '#22c55e', order: 15, isPilot: false },
    { code: 'SHAPE_2D', name: 'Formes Planes', category: 'GEOMETRIE', icon: 'shapes', color: '#3b82f6', order: 16, isPilot: true },
    { code: 'SHAPE_3D', name: 'Solides', category: 'GEOMETRIE', icon: 'cube', color: '#3b82f6', order: 17, isPilot: false },
    { code: 'PROP', name: 'Propriétés', category: 'GEOMETRIE', icon: 'list', color: '#3b82f6', order: 18, isPilot: false },
    { code: 'SYM', name: 'Symétrie', category: 'GEOMETRIE', icon: 'symmetry', color: '#3b82f6', order: 19, isPilot: false },
    { code: 'PERIM', name: 'Périmètres', category: 'GEOMETRIE', icon: 'perimeter', color: '#3b82f6', order: 20, isPilot: false },
    { code: 'AREA', name: 'Aires', category: 'GEOMETRIE', icon: 'area', color: '#3b82f6', order: 21, isPilot: false },
    { code: 'ANGLE', name: 'Angles', category: 'GEOMETRIE', icon: 'angle', color: '#3b82f6', order: 22, isPilot: false },
    { code: 'VOL', name: 'Volumes', category: 'GEOMETRIE', icon: 'box', color: '#3b82f6', order: 23, isPilot: false },
    { code: 'REP', name: 'Repérage', category: 'GEOMETRIE', icon: 'grid', color: '#3b82f6', order: 24, isPilot: false },
    { code: 'SUITE', name: 'Suites Logiques', category: 'LOGIQUE', icon: 'puzzle', color: '#ec4899', order: 25, isPilot: true },
    { code: 'PROB', name: 'Petits Problèmes', category: 'LOGIQUE', icon: 'bulb', color: '#ec4899', order: 26, isPilot: false },
];
