import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import exec from 'k6/execution';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const PASSWORD = __ENV.PERF_PASSWORD || 'Password123';
const RUN_ID = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const loginFailures = new Rate('login_failures');
const uploadFailures = new Rate('upload_failures');
const downloadFailures = new Rate('download_failures');
const historyFailures = new Rate('history_failures');
const uploadDuration = new Trend('upload_duration');
const downloadFirstByte = new Trend('download_first_byte');
const downloadBytes = new Counter('download_bytes');
const historyDuration = new Trend('history_duration');

export const options = {
  discardResponseBodies: false,
  scenarios: {
    login_100_users: {
      executor: 'per-vu-iterations',
      vus: 100,
      iterations: 1,
      maxDuration: '2m',
      exec: 'loginScenario',
    },
    upload_20_users: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 1,
      startTime: '20s',
      maxDuration: '2m',
      exec: 'uploadScenario',
    },
    download_50_users: {
      executor: 'per-vu-iterations',
      vus: 50,
      iterations: 1,
      startTime: '45s',
      maxDuration: '2m',
      exec: 'downloadScenario',
    },
    history_200_users: {
      executor: 'per-vu-iterations',
      vus: 200,
      iterations: 1,
      startTime: '70s',
      maxDuration: '2m',
      exec: 'historyScenario',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    login_failures: ['rate<0.01'],
    upload_failures: ['rate<0.05'],
    download_failures: ['rate<0.05'],
    history_failures: ['rate<0.05'],
    'http_req_duration{scenario:login_100_users}': ['p(95)<1000'],
    'http_req_duration{scenario:upload_20_users}': ['p(95)<3000'],
    'http_req_waiting{scenario:download_50_users}': ['p(95)<1000'],
    'http_req_duration{scenario:history_200_users}': ['p(95)<1000'],
  },
};

export function setup() {
  const users = [];

  for (let i = 0; i < 200; i += 1) {
    const email = `perf-${RUN_ID}-${i}@example.com`;
    const registered = register(email);
    users.push({
      email,
      password: PASSWORD,
      token: registered.accessToken,
    });
  }

  const upload = uploadFile(users[0].token, `seed-${RUN_ID}.txt`, `seed file ${RUN_ID}`);

  return {
    users,
    downloadToken: upload.shareLink.token,
  };
}

export function loginScenario(data) {
  const user = data.users[(exec.vu.idInTest - 1) % data.users.length];
  const response = login(user.email, user.password);
  const ok = check(response, {
    'login returned 201': (res) => res.status === 201,
    'login returned token': (res) => Boolean(res.json('data.accessToken')),
  });

  loginFailures.add(!ok);
  sleep(1);
}

export function uploadScenario(data) {
  const user = data.users[(exec.vu.idInTest - 1) % data.users.length];
  const fileName = `upload-${RUN_ID}-${exec.vu.idInTest}.txt`;
  const response = uploadFile(user.token, fileName, `upload payload from vu ${exec.vu.idInTest}`);
  const ok = Boolean(response?.fileAsset?.id && response?.shareLink?.token);

  uploadFailures.add(!ok);
  sleep(1);
}

export function downloadScenario(data) {
  const response = http.post(
    `${BASE_URL}/share-links/${data.downloadToken}/download`,
    JSON.stringify({}),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'download' },
      responseType: 'binary',
    },
  );
  const ok = check(response, {
    'download returned 200': (res) => res.status === 200,
    'download returned bytes': (res) => Number(res.headers['Content-Length'] || 0) > 0 || res.body.byteLength > 0,
  });

  downloadFailures.add(!ok);
  downloadFirstByte.add(response.timings.waiting);
  downloadBytes.add(Number(response.headers['Content-Length'] || response.body.byteLength || 0));
  sleep(1);
}

export function historyScenario(data) {
  const user = data.users[(exec.vu.idInTest - 1) % data.users.length];
  const response = http.get(`${BASE_URL}/me/file-assets?page=1&pageSize=10&status=all&sort=uploadedAt&order=desc`, {
    headers: authHeaders(user.token),
    tags: { endpoint: 'history' },
  });
  const ok = check(response, {
    'history returned 200': (res) => res.status === 200,
    'history returned pagination': (res) => res.json('data.pagination.page') === 1,
  });

  historyFailures.add(!ok);
  historyDuration.add(response.timings.duration);
  sleep(1);
}

function register(email) {
  const response = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ email, password: PASSWORD }),
    { headers: jsonHeaders(), tags: { endpoint: 'register' } },
  );

  if (response.status !== 201) {
    fail(`Could not create perf user ${email}: ${response.status} ${response.body}`);
  }

  return response.json('data');
}

function login(email, password) {
  return http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders(), tags: { endpoint: 'login' } },
  );
}

function uploadFile(token, fileName, content) {
  const response = http.post(
    `${BASE_URL}/file-assets`,
    {
      file: http.file(content, fileName, 'text/plain'),
      expirationDays: '7',
    },
    { headers: authHeaders(token), tags: { endpoint: 'upload' } },
  );

  uploadDuration.add(response.timings.duration);

  if (response.status !== 201) {
    fail(`Upload failed for ${fileName}: ${response.status} ${response.body}`);
  }

  return response.json('data');
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json' };
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}
