import getConfig from 'next/config';

export function getTempDir() {
  const { serverRuntimeConfig } = getConfig();
  return serverRuntimeConfig.TEMP_DIR;
} 