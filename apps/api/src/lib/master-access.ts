import { randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '@repo/env-manager';

type AuthLike = {
  api: {
    signUpEmail: (options: {
      body: {
        email: string;
        password: string;
        name: string;
      };
    }) => Promise<unknown>;
  };
};

type MasterAccessState = {
  username: string;
  password: string;
  apiKey: string;
  printed: boolean;
  provisioned: boolean;
  provisionPromise: Promise<void> | null;
};

declare global {
  var __openFitnessDataMasterAccess: MasterAccessState | undefined;
}

function randomToken(bytes: number) {
  return randomBytes(bytes).toString('base64url');
}

function createState(): MasterAccessState {
  const usernameToken = randomToken(12).toLowerCase().replace(/_/g, '-');

  return {
    username: `master-${usernameToken}@open-fitness-data.example.com`,
    password: randomToken(24),
    apiKey: `ofd_master_${randomToken(32)}`,
    printed: false,
    provisioned: false,
    provisionPromise: null,
  };
}

function getState(): MasterAccessState {
  globalThis.__openFitnessDataMasterAccess ??= createState();
  return globalThis.__openFitnessDataMasterAccess;
}

export function isMasterAccessEnabled() {
  return env.SIGNUPS_DISABLED || env.API_ONLY;
}

export function getMasterAccessCredentials() {
  return getState();
}

export function isMasterApiKey(candidate: string) {
  if (!isMasterAccessEnabled()) return false;

  const { apiKey } = getState();
  const candidateBuffer = Buffer.from(candidate, 'utf8');
  const apiKeyBuffer = Buffer.from(apiKey, 'utf8');

  if (candidateBuffer.length !== apiKeyBuffer.length) return false;
  return timingSafeEqual(candidateBuffer, apiKeyBuffer);
}

function printMasterAccess() {
  if (!isMasterAccessEnabled()) return;

  const state = getState();
  if (state.printed) return;

  if (env.API_ONLY) {
    console.log('\n🔐 API_ONLY=true');
    console.log(`   Master API key: ${state.apiKey}`);
    console.log('   User management and API key management routes are disabled.\n');
  } else {
    console.log('\n🔐 SIGNUPS_DISABLED=true');
    console.log(`   Master username: ${state.username}`);
    console.log(`   Master password: ${state.password}`);
    console.log(`   Master API key:  ${state.apiKey}`);
    console.log('   New signups are disabled. Store these generated credentials securely.\n');
  }

  state.printed = true;
}

export function startMasterAccessProvisioning(auth: AuthLike) {
  if (!isMasterAccessEnabled()) return Promise.resolve();

  if (env.API_ONLY) {
    printMasterAccess();
    return Promise.resolve();
  }

  const state = getState();
  if (state.provisioned) {
    printMasterAccess();
    return Promise.resolve();
  }

  state.provisionPromise ??= auth.api
    .signUpEmail({
      body: {
        email: state.username,
        password: state.password,
        name: 'Master Access',
      },
    })
    .then(() => {
      state.provisioned = true;
      printMasterAccess();
    })
    .catch((error) => {
      state.provisionPromise = null;
      console.error('Failed to provision SIGNUPS_DISABLED master user:', error);
      throw error;
    });

  return state.provisionPromise;
}

export function startMasterAccessProvisioningInBackground(auth: AuthLike) {
  void startMasterAccessProvisioning(auth).catch(() => {
    // The provisioning function already logs the failure. Keep startup alive so health checks can report DB state.
  });
}
