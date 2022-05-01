#!/bin/bash

set -euo pipefail

default_registry="https://registry.npmjs.org"
registry="${PMM_NPM_REGISTRY:-$default_registry}"

package_scope="@ehyland/"
package_name="pmm"
package_name_full="$package_scope$package_name"
parse_json_script="
  let dataString = '';
  process.stdin.setEncoding('utf8')
    .on('data', (chunk) => dataString+=chunk )
    .on('end', () => console.log(JSON.parse(dataString).version))
"

version=$(
  curl -fsSL "${registry}/${package_name_full}/latest" \
  | node -e "$parse_json_script"
)

echo "Installing $version"

PMM_DIR="$HOME/.pmm"
PMM_PACKAGE_PATH="$PMM_DIR/package"

if [ -e "$PMM_PACKAGE_PATH" ]; then
  rm -rf "$PMM_PACKAGE_PATH"
fi

mkdir -p "$PMM_PACKAGE_PATH"

curl -fsSL "${registry}/${package_name_full}/-/$package_name-${version}.tgz" | tar -C "$PMM_PACKAGE_PATH" -xz --strip 1

echo "Installed to $PMM_DIR"
echo 'Add the following to your ~/.bashrc'
echo '  export PMM_DIR="$HOME/.pmm"'
echo '  [ -s "$PMM_DIR/package/enable.sh" ] && \. "$PMM_DIR/package/enable.sh"  # This loads pmm shims'
