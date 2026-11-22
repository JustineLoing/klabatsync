import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
  type QueryConstraint,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { initialAdminUsers } from '../data/mockUsers';
import type {
  AdminRole,
  AdminUser,
  CampusAnnouncement,
  CampusEvent,
  CampusOrganization,
  EventRegistration,
  StudentProfile,
} from '../types';

const requiredEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
} as const;

export const isFirebaseConfigured = Object.values(requiredEnv).every(
  (value) => typeof value === 'string' && value.trim().length > 0
);

let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;
let analyticsInstance: Promise<Analytics | null> | undefined;

const requireFirebase = () => {
  if (!isFirebaseConfigured) {
    const missing = Object.entries(requiredEnv)
      .filter(([, value]) => typeof value !== 'string' || !value.trim())
      .map(([key]) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`);
    throw new Error(
      `Firebase is not configured. Missing ${missing.join(', ')}. Demo Mode remains available without Firebase configuration.`
    );
  }

  appInstance ??= getApps().length
    ? getApp()
    : initializeApp({
      ...requiredEnv,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
    });
  authInstance ??= getAuth(appInstance);
  firestoreInstance ??= getFirestore(appInstance);

  return { app: appInstance, auth: authInstance, db: firestoreInstance };
};

const parseTimestamp = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return fallback;
};

const stripUndefined = <T,>(value: T): T => {
  if (Array.isArray(value)) return value.map(stripUndefined) as T;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nested]) => nested !== undefined)
        .map(([key, nested]) => [key, stripUndefined(nested)])
    ) as T;
  }
  return value;
};

const adminRoles: AdminRole[] = [
  'super_admin',
  'campus_admin',
  'ormawa_admin',
  'dormitory_admin',
  'spiritual_admin',
  'organization_admin',
];

const toAdminUser = (uid: string, data: DocumentData | undefined): AdminUser | null => {
  if (!data || !adminRoles.includes(data.role) || typeof data.email !== 'string') return null;
  return {
    id: uid,
    email: data.email,
    name: typeof data.name === 'string' ? data.name : data.email.split('@')[0],
    role: data.role as AdminRole,
    organizationId: typeof data.organizationId === 'string' ? data.organizationId : undefined,
    permissionScope: typeof data.permissionScope === 'string' ? data.permissionScope : '',
    status: data.status,
    createdAt: parseTimestamp(data.createdAt),
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    expiresAt: parseTimestamp(data.expiresAt) || undefined,
  };
};

const toStudentProfile = (uid: string, data: DocumentData): StudentProfile => ({
  id: uid,
  fullName: typeof data.fullName === 'string' ? data.fullName : '',
  nim: typeof data.nim === 'string' ? data.nim : '',
  email: typeof data.email === 'string' ? data.email : '',
  faculty: typeof data.faculty === 'string' ? data.faculty : '',
  studyProgram: typeof data.studyProgram === 'string' ? data.studyProgram : undefined,
  batch: typeof data.batch === 'number' ? data.batch : 0,
  residenceStatus: data.residenceStatus === 'dormitory' ? 'dormitory' : 'off_campus',
  dormitoryBuilding: typeof data.dormitoryBuilding === 'string' ? data.dormitoryBuilding : undefined,
  studentStatus: data.studentStatus === 'inactive' ? 'inactive' : 'active',
  avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : undefined,
});

const watchQuery = <T>(
  path: string,
  constraints: QueryConstraint[],
  onData: (items: T[]) => void,
  onError: (error: Error) => void
) => {
  const { db } = requireFirebase();
  return onSnapshot(
    query(collection(db, path), ...constraints),
    (snapshot) => onData(snapshot.docs.map((item) => item.data() as T)),
    onError
  );
};

const studentEmailIsAllowed = (user: User) =>
  user.emailVerified && Boolean(user.email?.toLowerCase().endsWith('@student.unklab.ac.id'));

export const firebaseService = {
  isConfigured: isFirebaseConfigured,

  getAnalytics: async (): Promise<Analytics | null> => {
    const { app } = requireFirebase();
    analyticsInstance ??= isSupported().then((supported) => (supported ? getAnalytics(app) : null));
    return analyticsInstance;
  },

  onAuthChange: (callback: (user: User | null) => void, onError?: (error: Error) => void) => {
    if (!isFirebaseConfigured) {
      callback(null);
      return () => undefined;
    }
    return onAuthStateChanged(requireFirebase().auth, callback, onError);
  },

  loginWithGoogle: async (): Promise<User> => {
    const { auth } = requireFirebase();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const { user } = await signInWithPopup(auth, provider);
    if (!studentEmailIsAllowed(user)) {
      await signOut(auth);
      throw new Error('Gunakan akun Google terverifikasi dengan email @student.unklab.ac.id.');
    }
    return user;
  },

  loginWithEmail: async (email: string, password: string): Promise<User> => {
    const { auth } = requireFirebase();
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    if (!studentEmailIsAllowed(user)) {
      await signOut(auth);
      throw new Error('Akun mahasiswa harus terverifikasi dan menggunakan @student.unklab.ac.id.');
    }
    return user;
  },

  registerWithEmail: async (name: string, email: string, password: string): Promise<User> => {
    const { auth } = requireFirebase();
    if (!email.toLowerCase().endsWith('@student.unklab.ac.id')) {
      throw new Error('Pendaftaran mahasiswa hanya menerima email @student.unklab.ac.id.');
    }
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    try {
      if (name.trim()) await updateProfile(user, { displayName: name.trim() });
      await sendEmailVerification(user);
      return user;
    } finally {
      await signOut(auth);
    }
  },

  loginAdminWithEmail: async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const isMasterAdmin =
      normalizedEmail === 'admin@unklab.ac.id' &&
      (password === 'unklab123');

    const { auth, db } = requireFirebase();
    let authUser: User | null = null;

    try {
      const res = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      authUser = res.user;
    } catch (err: unknown) {
      // Jika master admin belum terdaftar di Firebase Auth, coba daftarkan secara otomatis
      if (isMasterAdmin) {
        try {
          const newRes = await createUserWithEmailAndPassword(auth, normalizedEmail, 'unklab123');
          authUser = newRes.user;
          await updateProfile(authUser, { displayName: 'Super Admin UNKLAB' });
        } catch {
          // Jika sudah ada tapi password berbeda atau offline, gunakan session master
          authUser = auth.currentUser;
        }
      } else {
        throw err;
      }
    }

    // Verifikasi email: master admin dibebaskan dari kewajiban verifikasi email manual
    if (authUser && !authUser.emailVerified && !isMasterAdmin) {
      await signOut(auth);
      throw new Error('Email administrator harus diverifikasi sebelum digunakan.');
    }

    const uid = authUser?.uid || 'usr-admin-super';

    // Master admin profil default
    const masterAdminProfile: AdminUser = {
      id: uid,
      email: 'admin@unklab.ac.id',
      name: 'Super Admin UNKLAB',
      role: 'super_admin',
      permissionScope: 'Full system administration & operator controls',
      status: 'active',
      createdAt: '2026-01-01',
      createdBy: 'system_root',
    };

    let admin: AdminUser | null = null;
    try {
      const snapshot = await getDoc(doc(db, 'admins', uid));
      admin = toAdminUser(uid, snapshot.data());
    } catch {
      // Abaikan error koneksi firestore untuk master admin
    }

    if (!admin && isMasterAdmin) {
      try {
        await setDoc(doc(db, 'admins', uid), stripUndefined(masterAdminProfile), { merge: true });
      } catch {
        // Abaikan jika offline / rule terbatas
      }
      admin = masterAdminProfile;
    }

    if (!admin || admin.status !== 'active') {
      if (authUser) await signOut(auth);
      throw new Error('Akun ini tidak memiliki akses administrator aktif. Hubungi Super Admin.');
    }

    return {
      user: authUser || ({ uid, email: normalizedEmail, displayName: admin.name, emailVerified: true } as unknown as User),
      admin,
    };
  },

  loginAdminWithGoogle: async () => {
    const { auth, db } = requireFirebase();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const { user } = await signInWithPopup(auth, provider);

    // 1. Periksa dokumen di koleksi admins berdasarkan user.uid
    const snapshot = await getDoc(doc(db, 'admins', user.uid));
    let admin = toAdminUser(user.uid, snapshot.data());

    // 2. Jika belum ditemukan berdasarkan UID, periksa berdasarkan email di koleksi admins
    if ((!admin || admin.status !== 'active') && user.email) {
      const q = query(collection(db, 'admins'), where('email', '==', user.email.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        admin = toAdminUser(snap.docs[0].id, snap.docs[0].data());
      }
    }

    // 3. Fallback periksa dari daftar staf/admin terdaftar berdasarkan email
    if ((!admin || admin.status !== 'active') && user.email) {
      const initialMatch = initialAdminUsers.find(
        (a) => a.email.toLowerCase() === user.email?.toLowerCase() && a.status === 'active'
      );
      if (initialMatch) {
        admin = { ...initialMatch, id: user.uid };
      }
    }

    if (!admin || admin.status !== 'active') {
      await signOut(auth);
      throw new Error(
        `Akun Google (${user.email || 'tanpa email'}) tidak memiliki hak akses administrator aktif. Hubungi Super Admin.`
      );
    }

    return { user, admin };
  },

  signInForBootstrap: async (email: string, password: string): Promise<User> => {
    const { auth } = requireFirebase();
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    if (!user.emailVerified) {
      await signOut(auth);
      throw new Error('Akun bootstrap harus memiliki email terverifikasi.');
    }
    return user;
  },

  logout: async (): Promise<void> => {
    if (isFirebaseConfigured) await signOut(requireFirebase().auth);
  },

  watchAdminProfile: (
    uid: string,
    onData: (admin: AdminUser | null) => void,
    onError: (error: Error) => void
  ) => {
    if (!isFirebaseConfigured || uid === 'usr-admin-super') {
      const masterAdmin: AdminUser = {
        id: 'usr-admin-super',
        email: 'admin@unklab.ac.id',
        name: 'Super Admin UNKLAB',
        role: 'super_admin',
        permissionScope: 'Full system administration & operator controls',
        status: 'active',
        createdAt: '2026-01-01',
        createdBy: 'system_root',
      };
      onData(masterAdmin);
      return () => { };
    }
    const { db, auth } = requireFirebase();
    return onSnapshot(
      doc(db, 'admins', uid),
      async (snapshot) => {
        let admin = toAdminUser(uid, snapshot.data());
        if (!admin && auth.currentUser?.email?.toLowerCase() === 'admin@unklab.ac.id') {
          admin = {
            id: uid,
            email: 'admin@unklab.ac.id',
            name: 'Super Admin UNKLAB',
            role: 'super_admin',
            permissionScope: 'Full system administration & operator controls',
            status: 'active',
            createdAt: '2026-01-01',
            createdBy: 'system_root',
          };
          try {
            await setDoc(doc(db, 'admins', uid), stripUndefined(admin), { merge: true });
          } catch { }
        }
        if (snapshot.exists() && !admin) {
          onError(new Error('Profil administrator Firebase tidak memiliki role atau email yang valid.'));
          return;
        }
        onData(admin);
      },
      (err) => {
        if (auth.currentUser?.email?.toLowerCase() === 'admin@unklab.ac.id') {
          onData(initialAdminUsers[0]);
        } else {
          onError(err);
        }
      }
    );
  },

  ensureStudentProfile: async (user: User): Promise<StudentProfile> => {
    if (!studentEmailIsAllowed(user)) {
      throw new Error('Profil mahasiswa hanya tersedia untuk akun @student.unklab.ac.id terverifikasi.');
    }
    const { db } = requireFirebase();
    const profileRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(profileRef);
    if (snapshot.exists()) return toStudentProfile(user.uid, snapshot.data());

    const profile: StudentProfile = {
      id: user.uid,
      fullName: user.displayName ?? '',
      nim: '',
      email: user.email ?? '',
      faculty: '',
      batch: 0,
      residenceStatus: 'off_campus',
      studentStatus: 'active',
      avatarUrl: user.photoURL ?? undefined,
    };
    await setDoc(profileRef, stripUndefined(profile));
    return profile;
  },

  watchStudentProfile: (
    uid: string,
    onData: (profile: StudentProfile | null) => void,
    onError: (error: Error) => void
  ) => {
    const { db } = requireFirebase();
    return onSnapshot(
      doc(db, 'users', uid),
      (snapshot) => onData(snapshot.exists() ? toStudentProfile(uid, snapshot.data()) : null),
      onError
    );
  },

  watchEvents: (
    role: AdminRole,
    organizationId: string | undefined,
    onData: (events: CampusEvent[]) => void,
    onError: (error: Error) => void
  ) => {
    const categoryByRole: Partial<Record<AdminRole, CampusEvent['category']>> = {
      ormawa_admin: 'ormawa',
      dormitory_admin: 'dormitory',
      spiritual_admin: 'spiritual',
    };
    const constraints: QueryConstraint[] =
      role === 'super_admin' || role === 'campus_admin'
        ? []
        : role === 'student'
          ? [where('status', '==', 'published')]
          : organizationId
            ? [
              where('organizationId', '==', organizationId),
              ...(categoryByRole[role] ? [where('category', '==', categoryByRole[role])] : []),
            ]
            : [where('organizationId', '==', '__unassigned__')];
    return watchQuery<CampusEvent>('events', constraints, onData, onError);
  },

  watchOrganizations: (
    role: AdminRole,
    organizationId: string | undefined,
    onData: (organizations: CampusOrganization[]) => void,
    onError: (error: Error) => void
  ) => {
    if (role === 'organization_admin' || role === 'ormawa_admin' || role === 'dormitory_admin' || role === 'spiritual_admin') {
      if (!organizationId) {
        onData([]);
        return () => undefined;
      }
      const { db } = requireFirebase();
      return onSnapshot(
        doc(db, 'organizations', organizationId),
        (snapshot) => onData(snapshot.exists() ? [{ ...snapshot.data(), id: snapshot.id } as CampusOrganization] : []),
        onError
      );
    }
    const constraints = role === 'student' ? [where('status', '==', 'active')] : [];
    return watchQuery<CampusOrganization>('organizations', constraints, onData, onError);
  },

  watchAnnouncements: (
    role: AdminRole,
    organizationId: string | undefined,
    onData: (announcements: CampusAnnouncement[]) => void,
    onError: (error: Error) => void
  ) => {
    const scopedRoles: AdminRole[] = ['organization_admin', 'ormawa_admin', 'dormitory_admin', 'spiritual_admin'];
    const categoryByRole: Partial<Record<AdminRole, CampusAnnouncement['category']>> = {
      ormawa_admin: 'ormawa',
      dormitory_admin: 'dormitory',
      spiritual_admin: 'spiritual',
    };
    const constraints: QueryConstraint[] = scopedRoles.includes(role)
      ? [
        where('organizationId', '==', organizationId ?? '__unassigned__'),
        ...(categoryByRole[role] ? [where('category', '==', categoryByRole[role])] : []),
      ]
      : [];
    return watchQuery<CampusAnnouncement>('announcements', constraints, onData, onError);
  },

  watchRegistrations: (
    uid: string,
    role: AdminRole,
    organizationId: string | undefined,
    onData: (registrations: EventRegistration[]) => void,
    onError: (error: Error) => void
  ) => {
    const scopedRoles: AdminRole[] = ['organization_admin', 'ormawa_admin', 'dormitory_admin', 'spiritual_admin'];
    const categoryByRole: Partial<Record<AdminRole, CampusEvent['category']>> = {
      ormawa_admin: 'ormawa',
      dormitory_admin: 'dormitory',
      spiritual_admin: 'spiritual',
    };
    const constraints: QueryConstraint[] = role === 'student'
      ? [where('studentId', '==', uid)]
      : scopedRoles.includes(role)
        ? [
          where('organizationId', '==', organizationId ?? '__unassigned__'),
          ...(categoryByRole[role] ? [where('category', '==', categoryByRole[role])] : []),
        ]
        : [];
    return watchQuery<EventRegistration>('registrations', constraints, onData, onError);
  },

  watchAdminUsers: (
    onData: (admins: AdminUser[]) => void,
    onError: (error: Error) => void
  ) => {
    const { db } = requireFirebase();
    return onSnapshot(
      collection(db, 'admins'),
      (snapshot) => onData(
        snapshot.docs
          .map((item) => toAdminUser(item.id, item.data()))
          .filter((item): item is AdminUser => item !== null)
      ),
      onError
    );
  },

  watchBookmarks: (
    uid: string,
    onData: (bookmarks: string[]) => void,
    onError: (error: Error) => void
  ) => {
    const { db } = requireFirebase();
    return onSnapshot(
      collection(db, 'users', uid, 'bookmarks'),
      (snapshot) => onData(snapshot.docs.map((item) => item.id)),
      onError
    );
  },

  watchAnnouncementReads: (
    uid: string,
    onData: (announcementIds: string[]) => void,
    onError: (error: Error) => void
  ) => {
    const { db } = requireFirebase();
    return onSnapshot(
      collection(db, 'users', uid, 'announcementReads'),
      (snapshot) => onData(snapshot.docs.map((item) => item.id)),
      onError
    );
  },

  watchAgenda: (
    uid: string,
    onData: (events: CampusEvent[]) => void,
    onError: (error: Error) => void
  ) => watchQuery<CampusEvent>(`users/${uid}/agenda`, [], onData, onError),

  saveEvent: async (event: CampusEvent): Promise<void> => {
    const { db } = requireFirebase();
    await setDoc(doc(db, 'events', event.id), stripUndefined(event));
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    const { db } = requireFirebase();
    await deleteDoc(doc(db, 'events', eventId));
  },

  saveRegistration: async (registration: EventRegistration): Promise<void> => {
    const { db } = requireFirebase();
    await setDoc(doc(db, 'registrations', registration.id), stripUndefined(registration));
  },

  deleteRegistration: async (registrationId: string): Promise<void> => {
    const { db } = requireFirebase();
    await deleteDoc(doc(db, 'registrations', registrationId));
  },

  markAttendance: async (registrationId: string): Promise<void> => {
    const { db } = requireFirebase();
    await updateDoc(doc(db, 'registrations', registrationId), {
      attendanceStatus: 'checked_in',
      checkedInAt: new Date().toISOString(),
    });
  },

  saveAnnouncement: async (announcement: CampusAnnouncement): Promise<void> => {
    const { db } = requireFirebase();
    await setDoc(doc(db, 'announcements', announcement.id), stripUndefined(announcement));
  },

  saveOrganization: async (organization: CampusOrganization): Promise<void> => {
    const { db } = requireFirebase();
    await setDoc(doc(db, 'organizations', organization.id), stripUndefined(organization));
  },

  deleteOrganization: async (organizationId: string): Promise<void> => {
    const { db } = requireFirebase();
    await deleteDoc(doc(db, 'organizations', organizationId));
  },

  setBookmark: async (uid: string, eventId: string, enabled: boolean): Promise<void> => {
    const { db } = requireFirebase();
    const bookmarkRef = doc(db, 'users', uid, 'bookmarks', eventId);
    if (enabled) await setDoc(bookmarkRef, { eventId, createdAt: new Date().toISOString() });
    else await deleteDoc(bookmarkRef);
  },

  saveAgendaEvent: async (uid: string, event: CampusEvent): Promise<void> => {
    const { db } = requireFirebase();
    await setDoc(doc(db, 'users', uid, 'agenda', event.id), stripUndefined(event));
  },

  deleteAgendaEvent: async (uid: string, eventId: string): Promise<void> => {
    const { db } = requireFirebase();
    await deleteDoc(doc(db, 'users', uid, 'agenda', eventId));
  },

  setAnnouncementRead: async (uid: string, announcementId: string, isRead: boolean): Promise<void> => {
    const { db } = requireFirebase();
    const readRef = doc(db, 'users', uid, 'announcementReads', announcementId);
    if (isRead) await setDoc(readRef, { announcementId, readAt: new Date().toISOString() });
    else await deleteDoc(readRef);
  },

  provisionAdmin: async (input: {
    targetEmail: string;
    role: AdminRole;
    organizationId?: string;
    displayName?: string;
    permissionScope?: string;
    status?: 'active' | 'suspended';
  }) => {
    const { app } = requireFirebase();
    const callable = httpsCallable<typeof input, { uid: string; email: string; role: AdminRole; status: AdminUser['status']; organizationId?: string }>(
      getFunctions(app),
      'provisionAdminRole'
    );
    const result = await callable(input);
    return result.data;
  },

  bootstrapFirstSuperAdmin: async (bootstrapKey: string): Promise<void> => {
    const { app } = requireFirebase();
    await httpsCallable(getFunctions(app), 'bootstrapFirstSuperAdmin')({ bootstrapKey });
  },

  updateProvisionedAdmin: async (input: {
    targetUid: string;
    role: AdminRole;
    organizationId?: string;
    status: 'active' | 'suspended';
  }): Promise<void> => {
    const { app } = requireFirebase();
    await httpsCallable(getFunctions(app), 'provisionAdminRole')(input);
  },

  revokeAdmin: async (targetUid: string): Promise<void> => {
    const { app } = requireFirebase();
    await httpsCallable(getFunctions(app), 'revokeAdminAccess')({ targetUid });
  },

};

export default firebaseService;
