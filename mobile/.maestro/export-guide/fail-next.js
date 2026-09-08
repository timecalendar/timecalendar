/* global http, E2E_SERVER_URL */

http.post(`${E2E_SERVER_URL}/__e2e/export-guide/fail-next`, {
  body: JSON.stringify({}),
  headers: { "Content-Type": "application/json" },
})
