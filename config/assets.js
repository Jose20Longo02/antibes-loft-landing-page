function getAssetVersion() {
  if (process.env.ASSET_VERSION) return process.env.ASSET_VERSION;
  if (process.env.RENDER_GIT_COMMIT) return process.env.RENDER_GIT_COMMIT.slice(0, 12);
  return require('../package.json').version;
}

function assetUrl(path) {
  const version = getAssetVersion();
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}v=${version}`;
}

module.exports = { getAssetVersion, assetUrl };
