#!/bin/bash

set -euo pipefail

echo "Installing pmm"

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
parse_json_script="
  let dataString = '';
  process.stdin.setEncoding('utf8')
    .on('data', (chunk) => dataString+=chunk )
    .on('end', () => {
      const manifest = JSON.parse(dataString);
      const latest = manifest['dist-tags']['latest'];
      const tarball = manifest['versions'][latest]['dist']['tarball'];
      console.log(tarball);
    })
"

manifest=$(curl -fsSL "${registry}/${package_name_full}")
tarball=$(echo "$manifest" | node -e "$parse_json_script")

curl -fsSL "${tarball}" | tar -C "$PMM_PACKAGE_PATH" -xz --strip 1

chmod -R +x "$PMM_PACKAGE_PATH/bin/"

echo "Installed to $PMM_DIR"
echo 'Add the following to your ~/.bashrc'
echo '  export PMM_DIR="$HOME/.pmm"'
echo '  [ -s "$PMM_DIR/package/enable.sh" ] && \. "$PMM_DIR/package/enable.sh"  # This loads pmm shims'
