import { COURSES_01_05 } from './courses_01_05.ts';
import { COURSES_06_10 } from './courses_06_10.ts';
import { COURSES_11_13 } from './courses_11_13.ts';
import { COURSE_14_CRYPTO } from './course_14_crypto.ts';
import { COURSE_15_ADVANCED } from './course_15_advanced.ts';
import type { CurriculumCourseSeed } from './types.ts';

export const ALL_CURRICULUM_COURSES: CurriculumCourseSeed[] = [
  ...COURSES_01_05,
  ...COURSES_06_10,
  ...COURSES_11_13,
  COURSE_14_CRYPTO,
  COURSE_15_ADVANCED,
];

export type { CurriculumCourseSeed, CurriculumLessonSeed } from './types.ts';
export { OFFICIAL_SOURCES } from './types.ts';
