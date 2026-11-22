import { StudentProfile, AdminUser } from '../types';

export const initialStudentProfile: StudentProfile = {
  id: 'usr-student-01',
  fullName: 'Zefanya Lasut',
  nim: '105022110023',
  email: '12610785@student.unklab.ac.id',
  faculty: 'FILKOM',
  studyProgram: 'Informatika',
  batch: 2023,
  residenceStatus: 'dormitory',
  dormitoryBuilding: 'Jasmine 2',
  studentStatus: 'active',
  avatarUrl: '',
};

export const initialAdminUsers: AdminUser[] = [
  {
    id: 'usr-admin-super',
    email: 'admin@unklab.ac.id',
    name: 'Super Admin UNKLAB',
    role: 'super_admin',
    permissionScope: 'Full system administration & operator controls',
    status: 'active',
    createdAt: '2026-01-01',
    createdBy: 'system_root',
  },
];
