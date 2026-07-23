const SKIP_KEYS = new Set([
  "Actions",
  "Oem",
  "Links",
  "LogServices",
  "EventService",
  "SessionService",
  "CertificateService",
  "UpdateService",
  "TelemetryService",
  "MetricReports",
  "Registries",
]);

const SKIP_PATHS = [
  "/Managers/",
  "/TaskService/",
  "/Sessions/",
  "/EventService/",
  "/UpdateService/",
  "/CertificateService/",
];

function shouldFollow(path) {
  return !SKIP_PATHS.some((skip) => path.includes(skip));
}

module.exports = {
  SKIP_KEYS,
  shouldFollow,
};
