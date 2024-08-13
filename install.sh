#!/bin/bash

set -euo pipefail

echo "Installing pmm"

INSTALL_TAG="${1:-latest}"

PMM_DIR="$HOME/.pmm"
PMM_PACKAGE_PATH="$PMM_DIR/package"

if [ -e "$PMM_PACKAGE_PATH" ]; then
  rm -rf "$PMM_PACKAGE_PATH"
fi

mkdir -p "$PMM_PACKAGE_PATH"

global_registry=$(npm config get registry)
fallback_registry="https://registry.npmjs.org/"
default_registry="${global_registry:-$fallback_registry}"
registry="${PMM_NPM_REGISTRY:-$default_registry}"

# remove trailing slash
registry=$( echo $registry | sed 's|/$||' )

echo "Using registry $registry"

package_scope="@ehyland/"
package_name="pmm"
package_name_full="$package_scope$package_name"
extract_package_from_manifest_script="
  let dataString = '';
  process.stdin.setEncoding('utf8')
    .on('data', (chunk) => dataString+=chunk )
    .on('end', () => {
      const manifest = JSON.parse(dataString);
      const version = manifest['dist-tags']['$INSTALL_TAG'];
      const pkg = manifest['versions'][version];
      console.log(JSON.stringify(pkg));
    })
"
extract_tarball_from_package="
  let dataString = '';
  process.stdin.setEncoding('utf8')
    .on('data', (chunk) => dataString+=chunk )
    .on('end', () => {
      const pkg = JSON.parse(dataString);
      const tarball = pkg['dist']['tarball'];
      console.log(tarball);
    })
"

extract_version_from_package="
  let dataString = '';
  process.stdin.setEncoding('utf8')
    .on('data', (chunk) => dataString+=chunk )
    .on('end', () => {
      const pkg = JSON.parse(dataString);
      const version = pkg['version'];
      console.log(version);
    })
"

manifest=$(curl -fsSL "${registry}/${package_name_full}")
package=$(echo "$manifest" | node -e "$extract_package_from_manifest_script")
version=$(echo "$package" | node -e "$extract_version_from_package")
tarball=$(echo "$package" | node -e "$extract_tarball_from_package")

echo "Downloading pmm@${version}"

curl -fsSL "${tarball}" | tar -C "$PMM_PACKAGE_PATH" -xz --strip 1

chmod -R +x "$PMM_PACKAGE_PATH/bin/"

echo "Installed to $PMM_DIR"
echo ''
echo 'To Complete Installation'
echo '------------------------'
echo 'Add the following to your ~/.bashrc'
echo '  export PMM_DIR="$HOME/.pmm"'
echo '  export PMM_NPM_REGISTRY="'$registry'"'
echo '  [ -s "$PMM_DIR/package/enable.sh" ] && \. "$PMM_DIR/package/enable.sh"  # This loads pmm shims'
