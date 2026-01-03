export default {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [
          { path: "dist/pplx-linux-x64", label: "pplx-linux-x64" },
          { path: "dist/pplx-linux-arm64", label: "pplx-linux-arm64" },
          { path: "dist/pplx-darwin-x64", label: "pplx-darwin-x64" },
          { path: "dist/pplx-darwin-arm64", label: "pplx-darwin-arm64" },
          { path: "dist/pplx-windows-x64.exe", label: "pplx-windows-x64.exe" },
          { path: "dist/checksums.txt", label: "checksums.txt" },
        ],
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["package.json"],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};
