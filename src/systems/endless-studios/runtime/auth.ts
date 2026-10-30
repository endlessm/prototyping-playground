// Stand-in for the app's AuthService (plugins/auth/AuthService.js): the same getters and role checks, answered from
// a sample user instead of a login. Role ids follow the app's UserRole enum (types/user.ts).
import { computed, readonly, ref } from 'vue';
import { navigateTo } from './navigation';

const Role = { ADMIN: 1, MEMBER: 2, LEADER: 3, MENTOR: 5, PROGRAM_ADMIN: 14, CONTENT_EDITOR: 19, INSTITUTION_ADMIN: 20, PROGRAM_MANAGER: 23 };
const COHORT_ADMIN = 22; // CohortRole.COHORT_ADMIN

export type SampleUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: { id: number | string; name?: string }[];
  [field: string]: unknown;
};

const base = {
  verified: true,
  disabled: false,
  public: true,
  age_category: 'adult',
  is_restricted_partner_account: false,
  created_at: '2025-03-12T10:00:00Z',
  permissions: { change_username: 'allowed' },
  auth_methods: ['password'],
  github_user: null,
  memberOfProjects: [],
  leaderForProjects: [],
  institutions: [],
  joinedProjectsCount: 3,
  certificatesCount: 1,
};

// Named sample users. A screen picks one with `user="mentor"`, passes its own object, or `null` for signed out.
export const sampleUsers = {
  learner: {
    ...base,
    id: 101,
    username: 'ana.learner',
    first_name: 'Ana',
    last_name: 'Souza',
    email: 'ana.learner@example.org',
    roles: [{ id: Role.MEMBER, name: 'Member' }],
    metadata: { image_url: null, interests: [{ id: 1, name: 'Game design' }, { id: 2, name: 'Pixel art' }] },
  },
  mentor: {
    ...base,
    id: 102,
    username: 'marco.mentor',
    first_name: 'Marco',
    last_name: 'Lima',
    email: 'marco.mentor@example.org',
    roles: [{ id: Role.MEMBER, name: 'Member' }, { id: Role.MENTOR, name: 'Mentor' }],
    metadata: { image_url: null, interests: [{ id: 3, name: 'Programming' }] },
    joinedProjectsCount: 12,
    certificatesCount: 4,
  },
  admin: {
    ...base,
    id: 103,
    username: 'alex.admin',
    first_name: 'Alex',
    last_name: 'Reis',
    email: 'alex.admin@example.org',
    roles: [{ id: Role.MEMBER, name: 'Member' }, { id: Role.ADMIN, name: 'Admin' }],
    metadata: { image_url: null, interests: [] },
    joinedProjectsCount: 0,
    certificatesCount: 0,
  },
} satisfies Record<string, SampleUser>;

export type SampleUserName = keyof typeof sampleUsers;
/** A sample user's name, a user object, or `null` for signed out. */
export type UserOption = SampleUserName | SampleUser | null;

export function resolveUser(user: UserOption | undefined): SampleUser | null {
  if (user === undefined) return sampleUsers.learner;
  if (user === null || typeof user === 'object') return user;
  if (!(user in sampleUsers)) {
    console.warn('[Endless Studios] unknown sample user', user, '- using learner');
    return sampleUsers.learner;
  }
  return sampleUsers[user];
}

export function createAuth(option: UserOption | undefined) {
  const user = resolveUser(option);
  const userData = ref<SampleUser | null>(user);
  const token = ref<string | null>(user ? `sample-token-${user.id}` : null);
  const has = (...ids: (number | string)[]) => !!userData.value?.roles?.some(role => ids.includes(role.id));
  const signedIn = (check: () => boolean) => computed(() => !!token.value && check());
  const roles = {
    isAdult: signedIn(() => userData.value?.age_category === 'adult'),
    isAdmin: signedIn(() => has(Role.ADMIN)),
    isLeader: signedIn(() => has(Role.LEADER, Role.ADMIN)),
    isEditor: signedIn(() => has(Role.CONTENT_EDITOR)),
    isProgramAdmin: signedIn(() => has(Role.PROGRAM_ADMIN)),
    isProgramManager: signedIn(() => has(Role.PROGRAM_MANAGER)),
    isInstitutionAdmin: signedIn(() => has(Role.INSTITUTION_ADMIN)),
    isCohortAdmin: signedIn(() => has(COHORT_ADMIN)),
  };
  const login = () => console.info('[Endless Studios] login requested (sample auth stays as chosen)');
  const logout = () => console.info('[Endless Studios] logout requested (sample auth stays as chosen)');
  return {
    token: readonly(token),
    userData: readonly(userData),
    get user() {
      return userData.value;
    },
    get loggedIn() {
      return !!token.value;
    },
    get isAdult() {
      return roles.isAdult.value;
    },
    get isMinor() {
      return !!token.value && userData.value?.age_category === 'digital_youth';
    },
    get isAdmin() {
      return roles.isAdmin.value;
    },
    get isLeader() {
      return roles.isLeader.value;
    },
    get isEditor() {
      return roles.isEditor.value;
    },
    get isProgramAdmin() {
      return roles.isProgramAdmin.value;
    },
    get isProgramManager() {
      return roles.isProgramManager.value;
    },
    get isInstitutionAdmin() {
      return roles.isInstitutionAdmin.value;
    },
    get isCohortAdmin() {
      return roles.isCohortAdmin.value;
    },
    hasRole: (...ids: number[]) => has(...ids),
    requireLogin() {
      if (token.value) return false;
      login();
      return true;
    },
    consumeAuthError: () => null,
    startLogin: async () => login(),
    startSignup: async () => navigateTo('/signup/'),
    startLogout: async () => logout(),
    logout: async () => logout(),
    check: () => !!token.value,
    mounted: async () => {},
    reset() {},
  };
}

export type Auth = ReturnType<typeof createAuth>;
